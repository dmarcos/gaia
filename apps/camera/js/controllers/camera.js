define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('controller:camera');
var bindAll = require('lib/bind-all');

/**
 * Exports
 */

exports = module.exports = function(app) { return new CameraController(app); };
exports.CameraController = CameraController;

/**
 * Initialize a new `CameraController`
 *
 * @param {App} app
 */
function CameraController(app) {
  debug('initializing');
  bindAll(this);
  this.app = app;
  this.camera = app.camera;
  this.storage = app.storage;
  this.settings = app.settings;
  this.activity = app.activity;
  this.filmstrip = app.filmstrip;
  this.viewfinder = app.views.viewfinder;
  this.controls = app.views.controls;
  this.hud = app.views.hud;
  this.hdrEnabled = !this.settings.hdr.get('disabled');
  this.configure();
  this.bindEvents();
  debug('initialized');
}

/**
 * Configure the camera with
 * initial configuration derived
 * from various startup parameters.
 *
 * @private
 */
CameraController.prototype.configure = function() {
  var settings = this.app.settings;
  var activity = this.activity;
  var camera = this.camera;

  // Configure the 'cameras' setting using the
  // cameraList data given by the camera hardware
  settings.cameras.resetOptions(camera.cameraList);

  // This is set so that the video recorder can
  // automatically stop when video size limit is reached.
  camera.set('maxFileSizeBytes', activity.data.maxFileSizeBytes);
  camera.set('selectedCamera', settings.cameras.selected('key'));
  camera.setMode(settings.mode.selected('key'));
  debug('configured');
};

CameraController.prototype.bindEvents = function() {
  var settings = this.settings;
  var camera = this.camera;
  var app = this.app;

  // Relaying camera events means other modules
  // don't have to depend directly on camera
  camera.on('change:videoElapsed', app.firer('camera:recorderTimeUpdate'));
  camera.on('change:capabilities', this.app.setter('capabilities'));
  camera.on('configured', app.firer('camera:configured'));
  camera.on('change:recording', app.setter('recording'));
  camera.on('recording', app.firer('camera:recording'));
  camera.on('shutter', app.firer('camera:shutter'));
  camera.on('loaded', app.firer('camera:loaded'));
  camera.on('ready', app.firer('camera:ready'));
  camera.on('busy', app.firer('camera:busy'));

  // Camera
  camera.on('filesizelimitreached', this.onFileSizeLimitReached);
  camera.on('newimage', this.onNewImage);
  camera.on('newvideo', this.onNewVideo);

  // App
  app.on('settings:configured', this.onSettingsConfigured);
  app.on('timer:end', this.capture);
  app.on('focus', this.camera.load);
  app.on('capture', this.capture);
  app.on('boot', this.camera.load);
  app.on('blur', this.onBlur);

  // Settings
  settings.pictureSizes.on('change:selected', this.onPictureSizeChange);
  settings.recorderProfiles.on('change:selected', this.onRecorderProfileChange);
  settings.flashModes.on('change:selected', this.setFlashMode);
  settings.flashModes.on('change:selected', this.setHDRForFlash);
  settings.on('change:cameras', this.loadCamera);
  settings.on('change:mode', this.setFlashMode);
  settings.on('change:mode', this.setMode);
  settings.on('change:hdr', this.setHDR);
  settings.on('change:hdr', this.setFlashForHDR);


  debug('events bound');
};

CameraController.prototype.onSettingsConfigured = function() {
  var recorderProfile = this.settings.recorderProfiles.selected('key');
  var pictureSize = this.settings.pictureSizes.selected('data');

  this.setFlashMode();

  this.setHDR(this.settings.hdr.selected('key'));
  this.camera.setRecorderProfile(recorderProfile);
  this.camera.setPictureSize(pictureSize);
  this.camera.configure();

  // TODO: Move to a new StorageController (or App?)
  var maxFileSize = (pictureSize.width * pictureSize.height * 4) + 4096;
  this.storage.setMaxFileSize(maxFileSize);
  debug('camera configured with final settings');
};

CameraController.prototype.capture = function() {
  var position = this.app.geolocation.position;
  this.camera.capture({ position: position });
};

CameraController.prototype.onNewImage = function(image) {
  var filmstrip = this.filmstrip;
  var storage = this.storage;
  var blob = image.blob;
  var self = this;

  // In either case, save
  // the photo to device storage
  storage.addImage(blob, function(filepath) {
    debug('stored image', filepath);
    if (!self.activity.active) {
      filmstrip.addImageAndShow(filepath, blob);
    }
  });

  debug('new image', image);
  this.app.emit('newimage', image);
};

/**
 * Store the poster image,
 * then emit the app 'newvideo'
 * event. This signifies the video
 * fully ready.
 *
 * We don't store the video blob like
 * we do for images, as it is recorded
 * directly to the final location.
 * This is for memory reason.
 *
 * @param  {Object} video
 */
CameraController.prototype.onNewVideo = function(video) {
  var storage = this.storage;
  var poster = video.poster;
  var tmpBlob = video.blob;
  var app = this.app;

  // Add the video to the filmstrip,
  // then save lazily so as not to block UI
  if (!this.activity.active) {
    this.filmstrip.addVideoAndShow(video);
  }

  storage.addVideo(tmpBlob, function(blob, filepath) {
    debug('stored video', filepath);
    video.filepath = filepath;
    video.blob = blob;

    // Add the poster image to the image storage
    poster.filepath = video.filepath.replace('.3gp', '.jpg');
    storage.addImage(poster.blob, { filepath: poster.filepath });

    app.emit('newvideo', video);
  });

  debug('new video', video);
};

CameraController.prototype.onPictureSizeChange = function() {
  var value = this.settings.pictureSizes.selected('data');
  this.setPictureSize(value);
};

CameraController.prototype.onRecorderProfileChange = function() {
  var value = this.settings.recorderProfiles.selected('key');
  this.setRecorderProfile(value);
};

CameraController.prototype.onFileSizeLimitReached = function() {
  this.camera.stopRecording();
  this.showSizeLimitAlert();
};

CameraController.prototype.showSizeLimitAlert = function() {
  if (this.sizeLimitAlertActive) { return; }
  this.sizeLimitAlertActive = true;
  var alertText = this.activity.active ?
    'activity-size-limit-reached' :
    'storage-size-limit-reached';
  alert(navigator.mozL10n.get(alertText));
  this.sizeLimitAlertActive = false;
};

/**
 * Set the mode of the camera, fading
 * otu the viewfinder before reconfiguration.
 *
 * @param {String} mode 'picture'|'video'
 */
CameraController.prototype.setMode = function(mode) {
  this.camera.setMode(mode);
  this.viewfinder.fadeOut(this.camera.configure);
};

/**
 * Set the camera picture size.
 *
 * We only re-configure the camera
 * (resize the preview) if the app
 * is in 'picture' mode.
 *
 * @private
 */
CameraController.prototype.setPictureSize = function(value) {
  var isPicture = this.settings.mode.is('picture');
  this.camera.setPictureSize(value);
  if (isPicture) { this.viewfinder.fadeOut(this.camera.configure); }
};

/**
 * Set the camera `recorderProfile`.
 *
 * We only re-configure the camera
 * (resize the preview) if the app
 * is in 'picture' mode.
 *
 * @private
 */
CameraController.prototype.setRecorderProfile = function(value) {
  var isVideo = this.settings.mode.is('video');
  this.camera.setRecorderProfile(value);
  if (isVideo) { this.viewfinder.fadeOut(this.camera.configure); }
};

/**
 * Change the selected camera.
 *
 * Fading the viewfinder out
 * before re-configuration.
 *
 * @param  {String} value 'front'|'back'
 * @private
 */
CameraController.prototype.loadCamera = function(value) {
  this.camera.set('selectedCamera', value);
  this.viewfinder.fadeOut(this.camera.load);
};

/**
 * Set the camera flash mode to
 * the currently selected flashMode.
 *
 * @private
 */
CameraController.prototype.setFlashMode = function() {
  var mode = this.settings.flashModes.selected('key');
  this.camera.setFlashMode(mode);
};

/**
 * Tearsdown the camera when
 * the application is minimised.
 *
 * @private
 */
CameraController.prototype.onBlur = function() {
  this.camera.set('previewActive', false);
  this.camera.set('focus', 'none');
  this.camera.stopRecording();
  this.camera.release();

  // If the lockscreen is locked
  // then forget everything when closing camera
  if (this.app.inSecureMode) {
    this.filmstrip.clear();
  }

  debug('torn down');
};
/**
* set Self timer value when change from settings
*@ paramet
**/
CameraController.prototype.setSelfTimer = function(value){
  this.camera.configureSelfTimer(value);
};

/**
* cancel Self timer if clicked on viewfinder or any other copenet on screen
*@ paramet
**/
CameraController.prototype.cancelSelfTimer = function(){
    if(this.selfTimer)
    {
      clearInterval(this.selfTimer);
      clearTimeout(this.selfTimeout);
      this.selfTimer = null;
      this.selfTimeout = null;
      // hide timer UI
      this.selfTimerView.removeTimerUI();
    }
};

CameraController.prototype.setHDR = function(value) {
  if (!this.hdrEnabled) { return; }
  this.camera.setHDR(value);
};

CameraController.prototype.setHDRForFlash = function() {
  if (!this.hdrEnabled) { return; }
  var mode = this.settings.flashModes.selected('key');
  var hdrMode = this.settings.hdr.selected('key');
  var isFlashOn = mode != 'off' ? true : false;
  if (hdrMode == 'on' &&  isFlashOn) {
    this.settings.hdr.select('off');
  }
};

CameraController.prototype.setFlashForHDR = function(value) {
  var settings = this.app.settings;
  var flashMode = settings.flashModes.selected('key');
  var model = settings.mode.selected('key') == 'video' ?
              settings.flashModesVideo : settings.flashModesPicture;
  var isFlashOn = flashMode != 'off' ? true : false;
  if (value == 'on' &&  isFlashOn) {
    model.select('off');
  }
};

});
