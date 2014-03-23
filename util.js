if (typeof(derMiner) == 'undefined')
  var derMiner = {};

derMiner.Util = {
  hex_to_uint32_array: function(hex) {
    var arr = [];
    for (var i = 0, l = hex.length; i < l; i += 8) {
        arr.push((parseInt(hex.substring(i, i+8), 16)));
    }
    return arr;
  },
  hex_to_uint16_array: function(hex) {
    var arr = [];
    for (var i = 0, l = hex.length; i < l; i += 4) {
        arr.push((parseInt(hex.substring(i, i+4), 16)));
    }
    return arr;
  },
  uint32_array_to_hex: function(arr) {
    var hex = '';
    for (var i = 0; i < arr.length; i++) {
      hex += derMiner.Util.byte_to_hex(arr[i] >>> 24);
      hex += derMiner.Util.byte_to_hex(arr[i] >>> 16);
      hex += derMiner.Util.byte_to_hex(arr[i] >>>  8);
      hex += derMiner.Util.byte_to_hex(arr[i]       );
    }
    return hex;
  },
  uint16_array_to_hex: function(arr) {
    var hex = '';
    for (var i = 0; i < arr.length; i++) {
      hex += derMiner.Util.byte_to_hex(arr[i] >>>  8);
      hex += derMiner.Util.byte_to_hex(arr[i]       );
    }
    return hex;
  },
  to_uint16_array: function(w) {
        return [(w & 0xffff0000) >> 16, (w & 0x0000ffff) ];
  },
  byte_to_hex: function(b) {
    var tab = '0123456789abcdef';
    b = b & 0xff;
    return tab.charAt(b / 16) +
           tab.charAt(b % 16);
  },
  reverseBytesInWord: function(w) {
    return ((w <<  24) & 0xff000000) |
           ((w <<   8) & 0x00ff0000) |
           ((w >>>  8) & 0x0000ff00) |
           ((w >>> 24) & 0x000000ff);
  },
  reverseBytesInInt: function(w) {
    return ((w << 8) & 0x0000ff00 |
            (w >> 8) & 0x000000ff);
  },
  reverseBytesInWords: function(words) {
    var reversed = [];
    for(var i = 0; i < words.length; i++)
      reversed.push(derMiner.Util.reverseBytesInWord(words[i]));
    return reversed;
  },
  reverseBytesInInts: function(words) {
    var reversed = [];
    for(var i = 0; i < words.length-1; i+=2) {
        reversed.push(derMiner.Util.reverseBytesInInt(words[i+1]));
        reversed.push(derMiner.Util.reverseBytesInInt(words[i]));
    }
    return reversed;
  },
  fromPoolString: function(hex, gl) {
    return gl
           ? derMiner.Util.reverseBytesInInts(derMiner.Util.hex_to_uint16_array(hex))
           : derMiner.Util.reverseBytesInWords(derMiner.Util.hex_to_uint32_array(hex));
  },
  toPoolString: function(data, gl) {
    return gl
           ? derMiner.Util.uint16_array_to_hex(derMiner.Util.reverseBytesInInts(data))
           : derMiner.Util.uint32_array_to_hex(derMiner.Util.reverseBytesInWords(data));
  },
  ToUInt32: function (x) {
    return x >>> 0;
  }
};
