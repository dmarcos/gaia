define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('controller:viewfinder');
var bindAll = require('lib/bind-all');
/**
 * Exports
 */

module.exports = function(app) { return new ViewfinderController(app); };
module.exports.ViewfinderController = ViewfinderController;

/**
 * Initialize a new `ViewfinderController`
 *
 * @param {App} app
 */
function ViewfinderController(app) {
  debug('initializing');
  bindAll(this);
  this.app = app;
  this.camera = app.camera;
  this.activity = app.activity;
  this.filmstrip = app.filmstrip;
  this.settings = app.settings;
  this.viewfinder = app.views.viewfinder;
  this.bindEvents();
  this.configure();
  debug('initialized');
}

ViewfinderController.prototype.configure = function() {
  var shouldFill = this.app.settings.viewfinderFill.selected('value');
  var grid = this.app.settings.grid.selected('key');
  this.viewfinder.set('grid', grid);
  this.viewfinder.fill = shouldFill;
};

ViewfinderController.prototype.bindEvents = function() {
  this.app.settings.on('change:grid', this.viewfinder.setter('grid'));
  this.viewfinder.on('click', this.app.firer('viewfinder:click'));
  this.viewfinder.on('click', this.onViewfinderClick);
  this.viewfinder.on('pinch', this.onPinch);
  this.app.on('camera:configured', this.loadStream);
  this.app.on('camera:configured', this.updatePreview);
  this.app.on('blur', this.onBlur);
  this.camera.on('zoomChange', this.onZoomChange);
};

ViewfinderController.prototype.loadStream = function() {
  this.camera.loadStreamInto(this.viewfinder.els.video);
};

ViewfinderController.prototype.updatePreview = function() {
  var camera = this.app.settings.cameras.selected('key');
  var isFrontCamera = camera === 'front';
  this.viewfinder.updatePreview(this.camera.previewSize(), isFrontCamera);

  var enableZoom = this.camera.isZoomSupported() &&
                   this.app.settings.enableZoom.selected().value;
  if (enableZoom) {
    this.viewfinder.enableZoom(this.camera.getMinimumZoom(),
                               this.camera.getMaximumZoom());
  } else {
    this.viewfinder.disableZoom();
  }

  // Fade in 100ms later to avoid
  // seeing viewfinder being resized
  setTimeout(this.viewfinder.fadeIn, 150);
};

ViewfinderController.prototype.onPinch = function(zoom) {
  this.camera.setZoom(zoom);
};

ViewfinderController.prototype.onZoomChange = function(zoom) {
  var zoomPreviewAdjustment = this.camera.getZoomPreviewAdjustment();
  this.viewfinder.setZoomPreviewAdjustment(zoomPreviewAdjustment);
  this.viewfinder.setZoom(zoom);
};

/**
 * Toggles the filmstrip, but not
 * whilst recording or within an
 * activity session.
 *
 * @private
 */
ViewfinderController.prototype.onViewfinderClick = function() {
  var recording = this.app.get('recording');
  if (recording || this.activity.active) { return; }
  this.filmstrip.toggle();
  debug('click');
};

ViewfinderController.prototype.onBlur = function() {
  this.viewfinder.stopPreview();
  this.viewfinder.setPreviewStream(null);
  this.viewfinder.fadeOut();
};

});
