define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var View = require('vendor/view');

/**
 * Exports
 */

module.exports = View.extend({
  name: 'face',
  fadeTime: 1000,

  initialize: function() {
    this.render();
    this.showParent = this.show;
    this.show = function() {
      this.showParent();
      //this.fadeOut();
    }.bind(this);
    this.hideParent = this.hide;
    this.hide = function() {
      this.el.classList.remove('highlight');
      this.hideParent();
    }.bind(this);
  },

  render: function() {
    this.el.innerHTML = this.template();
    this.el.classList.add('js-face');
  },

  highlight: function() {
    this.el.classList.add('highlight');
  },

  setPosition: function(x, y) {
    this.el.style.left = x + 'px';
    this.el.style.top = y + 'px';
  },

  setRadius: function(radius) {
    this.el.style.width = radius + 'px';
    this.el.style.height = radius + 'px';
  },

  fadeOut: function() {
    setTimeout(this.hide, this.fadeTime);
  }

});

});
