define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var View = require('vendor/view');
var find = require('lib/find');
var orientation = require('lib/orientation');
/**
 * Exports
 */

module.exports = View.extend({
  name:'lowBattery',
  initialize: function() {
    this.el.innerHTML = this.render();
    this.els.message = find('.js-low-battery',this.el);
    this.els.message.dataset.mode = 'disable';
    orientation.on('orientation', this.setOrientation);
    this.setOrientation(orientation.get());
  },
  render: function() {
    return '<div class ="js-low-battery lowbattery"> </div>';

  },
  showBottomMessage: function(message, className) {
    
    this.els.message.innerHTML = '<div class="imgBox  '+className+'" >'+
                                 '</div>'+message;
    this.els.message.dataset.mode = 'bottom';
   },
  
  showFullScreenMessage: function(title, message) {
    var messages = '<div class = "messageTitle" > '+title+'</div>'+
                   '<div class = "message" >'+message+ ' </div>';
    
    this.els.message.innerHTML = messages;
    this.els.message.dataset.mode = 'fullscreen';
  },
  showBlinkMessage: function(message, className) {
    this.els.message.innerHTML = '<div class="imgBox  '+className+'" >'+
                                 '</div>'+message;
    this.els.message.dataset.mode = 'blink';
  },
  removeMessage: function() {
    this.els.message.innerHTML = '';
    this.els.message.dataset.mode = 'disable';
  },
  setOrientation: function(orientation) {
    this.els.message.dataset.orientation = orientation;
  },
  setLowBatteryMessage: function(batteryObj) {
    if (batteryObj.value == 5) {
      var title = batteryObj.title;
      var message = batteryObj.message;
      this.showFullScreenMessage(title, message);
      return;
    }
    var message =  batteryObj.message;
    var className = batteryObj.icon;
    if (batteryObj.isBlink) {
      this.showBlinkMessage(message, className);
      this.emit('lowbattery', batteryObj);
    } else {
      var self = this;
      this.showBottomMessage(message, className);
      window.setTimeout(function() {
        self.removeMessage();
        //emit event for indicator
        self.emit('lowbattery', batteryObj);
      }, 3000);
    }
  }
  
});

});