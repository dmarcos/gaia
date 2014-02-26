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
        status:true,
        eventName:['visibilitychange','settings:configured'],
      },
      'HDR':{
        status:true,
        eventName:'change:hdr',
      },
      'SelfTimer':{
        status:true,
        eventName:'change:timer'
      }
    }
  },
  lowbattery: {
    '15':{
       message:'You have 15% battery remaining',
       value:15,
       icon:'icon-battery-15'
    },
    '10':{
       message:'You have 10% battery remaining',
       value:10,
       icon:'icon-battery-10'
    },
    '6':{
       isBlink:true,
       message:'Critically low battery',
       value:6,
       icon:'icon-battery-10'
    },
    '5':{
      title:'Low Battery',
       message:'Critically low battery Application can\'t be use' ,
       value:5,
    }
  }
};
});