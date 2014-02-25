'use strict';

suite('controllers/settings', function() {
  suiteSetup(function(done) {
    var modules = this.modules = {};
    req([
      'controllers/settings',
      'views/settings'
    ], function(Controller, SettingsView) {
      modules.controller = Controller;
      modules.SettingsView = SettingsView;
      done();
    });
  });

  setup(function() {
    var SettingsView = this.modules.SettingsView;
    var Controller = this.modules.controller;
    this.app = {
      SettingsView: SettingsView,
      settings: Controller,
      on: sinon.spy()
    };
    this.app.settings = {
      pictureSizesFront: function() {format: 'null'},
      pictureSizesBack: function() {format: 'null'},
      alias: function() {}
    };
    this.controller = new Controller(this.app);
    this.controller = {
      on: sinon.spy()
    };
    this.sandbox = sinon.sandbox.create();
    this.sandbox.spy(this.app, 'SettingsView');
    this.sandbox.stub(SettingsView.prototype);
  });

  teardown(function() {
    this.sandbox.restore();
  });

  suite('SettingsController()', function() {
    test('Should close settings menu on app screen', function() {
      this.controller.on.calledWith('click', this.closeSettings);
    });
  });
});
