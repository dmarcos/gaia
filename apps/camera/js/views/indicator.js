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
    this.els.batterystatus = find('.js-battery-status', this.el);
    this.setOrientation(orientation.get());
    orientation.on('orientation', this.setOrientation);
  },
  template: function() {
    return '<ul>'+
           '<li class="js-battery-status batteryStatus rotates">'+
           '</li></ul>';
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
    this.els.batterystatus.dataset.orientation = orientation;
  }
});
});