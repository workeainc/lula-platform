// web-rtcview-module.js
// Direct module export for RTCView

import RTCView from './web-rtcview.js';

// This file provides the RTCView component as the default export
// for direct module resolution
export default RTCView;

// Also provide named export
export { RTCView };

// CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RTCView;
  module.exports.RTCView = RTCView;
  module.exports.default = RTCView;
}