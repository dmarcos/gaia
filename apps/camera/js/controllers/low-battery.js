define(function(require, exports, module) {
  /*jshint laxbreak:true*/

'use strict';

/**
 * Dependencies
 */

var bindAll = require('lib/bind-all');
var debug = require('debug')('controller:lowbattery');
var bind = require('lib/bind');
/**
 * Local variables
 **/

var indicatorConfig = require('config/indicator');

/**
 * Exports
 */
exports = module.exports = function(app) {
  return new LowBatteryController(app);
};
/**
 * Initialize a new `LowBatteryController`
 *
 * @param {Object} options
 */
function LowBatteryController(app) {
  this.app = app;
  this.camera = app.camera;
  this.battery = navigator.battery || navigator.mozBattery;
  this.lowBattery = app.views.lowBattery;
  bindAll(this);
  this.bindEvents();
  this.lowBatteryHandler();
  debug('initialized');
}

/**
 * Bind callbacks to required events.
 *
 */
LowBatteryController.prototype.bindEvents = function() {
  //Bind battery level change events
  bind(this.battery, 'levelchange', this.lowBatteryHandler);
  bind(this.battery, 'chargingchange', this.lowBatteryHandler)
};
/**
 * lowBatteryHandler` to handle low battery scenario
 *
 * @param {Object} options
 */
LowBatteryController.prototype.lowBatteryHandler = function () {
  var value = Math.round(this.battery.level * 100);
  var charging = this.battery.charging;
  var app = this.app;
  var lowBattery = this.lowBattery;
  if (value <= 5) {
    var camera = this.camera;
    var batteryObj = indicatorConfig.lowbattery[5];
    lowBattery.removeMessage();
    lowBattery.setLowBatteryMessage(batteryObj);
    if (camera.get('recording')) {
      camera.stopRecording();
    }  
    window.setTimeout(function() {
      lowBattery.removeMessage();
      window.close();
   }, 3000);
  } else if (value in indicatorConfig.lowbattery && !charging) {
    var batteryObj = indicatorConfig.lowbattery[value];
    //remove the the message if there is any
    lowBattery.removeMessage();
    //show Low Battery message
    
    lowBattery.setLowBatteryMessage(batteryObj);
  }
};


});