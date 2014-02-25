
suite('controllers/camera', function() {
  'use strict';

  suiteSetup(function(done) {
    var require = window.req;
    var self = this;

    require([
      'app',
      'controllers/camera',
      'lib/camera',
      'lib/activity',
      'vendor/view',
      'lib/settings',
      'lib/setting',
      'lib/filmstrip',
      'lib/storage'
    ], function(
      App, CameraController, Camera, Activity,
      View, Settings, Setting, FilmStrip, Storage) {
      self.CameraController = CameraController.CameraController;
      self.Activity = Activity;
      self.Settings = Settings;
      self.Setting = Setting;
      self.FilmStrip = FilmStrip;
      self.Camera = Camera;
      self.View = View;
      self.Storage = Storage;
      self.App = App;
      done();
    });
  });

  setup(function() {
    this.app = sinon.createStubInstance(this.App);
    this.app.activity = new this.Activity();
    this.app.settings = sinon.createStubInstance(this.Settings);
    this.app.camera = sinon.createStubInstance(this.Camera);
    this.app.filmstrip = sinon.createStubInstance(this.FilmStrip);
    this.app.storage = sinon.createStubInstance(this.Storage);
    this.app.views = {
      filmstrip: sinon.createStubInstance(this.View),
      viewfinder: sinon.createStubInstance(this.View)
    };
    this.app.filmstrip.clear = sinon.spy();
    this.app.views.filmstrip.clear = sinon.spy();
    this.app.views.viewfinder.fadeOut = sinon.spy();
    this.app.settings.cameras = sinon.createStubInstance(this.Setting);
    this.app.settings.mode = sinon.createStubInstance(this.Setting);
    this.app.settings.pictureSizes = sinon.createStubInstance(this.Setting);
    this.app.settings.recorderProfiles = sinon.createStubInstance(this.Setting);
    this.app.settings.flashModes = sinon.createStubInstance(this.Setting);
  });
  suite('CameraController()#onSettingsConfigured ', function() {
    test('Should onSettingsConfigured ', function() {
      this.app.settings.pictureSizes.selected.returns({width: 10, height: 20});
      this.controller = new this.CameraController(this.app);
      this.controller.onSettingsConfigured();
      assert.isTrue(this.app.camera.configure.called);
      assert.isTrue(this.app.storage.setMaxFileSize.calledWith(4896));
    });
  });

  suite('CameraController()#setPictureSize  ', function() {
    test('Should setPictureSize', function() {
      this.app.settings.mode.is.withArgs('picture').returns(true);
      this.controller = new this.CameraController(this.app);
      this.controller.setPictureSize(1000);
      assert.isTrue(this.app.camera.setPictureSize.called);
      assert.isTrue(this.app.views.viewfinder.fadeOut.called);
    });

    test('Should setPictureSize. Should resize the preview only'
      'when picture mode ', function() {
      this.app.settings.mode.is.withArgs('picture').returns(false);
      this.controller = new this.CameraController(this.app);
      this.controller.setPictureSize(1000);
      assert.isTrue(this.app.camera.setPictureSize.called);
      assert.isFalse(this.app.views.viewfinder.fadeOut.called);
    });

  });

  suite('CameraController()#setRecorderProfile   ', function() {
    test('Should setRecorderProfile ', function() {
      this.app.settings.mode.is.withArgs('video').returns(true);
      this.controller = new this.CameraController(this.app);
      this.controller.setRecorderProfile(1000);
      assert.isTrue(this.app.camera.setRecorderProfile.called);
      assert.isTrue(this.app.views.viewfinder.fadeOut.called);
    });

    test('Should setRecorderProfile . Should resize the'
      'preview only when picture mode ', function() {
      this.app.settings.mode.is.withArgs('video').returns(false);
      this.controller = new this.CameraController(this.app);
      this.controller.setRecorderProfile(1000);
      assert.isTrue(this.app.camera.setRecorderProfile.called);
      assert.isFalse(this.app.views.viewfinder.fadeOut.called);
    });

  });

  suite('CameraController()#setFlashMode   ', function() {
    test('Should setFlashMode', function() {
      this.app.settings.flashModes.selected.returns('mode-test');
      this.controller = new this.CameraController(this.app);
      this.controller.setFlashMode();
      assert.isTrue(this.app.camera.setFlashMode.calledWith('mode-test'));
    });

  });

  suite('CameraController()#onBlur', function() {
    test('Should onBlur', function() {
      this.app.inSecureMode = false;
      this.controller = new this.CameraController(this.app);
      this.controller.onBlur();
      assert.isTrue(this.app.camera.release.called);
      assert.isFalse(this.app.filmstrip.clear.called);
    });

    test('Should onBlur Only in secure mode filmstrip'
      'should be cleared', function() {
      //this.app.get.withArgs('inSecureMode').returns(true);
      this.app.inSecureMode = true;
      this.app.filmstrip.clear = sinon.spy();
      this.controller = new this.CameraController(this.app);
      this.controller.onBlur();
      assert.isTrue(this.app.camera.release.called);
      assert.isTrue(this.app.filmstrip.clear.called);
    });
  });

  suite('CameraController()', function() {
    setup(function() {
      sinon.stub(this.CameraController.prototype, 'teardownCamera');
    });

    teardown(function() {
      this.CameraController.prototype.teardownCamera.restore();
    });

    test('Should set the capture mode to \'camera\' by default', function() {
      this.app.settings.mode.selected.returns('picture');
      this.controller = new this.CameraController(this.app);
      assert.isTrue(this.app.camera.setMode.calledWith('picture'));
    });

    test('Should setup camera on app `boot`', function() {
      this.controller = new this.CameraController(this.app);
      this.app.on.calledWith('boot', this.app.camera.load);
    });

    test('Should setup camera on app `focus`', function() {
      this.controller = new this.CameraController(this.app);
      this.app.on.calledWith('focus', this.app.camera.load);
    });

    test('Should teardown camera on app `blur`', function() {
      this.controller = new this.CameraController(this.app);
      this.app.on.calledWith('blur', this.controller.teardownCamera);
    });
  });
});
