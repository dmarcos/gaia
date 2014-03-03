define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var bind = require('lib/bind');
var find = require('lib/find');
var CameraUtils = require('lib/camera-utils');
var ZoomBar = require('lib/zoom-bar');
var debug = require('debug')('view:viewfinder');
var constants = require('config/camera');
var View = require('vendor/view');
var find = require('lib/find');
/**
 * Locals
 */

var lastTouchA = null;
var lastTouchB = null;
var isScaling = false;
var isZoomEnabled = false;
var scaleSizeTo = {
  fill: CameraUtils.scaleSizeToFillViewport,
  fit: CameraUtils.scaleSizeToFitViewport
};

var getNewTouchA = function(touches) {
  if (!lastTouchA) return null;
  for (var i = 0, length = touches.length, touch; i < length; i++) {
    touch = touches[i];
    if (touch.identifier === lastTouchA.identifier) return touch;
  }
  return null;
};

var getNewTouchB = function(touches) {
  if (!lastTouchB) return null;
  for (var i = 0, length = touches.length, touch; i < length; i++) {
    touch = touches[i];
    if (touch.identifier === lastTouchB.identifier) return touch;
  }
  return null;
};

var getDeltaScale = function(touchA, touchB) {
  if (!touchA || !lastTouchA || !touchB || !lastTouchB) return 0;

  var oldDistance = Math.sqrt(Math.pow(lastTouchB.pageX -
                                       lastTouchA.pageX, 2) +
                    Math.pow(lastTouchB.pageY - lastTouchA.pageY, 2));
  var newDistance = Math.sqrt(Math.pow(touchB.pageX - touchA.pageX, 2) +
                    Math.pow(touchB.pageY - touchA.pageY, 2));
  return newDistance - oldDistance;
};

var clamp = function(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
};

module.exports = View.extend({
  name: 'viewfinder',
  className: 'js-viewfinder',
  fadeTime: 200,

  initialize: function() {
    this.render();

    // Bind events
    bind(this.el, 'click', this.onClick);

    this.on('inserted', raf(this.getSize));

    bind(this.el, 'touchstart', this.onTouchStart);
    bind(this.el, 'touchmove', this.onTouchMove);
    bind(this.el, 'touchend', this.onTouchEnd);
    bind(this.els.zoomBar, 'change', this.onZoomBarChange);
  },

  render: function() {
    this.el.innerHTML = this.template();

    // Find elements
    this.els.frame = this.find('.js-frame');
    this.els.video = this.find('.js-video');
    this.els.zoomBar = find('.zoom-bar', this.el);

    bind(this.els.frame, 'click', this.onClick);

    // Initialize ZoomBar
    this.zoomBar = new ZoomBar(this.els.zoomBar);
  },

  template: function() {
    return '<div class="viewfinder_frame js-frame">' +
        '<video class="viewfinder_video js-video" autoplay></video>' +
      '</div>' +
      '<div class="viewfinder_grid">' +
        '<div class="row-1"></div>' +
        '<div class="row-2"></div>' +
        '<div class="col-1"></div>' +
        '<div class="col-2"></div>' +
      '</div>' +
      '<div class="zoom-bar">' +
        '<div class="zoom-bar-inner">' +
          '<div class="zoom-bar-handle"></div>' +
        '</div>' +
      '</div>';
  },

  onClick: function(e) {
    e.stopPropagation();
    this.emit('click');
  },

  onTouchStart: function(evt) {
    var touchCount = evt.touches.length;
    if (touchCount === 2) {
      lastTouchA = evt.touches[0];
      lastTouchB = evt.touches[1];
      isScaling = true;

      evt.preventDefault();
    }
  },

  onTouchMove: function(evt) {
    if (!isScaling) {
      return;
    }

    var touchA = getNewTouchA(evt.touches);
    var touchB = getNewTouchB(evt.touches);

    var deltaScale = getDeltaScale(touchA, touchB);
    var scale = this._scale * (1 + (deltaScale / 200));

    this.setScale(scale);

    lastTouchA = touchA;
    lastTouchB = touchB;
  },

  onTouchEnd: function(evt) {
    var touchCount = evt.touches.length;
    if (touchCount < 2) {
      isScaling = false;
    }
  },

  getSize: function() {
    this.container = {
      width: this.el.clientHeight,
      height: this.el.clientWidth
    };
  },

  onZoomBarChange: function(evt) {
    var value = evt.detail / 100;
    var range = this._maximumZoom - this._minimumZoom;
    var scale = (range * value) + this._minimumZoom;

    this.setScale(scale);
  },

  enableZoom: function(minimumZoom, maximumZoom) {
    if (minimumZoom) {
      this._minimumZoom = minimumZoom;
    }

    if (maximumZoom) {
      this._maximumZoom = maximumZoom;
    }

    isZoomEnabled = true;
  },

  disableZoom: function() {
    this._minimumZoom = 1.0;
    this._maximumZoom = 1.0;

    this.setScale(1.0);

    isZoomEnabled = false;
  },

  _minimumZoom: 1.0,

  setMinimumZoom: function(minimumZoom) {
    this._minimumZoom = minimumZoom;
  },

  _maximumZoom: 1.0,

  setMaximumZoom: function(maximumZoom) {
    this._maximumZoom = maximumZoom;
  },

  _scale: 1.0,

  setScale: function(scale) {
    if (!isZoomEnabled) {
      return;
    }

    this._scale = clamp(scale, this._minimumZoom, this._maximumZoom);

    this.emit('scaleChange', this._scale);

    if (this._scale > this._minimumZoom) {
      this.el.classList.add('zooming');
    }

    else {
      this.el.classList.remove('zooming');
    }

    var range = this._maximumZoom - this._minimumZoom;
    var percent = (this._scale - this._minimumZoom) / range * 100;

    this.zoomBar.setValue(percent);
  },

  setScaleAdjustment: function(scaleAdjustment) {
    this.els.video.style.transform = 'scale(' + scaleAdjustment + ')';
  },

  setPreviewStream: function(previewStream) {
    this.els.video.mozSrcObject = previewStream;
  },

  setStream: function(stream, done) {
    this.setPreviewStream(stream);
    this.startPreview();
  },

  startPreview: function() {
    this.els.video.play();
  },

  stopPreview: function() {
    this.els.video.pause();
  },

  fadeOut: function(done) {
    this.el.classList.remove('visible');
    if (done) { setTimeout(done, this.fadeTime);}
  },

  fadeIn: function(done) {
    this.el.classList.add('visible');
    if (done) { setTimeout(done, this.fadeTime); }
  },

  updatePreview: function(preview, mirrored) {
    var container = this.container;
    var aspects = {
      container: container.width / container.height,
      preview: preview.width / preview.height,
      standard: 4 / 3
    };

    var aspectFill = aspects.preview > aspects.container;
    var scaleType = aspectFill ? 'fill' : 'fit';
    var scaled = scaleSizeTo[scaleType](container, preview);
    var centered = aspectFill || (aspects.preview < aspects.standard);
    var yOffset = centered ? (container.width - scaled.width) / 2 : 0;

    this.els.frame.style.width = scaled.width + 'px';
    this.els.frame.style.height = scaled.height + 'px';
    this.els.frame.style.top = yOffset + 'px';
    this.els.frame.classList.toggle('reversed', mirrored);

    debug('update preview, mirrored: %s, scale: %s, yOffset: %s',
      mirrored, scaleType, yOffset);

    return this;
  }
});

function raf(fn) {
  return function() { requestAnimationFrame(fn); };
}

});
