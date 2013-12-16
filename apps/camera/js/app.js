define(function(require, exports, module) {
/*jshint laxbreak:true*/
'use strict';

/**
 * Dependencies
 */

var bind = require('utils/bind');
var LazyL10n = require('LazyL10n');
var constants = require('constants');
var broadcast = require('broadcast');
var bindAll = require('utils/bindAll');
var performanceTesting = require('performanceTesting');
var lockscreen = require('lockscreen');
var evt = require('libs/evt');
var dcf = require('dcf');

/**
 * Locals
 */

var LOCATION_PROMPT_DELAY = constants.PROMPT_DELAY;
var proto = evt.mix(App.prototype);
var unbind = bind.unbind;

/**
 * Exports
 */

exports.App = App;

/**
 * Initialize a new `App`
 *
 * Options:
 *
 *   - `root` The node to inject content into
 *
 * @param {Object} options
 * @constructor
 */
function App(options) {
  options = options || {};
  this.inSecureMode = window.parent !== window;
  this.el = options.el;
  this.geolocation = options.geolocation;
  this.activity = options.activity;
  this.camera = options.camera;
  this.sounds = options.sounds;
  this.views = options.views;
  this.controllers = options.controllers;
  this.doc = options.doc;

  // Bind context
  bindAll(this);
}

/**
 * Runs all the methods
 * to boot the app.
 *
 * @api private
 */
proto.boot = function() {
  this.runControllers();
  this.injectContent();
  this.bindEvents();
  this.miscStuff();
  this.geolocationWatch();
  this.emit('boot');
};

proto.teardown = function() {
  this.unbindEvents();
};

/**
 * Runs controllers to glue all
 * the parts of the app together.
 *
 * @api private
 */
proto.runControllers = function() {
  this.controllers.viewfinder(this);
  this.controllers.controls(this);
  this.controllers.overlay(this);
  this.controllers.camera(this);
  this.controllers.hud(this);
};

/**
 * Injects view DOM into
 * designated root node.
 *
 * @return {[type]} [description]
 */
proto.injectContent = function() {
  this.views.hud.appendTo(this.el);
  this.views.controls.appendTo(this.el);
  this.views.viewfinder.appendTo(this.el);
  this.views.focusRing.appendTo(this.el);
};

/**
 * Attaches callbacks to
 * some important events.
 *
 * @api private
 */
proto.bindEvents = function() {
  bind(this.doc, 'visibilitychange', this.onVisibilityChange);
  bind(window, 'beforeunload', this.onBeforeUnload);
  this.on('focus', this.onFocus);
  this.on('blur', this.onBlur);
};

proto.unbindEvents = function() {
  unbind(this.doc, 'visibilitychange', this.onVisibilityChange);
  unbind(this.doc, 'beforeunload', this.onBeforeUnload);
  this.off('focus', this.onFocus);
  this.off('blur', this.onBlur);
};

/**
 * Tasks to run when the
 * app becomes visible.
 *
 * @api private
 */
proto.onFocus = function() {
  var ms = LOCATION_PROMPT_DELAY;
  setTimeout(this.geolocationWatch, ms);
};

/**
 * Tasks to run when the
 * app is minimised/hidden.
 *
 * @api private
 */
proto.onBlur = function() {
  this.geolocation.stopWatching();
  this.activity.cancel();
};

/**
 * Begins watching location
 * if not within a pending
 * activity and the app
 * isn't currently hidden.
 *
 * @api private
 */
proto.geolocationWatch = function() {
  var shouldWatch = !this.activity.active && !this.doc.hidden;
  if (shouldWatch) {
    this.geolocation.watch();
  }
};

/**
 * Responds to the `visibilitychange`
 * event, emitting useful app events
 * that allow us to perform relate
 * work elsewhere,
 *
 * @api private
 */
proto.onVisibilityChange = function() {
  if (this.doc.hidden) {
    this.emit('blur');
  } else {
    this.emit('focus');
  }
};

/**
 * Runs just before the
 * app is destroyed.
 *
 * @api private
 */
proto.onBeforeUnload = function() {
  this.views.viewfinder.setPreviewStream(null);
  this.emit('beforeunload');
};

/**
 * Miscalaneous tasks to be
 * run when the app first
 * starts.
 *
 * TODO: Eventually this function
 * will be removed, and all this
 * logic will sit in specific places.
 *
 * @api private
 */
proto.miscStuff = function() {
  var camera = this.camera;
  var focusTimeout;
  var self = this;

  // TODO: Should probably be
  // moved to a focusRing controller
  camera.state.on('change:focusState', function(value) {
    self.views.focusRing.setState(value);
    clearTimeout(focusTimeout);

    if (value === 'fail') {
      focusTimeout = setTimeout(function() {
        self.views.focusRing.setState(null);
      }, 1000);
    }
  });


  if (!navigator.mozCameras) {
    // TODO: Need to clarify what we
    // should do in this condition.
  }

  performanceTesting.dispatch('initialising-camera-preview');

  // Prevent the phone
  // from going to sleep.
  lockscreen.disableTimeout();

  // This must be tidied, but the
  // important thing is it's out
  // of camera.js
  LazyL10n.get(function() {
    dcf.init();
    performanceTesting.dispatch('startup-path-done');
  });

  // The screen wakelock should be on
  // at all times except when the
  // filmstrip preview is shown.
  broadcast.on('filmstripItemPreview', function() {
    lockscreen.enableTimeout();
  });

  // When the filmstrip preview is hidden
  // we can enable the  again.
  broadcast.on('filmstripPreviewHide', function() {
    lockscreen.disableTimeout();
  });
};

});