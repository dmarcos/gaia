define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var performanceTesting = require('performanceTesting');
var ViewfinderView = require('views/viewfinder');
var IndicatorsView = require('views/indicators');
var ControlsView2 = require('views/controls-2');
var RecordingTimerView = require('views/recording-timer');
var ControlsView = require('views/controls');
var FocusRing = require('views/focus-ring');
var lockscreen = require('lib/lock-screen');
var constants = require('config/camera');
var broadcast = require('lib/broadcast');
var cookies = require('vendor/cookies');
var bindAll = require('lib/bind-all');
var model = require('vendor/model');
var debug = require('debug')('app');
var LazyL10n = require('LazyL10n');
var HudView = require('views/hud');
var bind = require('lib/bind');
var dcf = require('lib/dcf');

/**
 * Locals
 */

var LOCATION_PROMPT_DELAY = constants.PROMPT_DELAY;
var unbind = bind.unbind;

// Mixin model methods
model(App.prototype);

/**
 * Exports
 */

module.exports = App;

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
  bindAll(this);
  this.el = options.el;
  this.win = options.win;
  this.doc = options.doc;
  this.inSecureMode = (this.win.location.hash === '#secure');
  this.controllers = options.controllers;
  this.geolocation = options.geolocation;
  this.filmstrip = options.filmstrip;
  this.activity = options.activity;
  this.views = options.views;
  this.config = options.config;
  this.settings = options.settings;
  this.storage = options.storage;
  this.camera = options.camera;
  this.sounds = options.sounds;
  this.cookies = cookies;
  debug('initialized');
}

/**
 * Runs all the methods
 * to boot the app.
 *
 * @public
 */
App.prototype.boot = function() {
  this.configure();
  this.initializeViews();
  this.runControllers();
  this.injectViews();
  this.bindEvents();
  this.miscStuff();
  this.emit('boot');
  debug('booted');
};

App.prototype.configure = function() {
  var newControls = this.settings.newControls.selected('value');
  var mode = this.activity.mode;
  if (mode) { this.set('mode', mode, { silent: true }); }
  this.ControlsView = newControls ? ControlsView2 : ControlsView;
};

App.prototype.teardown = function() {
  this.unbindEvents();
};

/**
 * Runs controllers to glue all
 * the parts of the app together.
 *
 * NOTE: Order that controllers
 * run, can be important!
 *
 * @private
 */
App.prototype.runControllers = function() {
  debug('running controllers');
  this.filmstrip = this.filmstrip(this);
  this.controllers.settings(this);
  this.controllers.activity(this);
  this.controllers.timer(this);
  this.controllers.camera(this);
  this.controllers.viewfinder(this);
  this.controllers.indicators(this);
  this.controllers.recordingTimer(this);
  this.controllers.controls(this);
  this.controllers.confirm(this);
  this.controllers.overlay(this);
  this.controllers.sounds(this);
  this.controllers.hud(this);
  this.controllers.focusmode(this);
  debug('controllers run');
};

App.prototype.initializeViews = function() {
  if (this.views) { return; }
  this.views = {};
  this.views.viewfinder = new ViewfinderView();
  this.views.controls = new this.ControlsView();
  this.views.indicators = new IndicatorsView();
  this.views.recordingTimer = new RecordingTimerView();
  this.views.focusRing = new FocusRing();
  this.views.hud = new HudView();
  debug('views initialized');
};

App.prototype.injectViews = function() {
  this.views.viewfinder.appendTo(this.el);
  this.views.recordingTimer.appendTo(this.el);
  this.views.indicators.appendTo(this.el);
  this.views.focusRing.appendTo(this.el);
  this.views.controls.appendTo(this.el);
  this.views.hud.appendTo(this.el);
  debug('views injected');
};

/**
 * Attaches event handlers.
 *
 * @private
 */
App.prototype.bindEvents = function() {
  this.storage.once('checked:healthy', this.geolocationWatch);
  bind(this.doc, 'visibilitychange', this.onVisibilityChange);
  bind(this.win, 'beforeunload', this.onBeforeUnload);
  bind(this.el, 'click', this.onClick);
  this.on('focus', this.onFocus);
  this.on('blur', this.onBlur);
  debug('events bound');
};

/**
 * Detaches event handlers.
 *
 * @private
 */
App.prototype.unbindEvents = function() {
  unbind(this.doc, 'visibilitychange', this.onVisibilityChange);
  unbind(this.win, 'beforeunload', this.onBeforeUnload);
  this.off('focus', this.onFocus);
  this.off('blur', this.onBlur);
  debug('events unbound');
};

/**
 * Tasks to run when the
 * app becomes visible.
 *
 * Check the storage again as users
 * may have made changes since the
 * app was minimised
 *
 * @private
 */
App.prototype.onFocus = function() {
  var ms = LOCATION_PROMPT_DELAY;
  setTimeout(this.geolocationWatch, ms);
  this.storage.check();
  debug('focus');
};

/**
 * Tasks to run when the
 * app is minimised/hidden.
 *
 * @private
 */
App.prototype.onBlur = function() {
  this.geolocation.stopWatching();
  this.activity.cancel();
  debug('blur');
};

App.prototype.onClick = function() {
  debug('click');
  this.emit('click');
};

/**
 * Begins watching location
 * if not within a pending
 * activity and the app
 * isn't currently hidden.
 *
 * @private
 */
App.prototype.geolocationWatch = function() {
  var shouldWatch = !this.activity.active && !this.doc.hidden;
  if (shouldWatch) {
    this.geolocation.watch();
    debug('geolocation watched');
  }
};

/**
 * Responds to the `visibilitychange`
 * event, emitting useful app events
 * that allow us to perform relate
 * work elsewhere.
 *
 * @private
 */
App.prototype.onVisibilityChange = function() {
  if (this.doc.hidden) { this.emit('blur'); }
  else { this.emit('focus'); }
};

/**
 * Runs just before the
 * app is destroyed.
 *
 * @private
 */
App.prototype.onBeforeUnload = function() {
  this.views.viewfinder.setPreviewStream(null);
  this.emit('beforeunload');
  debug('beforeunload');
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
 */
App.prototype.miscStuff = function() {
  var camera = this.camera;
  var focusTimeout;
  var self = this;

  // TODO: Should probably be
  // moved to a focusRing controller
  camera.on('change:focus', function(value) {
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

  debug('misc stuff done');
};

});
