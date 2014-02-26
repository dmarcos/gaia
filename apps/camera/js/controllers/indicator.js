define(function(require, exports, module) {
/*jshint laxbreak:true*/

  'use strict';

  /**
  * Dependencies
  */

  var bindAll = require('lib/bind-all');
  var debug = require('debug')('controller:indicator');
  var bind = require('lib/bind');
  
  /**
  * Local variables
  **/
  var indicatorConfig = require('config/indicator');

  /**
  * Exports
  */

  exports = module.exports = function(app) {
    return new IndicatorController(app);
  };

  /**
  * Initialize a new `IndicatorController`
  *
  * @param {Object} options
  */

  function IndicatorController(app) {
    debug('initializing');
    this.indicator = app.views.indicator;
    this.camera = app.camera;
    this.app = app;
    //this.lowBattery = app.views.lowBattery;
    //this.battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery;
    this.requireData = null;
    bindAll(this);
    this.setup();
    debug('initialized');
  }
  
  IndicatorController.prototype.bingEvents = function() {
    this.app.on('settings:configured', this.onSettingConfigured);
  };

  /**
  * get the indicators if it is enabled.
  *
  */

  IndicatorController.prototype.setup = function() {
    if (indicatorConfig.Indicators.status) {
      this.requireData = indicatorConfig.Indicators.require ? 
                         require(indicatorConfig.Indicators.require) : null;
      this.getIndicators();
      this.bingEvents();
    }
  };

  /**
  * get the enabled indicators and add to the indicators .
  *
  */

   IndicatorController.prototype.getIndicators = function() {
    var indicatorOpt = indicatorConfig.Indicators.option;
    for (var index in indicatorOpt) {
      if (indicatorOpt[index].status) {
        this.addIndicators(index,indicatorOpt[index]);
      }  
    }

  };

  /**
  * get the acheck the indicator and set the lisners .
  *
  */

  IndicatorController.prototype.addIndicators = function(name, indicatorObj) {
    var events = indicatorObj.eventName;
    switch (name) {
      case "Battery":{
        this.bindBatteryEvents(events);
        break;
      }
      case "HDR":{
        this.bingHDREvents(events);
        break;
      }
      case "SelfTimer":{
        this.bingTimerEvents(events);
        break;
      }
    }
    
  };

 IndicatorController.prototype.bindBatteryEvents = function(events) {
    for (var evt in events) {
      //this.lowBattery.on(events[evt], this.batteryIndicator);
    }
  };

  IndicatorController.prototype.bingHDREvents = function(events) {
    var app = this.app;
    app.settings.on('change:hdr', this.updateHDR);
  };

  IndicatorController.prototype.bingTimerEvents = function(events) {
    var app = this.app;
    app.settings.on('change:timer', this.updateCaptureTimer);
  };
 
  IndicatorController.prototype.onSettingConfigured = function() {
    this.updateHDR(this.app.settings.hdr.selected('key'));
    this.updateCaptureTimer(this.app.settings.timer.selected('key'));
  };

  IndicatorController.prototype.updateHDR = function(value) {
    this.indicator.setHDRindicator(value);
  };

  IndicatorController.prototype.updateCaptureTimer = function(value) {
    this.indicator.setCaptureTimer(value);
  };

  IndicatorController.prototype.batteryIndicator = function(level) {
    this.indicator.setBatteryStatus(level);
  };

});