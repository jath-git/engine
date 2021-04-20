// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill#polyfill
if (!Array.prototype.fill) {
    Object.defineProperty(Array.prototype, 'fill', {
        value: function(value) {
  
            // Steps 1-2.
            if (this == null) {
                throw new TypeError('this is null or not defined');
            }
    
            var O = Object(this);
    
            // Steps 3-5.
            var len = O.length >>> 0;
    
            // Steps 6-7.
            var start = arguments[1];
            var relativeStart = start >> 0;
    
            // Step 8.
            var k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
    
            // Steps 9-10.
            var end = arguments[2];
            var relativeEnd = end === undefined ? len : end >> 0;
    
            // Step 11.
            var finalValue = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
    
            // Step 12.
            while (k < finalValue) {
                O[k] = value;
                k++;
            }
    
            // Step 13.
            return O;
        }
    });
}

// implementation for typed arrays
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/fill#polyfill
if (!Int8Array.prototype.fill) {
    Int8Array.prototype.fill = Array.prototype.fill;
}

if (!Uint8Array.prototype.fill) {
    Uint8Array.prototype.fill = Array.prototype.fill;
}

if (!Uint8ClampedArray.prototype.fill) {
    Uint8ClampedArray.prototype.fill = Array.prototype.fill;
}

if (!Int16Array.prototype.fill) {
    Int16Array.prototype.fill = Array.prototype.fill;
}

if (!Uint16Array.prototype.fill) {
    Uint16Array.prototype.fill = Array.prototype.fill;
}

if (!Int32Array.prototype.fill) {
    Int32Array.prototype.fill = Array.prototype.fill;
}

if (!Uint32Array.prototype.fill) {
    Uint32Array.prototype.fill = Array.prototype.fill;
}

if (!Float32Array.prototype.fill) {
    Float32Array.prototype.fill = Array.prototype.fill;
}