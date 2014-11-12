define(function(require, exports, module) {
'use strict';

/**
 * Dependencies
 */

var debug = require('debug')('view:overlay');
var View = require('view');
var bind = require('lib/bind');

/**
 * Exports
 */

module.exports = View.extend({
  className: 'overlay',

  initialize: function(options) {
    this.data('type', options.type);
    this.data('action', options.data.action);
    this.render(options.data);
  },

  render: function(data) {

    // Inject HTML
    this.el.innerHTML = this.template(data);

    // Pick out elements
    this.els.buttons = {
      action: this.find('.js-action-btn')
    };

    // Clean up
    delete this.template;

    debug('rendered');
    return this.bindEvents();
  },

  bindEvents: function() {
    bind(this.els.buttons.action, 'click', this.onButtonClick);
    return this;
  },

  template: function(data) {
    /*jshint maxlen:false*/
    return '<form role="dialog" data-type="confirm">' +
      '<section>' +
        '<h1 class="overlay-title">' + data.title + '</h1>' +
        '<p id="overlay-text">' + data.body + '</p>' +
      '</section>' +
      '<menu class="overlay-menu-action">' +
        '<button class="full js-action-btn" type="button" name="' + data.action + '">' +
        data.actionButtonText + '</button>' +
      '</menu>' +
    '</form>';
  },

  data: function(key, value) {
    switch (arguments.length) {
      case 1: return this.el.getAttribute('data-' + key);
      case 2: this.el.setAttribute('data-' + key, value);
    }
  },

  onButtonClick: function(event) {
    var el = event.currentTarget;
    var name = el.getAttribute('name');
    this.emit('click:' + name);
  }
});

});
