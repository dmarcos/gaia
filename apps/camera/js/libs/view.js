define(function(require, exports, module) {
  'use strict';

  /**
   * Dependencies
   */

  var events = require('libs/evt').mix;
  var mixin = require('utils/mixin');
  var bindAll = require('utils/bindAll');

  /**
   * Locals
   */

  var counter = 1;
  var noop = function(){};

  /**
   * Exports
   */

  module.exports = View;

  /**
   * Base view class. Accepts
   * or creates a root element
   * which we template into.
   *
   * @constructor
   */
  function View(options){
    options = options || {};
    this.el = options.el || this.el || document.createElement(this.tag);
    this.el.id = this.el.id || ('view' + counter++);
    this.els = {};

    if (!this.el.className) {
      if (this.name) this.el.className += ' ' + this.name;
      if (this.className) this.el.className += ' ' + this.className;
    }

    bindAll(this);
    this.initialize.apply(this, arguments);
  }

  /**
   * Base view prototype,
   * mixed in event emitter.
   *
   * @type {Object}
   */
  var proto = events(View.prototype);

  // Allow for 'emit' or
  // 'fire' to trigger events
  proto.fire = proto.fire || proto.emit;

  /**
   * Default tagName
   *
   * @type {String}
   */
  proto.tag = 'div';
  proto.name = 'noname';

  /**
   * Appends the root element
   * to the given parent.
   *
   * @param  {Element} parent
   * @return {View}
   */
  proto.appendTo = function(parent) {
    if (!parent) return this;
    parent.appendChild(this.el);
    this.fire('inserted');
    return this;
  };

  /**
   * Prepends the root element
   * to the given parent.
   *
   * @param  {Element} parent
   * @return {View}
   */
  proto.prependTo = function(parent) {
    if (!parent) return this;
    var first = parent.firstChild;

    if (first) parent.insertBefore(this.el, first);
    else this.appendTo(parent);

    this.fire('inserted');
    return this;
  };

  /**
   * Convenient shorthand
   * querySelector.
   *
   * @param  {String} query
   * @return {Element|null}
   */
  proto.find = function(query) {
    return this.el.querySelector(query);
  };

  /**
   * Removes the element from
   * its current DOM location.
   *
   * @param  {Object} options
   * @return {View}
   */
  proto.remove = function(options) {
    var silent = options && options.silent;
    var parent = this.el.parentNode;
    if (!parent) return this;
    parent.removeChild(this.el);
    if (!silent) this.fire('remove');
    return this;
  };

  /**
   * Removes the element from
   * it's current context, firing
   * a 'destroy' event to allow
   * views to perform cleanup.
   *
   * Then clears any internal
   * references to aid GC.
   *
   * @return {[type]} [description]
   */
  proto.destroy = function(options) {
    var noRemove = options && options.noRemove;
    if (!noRemove) this.remove();
    this.fire('destroy');
    this.el = null;
  };

  proto.toString = function() {
    return '[object View]';
  };

  // Overwrite as required
  proto.initialize = noop;
  proto.template = function() { return ''; };

  // Allow base view
  // to be extended
  View.extend = extend;

  /**
   * Extends the base view
   * class with the given
   * properties.
   *
   * TODO: Pull this out to
   * standalone module.
   *
   * @param  {Object} properties
   * @return {Function}
   */
  function extend(props) {
    var Parent = this;

    // The child class constructor
    // just calls the parent constructor
    var Extended = function(){
      Parent.apply(this, arguments);
    };

    // Base the Child prototype
    // on the View's prototype.
    var C = function(){};
    C.prototype = Parent.prototype;
    Extended.prototype = new C();

    // Add reference to the constructor
    Extended.prototype.constructor = Extended;

    // Allow new classes to
    // extend from this class.
    Extended.extend = View.extend;
    mixin(Extended.prototype, props);

    return Extended;
  }
});
