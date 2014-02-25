/*global req*/
'use strict';

suite('controllers/viewfinder', function() {
  suiteSetup(function(done) {
    var self = this;

    req([
      'app',
      'lib/camera',
      'controllers/viewfinder',
      'views/viewfinder',
      'lib/activity',
      'lib/settings',
      'lib/setting'
    ], function(
      App, Camera, ViewfinderController,
      ViewfinderView, Activity, Settings, Setting) {
      self.ViewfinderController = ViewfinderController.ViewfinderController;
      self.ViewfinderView = ViewfinderView;
      self.Settings = Settings;
      self.Setting = Setting;
      self.Activity = Activity;
      self.Camera = Camera;
      self.App = App;
      done();
    });
  });

  setup(function() {
    this.app = sinon.createStubInstance(this.App);
    this.app.camera = sinon.createStubInstance(this.Camera);
    this.app.activity = sinon.createStubInstance(this.Activity);
    this.app.settings = sinon.createStubInstance(this.Settings);
    this.app.setting = sinon.createStubInstance(this.Setting);
    this.app.filmstrip = { toggle: sinon.spy() };
    this.app.views = {
      viewfinder: sinon.createStubInstance(this.ViewfinderView)
    };

    this.filmstrip = this.app.filmstrip;
    this.viewfinder = this.app.views.viewfinder;
    this.app.settings.grid = sinon.createStubInstance(this.Setting);
  });

  suite('onBlur', function() {
    test('onBlur', function() {
      this.controller = new this.ViewfinderController(this.app);
      this.controller.onBlur();
      assert.isTrue(this.viewfinder.fadeOut.called);
    });
  });

  suite('click:viewfinder', function() {
    test('Should *not* hide the filmstrip if recording', function() {
      this.app.camera.get
        .withArgs('recording')
        .returns(true);

      this.controller = new this.ViewfinderController(this.app);
      this.viewfinder.emit('click');

      assert.isFalse(this.filmstrip.toggle.called);
    });

    test('Should *not* hide the filmstrip if activity is pending', function() {
      this.app.get
        .withArgs('recording')
        .returns(false);

      this.app.activity.active = true;
      this.controller = new this.ViewfinderController(this.app);
      this.controller.onViewfinderClick();
      assert.isFalse(this.filmstrip.toggle.called);
    });

    test('Should hide the filmstrip if activity is pending', function() {
      this.app.get
        .withArgs('recording')
        .returns(false);

      this.controller = new this.ViewfinderController(this.app);
      this.controller.onViewfinderClick();
      assert.isTrue(this.filmstrip.toggle.called);
    });
  });
});
