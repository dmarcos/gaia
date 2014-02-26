var mockMozCamera = {

  onShutter: null,
  onRecorderStateChange: null,
  pictureSize: null,
  capabilities: {
    focusModes: null,
    recorderProfiles: null,
    previewSizes: null,
    thumbnailSizes: null,
    whiteBalanceModes: ['auto', 'normal'],
    setConfiguration: function() {}
  },

  flashMode: null,
  whiteBalanceMode: null,
  release: function() {},
  takePicture: function() {},
  autoFocus: function() {},
  stopRecording: function() {},
  resumePreview: function() {}
};
