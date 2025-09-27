// web-url-polyfill.js
// Polyfill for whatwg-url-without-unicode decode issues on web

// Simple URL decode polyfill
const decodeURIComponentSafe = (str) => {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    console.warn('[URL Polyfill] Failed to decode URI component:', str, e);
    return str;
  }
};

// Polyfill for whatwg-url decode function and TextDecoder
if (typeof window !== 'undefined' && !window.URLPolyfillApplied) {
  // Mark as applied to avoid double application
  window.URLPolyfillApplied = true;
  
  // TextDecoder polyfill for whatwg-url-without-unicode
  if (!window.TextDecoder) {
    window.TextDecoder = class TextDecoder {
      constructor(encoding = 'utf-8') {
        this.encoding = encoding;
      }
      
      decode(buffer) {
        if (typeof buffer === 'string') return buffer;
        if (!buffer) return '';
        
        try {
          if (buffer instanceof Uint8Array || Array.isArray(buffer)) {
            return String.fromCharCode.apply(null, buffer);
          }
          return buffer.toString();
        } catch (e) {
          console.warn('[TextDecoder Polyfill] Decode failed:', e);
          return '';
        }
      }
    };
  }

  // Critical fix for whatwg-url-without-unicode specific issue
  // Patch the URL constructor to handle the decode issue
  const OriginalURL = window.URL;
  if (OriginalURL) {
    window.URL = function(url, base) {
      try {
        return new OriginalURL(url, base);
      } catch (e) {
        if (e.message && e.message.includes("Cannot read properties of undefined (reading 'decode')")) {
          console.warn('[URL Polyfill] Caught decode error, using fallback URL construction');
          // Fallback: create a simple URL-like object for asset resolution
          if (typeof url === 'string' && url.startsWith('http')) {
            return {
              href: url,
              toString: () => url,
              pathname: url.split('://')[1]?.split('/').slice(1).join('/') || '',
              origin: url.split('://')[0] + '://' + url.split('://')[1]?.split('/')[0] || url
            };
          }
        }
        throw e;
      }
    };
    // Copy static methods
    Object.setPrototypeOf(window.URL, OriginalURL);
    Object.getOwnPropertyNames(OriginalURL).forEach(name => {
      if (typeof OriginalURL[name] === 'function') {
        window.URL[name] = OriginalURL[name];
      }
    });
  }
  
  // Ensure TextEncoder exists too
  if (!window.TextEncoder) {
    window.TextEncoder = class TextEncoder {
      encode(str) {
        const result = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
          result[i] = str.charCodeAt(i);
        }
        return result;
      }
    };
  }
  
  // Extend URL prototype if needed
  if (typeof URL !== 'undefined' && URL.prototype) {
    // Add a safe decode method if it doesn't exist
    if (!URL.prototype.decode) {
      URL.prototype.decode = function() {
        return decodeURIComponentSafe(this.href);
      };
    }
  }
  
  // Global decode function polyfill
  if (typeof global !== 'undefined') {
    global.decode = global.decode || decodeURIComponentSafe;
    if (!global.TextDecoder) {
      global.TextDecoder = window.TextDecoder;
    }
  }
  
  if (typeof window !== 'undefined') {
    window.decode = window.decode || decodeURIComponentSafe;
  }
  
  console.log('[URL Polyfill] Applied web URL polyfills with TextDecoder');
}

// CommonJS export for compatibility
module.exports = {
  decodeURIComponentSafe,
  decode: decodeURIComponentSafe
};
