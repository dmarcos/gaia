define(function(require, exports, module) {
'use strict';

/**
 * Exports
 *add eventname  only when the vent is unique .
 */

module.exports = {
  Indicators: {
    status:true,
    require:null,
    option: {
      'Battery': {
        status:true,
        eventName:['lowbattery'],
      },
      'Geolocation': {
        status:false,
        eventName:['visibilitychange','settings:configured'],
      },
      'HDR':{
        status:false,
        eventName:'change:hdr',
      },
      'SelfTimer':{
        status:false,
        eventName:'change:timer'
      }
    }
  },
  lowbattery: {
    '15':{
       message:'You have 15% battery remaining',
       icon:'icon-battery-15',
       value:15,
    },
    '10':{
       message:'You have 10% battery remaining',
       icon:'icon-battery-10',
       value:10,
    },
    '6':{
       isBlink:true,
       message:'Critically low battery',
       icon:'icon-battery-10',
       value:6,
    },
    '5':{
      message:'The battery is too low to use the Camera',
      title:'Low Battery',
       value:5,
    }
  }
};
});