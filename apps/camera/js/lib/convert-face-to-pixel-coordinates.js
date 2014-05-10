define(function(require, exports, module) {
'use strict';

/**
 * Exports
 */

/**
 *  Given a face coordinates as provided by camera controller and
 *  a viewport width and height it returns the face coordinates, radius
 *  and area in pixel coordinates
 */
module.exports = function(face, viewportWidth, viewportHeight) {
  // In camera coordinate system, (-1000, -1000) represents the
  // top-left of the camera field of view, and (1000, 1000) represents
  // the bottom-right of the field of view.
  // For convenience we assume that coordinates go from 0-2000
  var cameraCoordinatesRange = 2000;

  var pixelsPerCameraUnitWidth = viewportWidth / cameraCoordinatesRange;
  var pixelsPerCameraUnitHeight = viewportHeight / cameraCoordinatesRange;
  var faceWidth = face.bounds.width * pixelsPerCameraUnitHeight;
  var faceHeight = face.bounds.height * pixelsPerCameraUnitWidth;
  // var xCameraCoordinates = (cameraCoordinatesRange -
  //  (face.bounds.bottom + 1000));
  // var yCameraCoordinates = (cameraCoordinatesRange -
  //  (face.bounds.right + 1000));
  var xCameraCoordinates = cameraCoordinatesRange - (face.bounds.bottom + 1000);
  var yCameraCoordinates = face.bounds.left + 1000;
  var xPixelCoordinates = xCameraCoordinates * pixelsPerCameraUnitWidth;
  var yPixelCoordinates = yCameraCoordinates * pixelsPerCameraUnitHeight;
  var radius = Math.round(Math.max(faceWidth, faceHeight));

  return {
    x: xPixelCoordinates,
    y: yPixelCoordinates,
    radius: radius
  };

};

});
