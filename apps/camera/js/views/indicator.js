define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var View = require('vendor/view');
var bind = require('lib/bind');
var find = require('lib/find');
var orientation = require('lib/orientation');
/**
 *Exports
 */
module.exports = View.extend({
  name:'indicator',
  
  initialize: function() {
    this.render();
  },

  render: function() {
    this.el.innerHTML = this.template();
    this.els.hdrstatus = find('.js-hdrstatus', this.el);
    this.els.geotagging = find('.js-geotagging', this.el);
    this.els.capturetimer = find('.js-capturetimer', this.el);
    this.els.batterystatus = find('.js-battery-status', this.el);
    this.setOrientation(orientation.get());
    orientation.on('orientation', this.setOrientation);
  },

  template: function() {
    return '<ul><li class="js-capturetimer icon-self-timer rotates"></li>'+
    '<li class="js-hdrstatus icon-hdr rotates"></li>'+
    '<li class="js-battery-status batteryStatus rotates"></li></ul>';
  },

  /**
   * Set HDR Incicator
   */

  setHDRindicator: function(value) {
    this.els.hdrstatus.dataset.mode = value;
  },

  /**
   * Set self timer  Incicator
   */

  setCaptureTimer: function(value) {
    if (value == 'off') {
      this.els.capturetimer.dataset.mode = value;
    } else {
      this.els.capturetimer.dataset.mode = 'on';
    }
  },

  /**
   * Set low battery  Incicator
   */

  setBatteryStatus: function(batteryObj) {
    this.els.batterystatus.classList.remove('icon-battery-15');
    this.els.batterystatus.classList.remove('icon-battery-10');
    var className = batteryObj.icon;
    this.els.batterystatus.classList.add(className);
    this.els.batterystatus.dataset.value = batteryObj.value;
  },

  /**
   * on orientation change 
   * set the orientation for indicator
   */

  setOrientation: function(orientation) {
    this.el.dataset.orientation = orientation;
  }
});
});