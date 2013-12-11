define(function(require, exports, module) {
'use strict';

/**
 * Locals
 */

var proto = HudController.prototype;

/**
 * Exports
 */

exports = module.exports = create;
exports.HudController = HudController;

/**
 * Create new `HudController`
 * and bind events.
 *
 * @param  {AppController} app
 * @return {HudController}
 * @api public
 */
function create(app) {
  return new HudController(app)
    .bindEvents();
}

/**
 * Initialize a new `HudController`
 *
 * @param {AppController} app
 * @constructor
 * @api private
 */
function HudController(app) {
  this.viewfinder = app.views.viewfinder;
  this.controls = app.views.controls;
  this.hud = app.views.hud;
  this.camera = app.camera;

  // Bind context
  this.onFlashToggle = this.onFlashToggle.bind(this);
  this.onCameraToggle = this.onCameraToggle.bind(this);
  this.onCameraConfigured = this.onCameraConfigured.bind(this);
  this.onRecordingChange = this.onRecordingChange.bind(this);
}

/**
 * Bind callbacks to events.
 *
 * @api private
 */
proto.bindEvents = function() {
  this.hud.on('flashToggle', this.onFlashToggle);
  this.hud.on('cameraToggle', this.onCameraToggle);
  this.camera.on('configured', this.onCameraConfigured);
  this.camera.on('previewResumed', this.hud.enableButtons);
  this.camera.on('preparingToTakePicture', this.hud.disableButtons);
  this.camera.state.on('change:recording', this.onRecordingChange);
};

/**
 * Update UI when a new
 * camera is configured.
 *
 * @api private
 */
proto.onCameraConfigured = function() {
  var hasFrontCamera = this.camera.hasFrontCamera();
  var flashMode = this.camera.getFlashMode();
  this.hud.showCameraToggleButton(hasFrontCamera);
  this.hud.setFlashMode(flashMode);
};

/**
 * Toggles the flash on
 * the camera and UI when
 * the flash button is pressed.
 *
 * @api private
 */
proto.onFlashToggle = function() {
  var mode = this.camera.toggleFlash();
  this.hud.setFlashMode(mode);
};

/**
 * Toggle the camera (front/back),
 * fading the viewfinder in between.
 *
 * @api private
 */
proto.onCameraToggle = function() {
  var controls = this.controls;
  var viewfinder = this.viewfinder;
  var camera = this.camera;
  var hud = this.hud;

  controls.disableButtons();
  hud.disableButtons();
  hud.highlightCameraButton(true);
  viewfinder.fadeOut(onFadeOut);

  function onFadeOut() {
    camera.toggleCamera();
    camera.loadStreamInto(viewfinder.el, onStreamLoaded);
  }

  function onStreamLoaded() {
    viewfinder.fadeIn();
    controls.enableButtons();
    hud.enableButtons();
    hud.highlightCameraButton(false);
  }
};

/**
 * Disable the buttons
 * when recording
 *
 * @param  {Boolean} value
 * @api private
 */
proto.onRecordingChange = function(value) {
  this.hud.toggleDisableButtons(value);
};

});