
suite('camera', function() {
  'use strict';

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
      getCamera: function() {}
    };*/


    //this.sandbox.stub(naviagator,'mozCameras');
    this.camera = new Camera({});
  });

  teardown(function() {
    this.sandbox.restore();
  });

  suite('Camera#gotCamera()', function() {
    setup(function() {
      this.mozCamera = {
        capabilities: {
          whiteBalancemodes: [1, 2],
          focusModes: 'focusModes'
        },
        onShutter: 'onShutter',
        onRecorderStateChange: 'onRecorderChange',
        whiteBalanceMode: 'whiteMode'
      };

      this.sandbox.stub(this.camera, 'configureFocus');
      this.sandbox.stub(this.camera, 'setWhiteBalance');
    });

    test('should set white balance', function() {
      this.camera.gotCamera(this.mozCamera);
      assert.isTrue(this.camera.setWhiteBalance.called);
    });

    test('should pass "auto" to setWhiteBalance method', function() {
      this.camera.gotCamera(this.mozCamera);
      assert.isTrue(this.camera.setWhiteBalance.calledWith('auto'));
    });
  });
});
