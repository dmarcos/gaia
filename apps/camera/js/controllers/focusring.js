define(function(require, exports, module) {
'use strict';
/**
* Dependencies
*/
var debug = require('debug')('controller:focusring');
var bindAll = require('lib/bind-all');

/**
 * Locals
 */
var lastEventTime = 0;

/**
* Exports
*/
module.exports = function(app) { return new focusringController(app); };
module.exports.focusringController = focusringController;

 /**
 * Initialize a new `focusringController`
 *
 * @param {App} app
 */
function focusringController(app) {
  bindAll(this);
  this.app = app;
  this.camera = app.camera;
  this.viewfinder = app.views.viewfinder;
  this.focusRing = app.views.focusRing;
  this.bindEvents();
}

focusringController.prototype.bindEvents = function() {
  this.viewfinder.on('focuspointchange', this.onFocusPointChange);
  this.camera.on('configured', this.setDefaultFocusMode);
  this.app.on('camera:facedetected', this.onFacedetected);
  // When device is not capable of face focus
  // switch to Continuous autofocus or no focus mode
  this.app.on('camera:nofacefocus', this.switchFocusMode);
};

 /**
 * Start with face detection as default
 * Focus Mode
 */
focusringController.prototype.setDefaultFocusMode = function() {
  var cameraID = this.app.settings.cameras.selected('key');
  // Restrict focus only for rear camera
  if (cameraID != 'front') {
    this.focusRing.clearFaceRings();
    this.camera.startFaceDetection();
  }
};

 /**
 * When there is face detection available switch
 * to continuous Auto Focus Mode
 */
focusringController.prototype.switchFocusMode = function() {
  // Clear all face focus related UI
  this.focusRing.clearFaceRings();
  var focusPoint = { x: 0, y: 0 };
  focusPoint.x = this.viewfinder.els.frame.clientHeight / 2;
  focusPoint.y = this.viewfinder.els.frame.clientWidth / 2;

  // change focus ring positon to default (center of the screen)
  this.focusRing.changePostion(focusPoint);

  // Switch to continuous auto focus mode
  // ....
};

 /**
 * On detecting atleast one face,
 * gecko send success callback.
 *
 * @param {faces} object
 * All the face coordinates are in
 * camera coordinates (-1000 to 1000).
 * These values need to mapped to
 * pixels.
 */
focusringController.prototype.onFacedetected = function(faces) {
  // Local Variables
  var maxID = -1;
  var maxArea = 0;
  var length = 0;
  var breadth = 0;
  var area = 0;
  var i = 0;
  var self = this;
  var mainFace = null;
  var face = [];

  // clear any previous focus rings
  this.focusRing.clearFaceRings();

  // finding scaling factor
  var sw = this.viewfinder.els.frame.clientWidth / 2000;
  var sh = this.viewfinder.els.frame.clientHeight / 2000;

  // Convert the face values which are
  // in camera coordinate system to
  // pixels.
  for (i = 0; i < faces.length; i++) {
    // Neglect the faces with
    // low confidence.
    if (faces[i].score < 20) {
      continue;
    }
    length = Math.abs(faces[i].rect.right - faces[i].rect.left);
    breadth = Math.abs(faces[i].rect.bottom - faces[i].rect.top);
    area = length * breadth;
    var px = Math.round(faces[i].rect.left * sw);
    var py = Math.round((-1) * ((faces[i].rect.bottom +
      faces[i].rect.top) / 2) * sh);
    var lx = Math.round(length * sw);

    face[i] = {
      pointX: px,
      pointY: py,
      length: lx,
      index: i
    };
    // Find face which has maximum area
    // to focus on.
    if (area > maxArea) {
      maxArea = area;
      maxID = i;
      mainFace = face[i];
    }

  }
  // remove maximum area face from the array.
  if (maxID > -1) {
    face.splice(maxID, 1);
  }
  // For the face which has to be focused
  this.focusRing.setMaxID(mainFace);
  var k = 0;
  // For all other detected faces.
  while (face[k]) {
    this.focusRing.tranformRing(
      face[k].pointX,
      face[k].pointY,
      face[k].length,
      face[k].index
    );
    k++;
  }
  var currentTime = new Date().getTime() / 1000;
  if (Math.floor(currentTime - lastEventTime) < 3) {
    return;
  }
  lastEventTime = currentTime;
  var rect = {
    left: faces[maxID].rect.left,
    right: faces[maxID].rect.right,
    top: faces[maxID].rect.top,
    bottom: faces[maxID].rect.bottom
  };
  // set focusing and metering areas
  this.camera.setFocusArea(rect);
  this.camera.setMeteringArea(rect);

  // Call auto focus to focus on focus area.
  this.camera.focus(focusDone);

  // show focussed ring when focused
  function focusDone() {
    // clear ring UI.
    // Timeout is needed to show the focused ring.
    setTimeout(function() {
      self.focusRing.setState('none');
    }, 1000);
  }
};

});
