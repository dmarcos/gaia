'use strict';

requireApp('camera/test/unit/lib/mock_mozCamera.js');
suite('camera', function() {


  var require = window.req;
  var Camera;

  suiteSetup(function(done) {
    require(['lib/camera'], function(_camera) {
      Camera = _camera;
      done();
    });
  });

  setup(function() {
    navigator.getDeviceStorage = navigator.getDeviceStorage || function() {};
    this.sandbox = sinon.sandbox.create();
    this.sandbox.stub(navigator, 'getDeviceStorage');
    /*navigator.mozCameras = navigator.mozCameras || {
      getListOfCameras: function() {},
      getCamera: function() {
      }
    };

    this.sandbox.stub(naviagator,'mozCameras');*/
    this.camera = new Camera({});
  });

  teardown(function() {
    this.sandbox.restore();
    this.camera.mozCamera = null;
  });

  suite('Camera#gotCamera()', function() {
    setup(function() {
      this.sandbox.stub(this.camera, 'setWhiteBalance');
    });

    test('should call the setWhiteBalance method with "auto"', function() {
      this.camera.gotCamera(mockMozCamera);

      assert.isTrue(this.camera.setWhiteBalance.calledWith('auto'));
    });
  });

  suite('Camera#setWhiteBalance()', function() {
    setup(function() {
      this.sandbox.stub(this.camera, 'get', function() {
        return mockMozCamera.capabilities;
      });
      this.sandbox.stub(this.camera, 'mozCamera', mockMozCamera);
    });

    test('should set whitemode if present in whiteBalanceModes', function() {
      this.value = 'auto';
      this.camera.setWhiteBalance(this.value);

      assert.equal(this.camera.mozCamera.whiteBalanceMode, this.value);
    });

    test('should not set whiteBalance if not present in whiteBalanceModes',
    function() {
      this.value = 'not';
      this.camera.setWhiteBalance(this.value);

      assert.notEqual(this.camera.mozCamera.whiteBalanceMode, this.value);
    });
  });

  suite('Camera#onPreviewStateChange()', function() {
    test('Should call emit with busy when previewState is stopped/paused',
    function() {
      this.previewState = 'paused' || 'stopped';
      this.sandbox.stub(this.camera, 'emit');
      this.camera.onPreviewStateChange(this.previewState);

      assert.isTrue(this.camera.emit.calledWith('busy'));
    });

    test('Should call emit with ready when previewState is not stopped/paused',
    function() {
      this.previewState = 'null';
      this.sandbox.stub(this.camera, 'emit');
      this.camera.onPreviewStateChange(this.previewState);

      assert.isTrue(this.camera.emit.calledWith('ready'));
    });
  });
});
