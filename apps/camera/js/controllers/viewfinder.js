define(function(require, exports, module) {
'use strict';

  /**
   * Dependencies
   */

  var bindAll = require('utils/bindAll');

  /**
   * Locals
   */

  var proto = ViewfinderController.prototype;

  /**
   * Exports
   */

  module.exports = ViewfinderController;

  function ViewfinderController(app) {
    if (!(this instanceof ViewfinderController)) {
      return new ViewfinderController(app);
    }

    this.viewfinder = app.views.viewfinder;
    this.filmstrip = app.views.filmstrip;
    this.activity = app.activity;
    this.camera = app.camera;
    bindAll(this);
    this.bindEvents();
  }

  proto.bindEvents = function() {
    this.camera.on('cameraChange', this.onCameraChange);
    this.viewfinder.on('click', this.onViewfinderClick);
  };

  /**
   * The viewfinder size is updated
   * when the camera is changed.
   *
   * HACK: The viewfinder view has a
   * dependency on the camera.js module
   * due to legacy architecture.
   *
   * @param  {MozCamera} camera
   */
  proto.onCameraChange = function(camera) {
    this.viewfinder.setPreviewSize(camera, this.camera);
  };

  proto.onViewfinderClick = function() {
    var recording = this.camera.state.get('recording');

    // We will just ignore
    // because the filmstrip
    // shouldn't be shown while
    // Camera is recording.
    if (recording || this.activity.active) {
      return;
    }

    this.filmstrip.toggle();
  };

  /**
   * Expose `ViewfinderController`
   */

  exports.ViewfinderController = ViewfinderController;
});