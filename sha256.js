Sha256 = function(init, data) {
  
    var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
             0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
             0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
             0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
             0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
             0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
             0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
             0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  
    var add = function (x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return ((0xFFFF & msw) << 16) | (lsw & 0xFFFF);
    };

    var add_all = function() {
        var sum = arguments[0];
        for (var i = 1; i < arguments.length; i++)
            sum = add(sum, arguments[i]);
        return sum;
    };
  
    var set_state = function(target, source) {
        for (var i = 0; i < 8; i++)
            target[i] = source[i];
    };
  
    var extend_work = function(work, w) {
        for (var i = 0; i < 16; i++)
            work[i] = w[i];
        w = work;

        for (var i = 16; i < 64; i++) {
            var s0 = rotr(w[i - 15],  7) ^ rotr(w[i - 15], 18) ^ shr(w[i - 15],  3);
            var s1 = rotr(w[i -  2], 17) ^ rotr(w[i -  2], 19) ^ shr(w[i -  2], 10);
            w[i] = add_all(w[i-16], s0, w[i-7], s1);
        }
        return w;
    };
  
    var rotr = function(x, n) {
        return (x >>> n) | (x << (32 - n));
    };
  
    var shr = function(x, n) {
        return (x >>> n);
    };
  
    this.state = [0,0,0,0,0,0,0,0];
    set_state(this.state, H);
  
    this.work = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
                 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  
    this.hex = function() {
        return derMiner.Util.uint32_array_to_hex(this.state);
    };

    this.reset = function() {
        set_state(this.state, H);
        return this;
    };
  
    this.update = function(init, data) {
        if (!data) { data = init; init = null; }
        if (typeof(init) == 'string')
            init = derMiner.Util.hex_to_uint32_array(init);
        if (init) set_state(this.state, init);
        if (typeof(data) == 'string')
            data = derMiner.Util.hex_to_uint32_array(data);

        var w = extend_work(this.work, data);
        var s = this.state;

        var a = s[0], b = s[1], c = s[2], d = s[3],
        e = s[4], f = s[5], g = s[6], h = s[7];
       
        for (var i = 0; i < 64; i++) {
            var s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            var maj = (a & b) ^ (a & c) ^ (b & c);
            var t2 = add(s0, maj);
            var s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            var ch = (e & f) ^ ((~e) & g);
            var t1 = add_all(h, s1, ch, K[i], w[i]);

            h = g; g = f; f = e;
            e = add(d, t1);
            d = c; c = b; b = a;
            a = add(t1, t2);
        }
        
       
        s[0] = add(s[0], a);
        s[1] = add(s[1], b);
        s[2] = add(s[2], c);
        s[3] = add(s[3], d);
        s[4] = add(s[4], e);
        s[5] = add(s[5], f);
        s[6] = add(s[6], g);
        s[7] = add(s[7], h);

        return this;
    };
  
    if (init) this.update(init, data);
};

sha256 = new Sha256();
