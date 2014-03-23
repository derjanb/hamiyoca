var vShaderQuellcode;
var fShaderQuellcode;

var dataLoc;
var hash1Loc;
var midstateLoc;
var targetLoc;
var nonceLoc;

var maxNonce = 0xFFFFFFFF;
var maxCnt = 0;
var reportPeriod = 1000;
var useTimeout = true;
var TotalHashes = 0;
var gl;
var canvas;
var debug = false;
var buf;

var width;
var height;

function throwOnGLError(err, funcName, args) {
    throw WebGLDebugUtils.glEnumToString(err) + " was caused by call to" + funcName;
};

function meinWebGLStart(threads) {
        canvas = document.createElement('canvas');
        if (debug || true) document.body.appendChild(canvas)
        canvas.height = 1;
        canvas.width = threads;

        var names = [ "webgl", "experimental-webgl", "moz-webgl", "webkit-3d" ];
        for (var i=0; i<names.length; i++) {
            try { 
                gl = canvas.getContext(names[i]);
                if (gl) { break; }
            } catch (e) { }
        }

        if(!gl) {
            alert("Fehler: WebGL-Context konnte nicht initialisiert werden");
        }

        var program = gl.createProgram();


        vShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vShader,vShaderQuellcode);
        gl.compileShader(vShader);
        if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(vShader));
        }
        gl.attachShader(program,vShader);

        fShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fShader,fShaderQuellcode);
        gl.compileShader(fShader);
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(fShader));
        }
        gl.attachShader(program,fShader);

        gl.linkProgram(program);
        gl.useProgram(program);

        gl.clearColor ( 1.0, 1.0, 1.0, 1.0 );
        gl.clear ( gl.COLOR_BUFFER_BIT );

        var posAtrLoc = gl.getAttribLocation(program, "vPos");
        gl.enableVertexAttribArray( posAtrLoc );

        var h =  [0x6a09, 0xe667, 0xbb67, 0xae85,
                  0x3c6e, 0xf372, 0xa54f, 0xf53a,
                  0x510e, 0x527f, 0x9b05, 0x688c,
                  0x1f83, 0xd9ab, 0x5be0, 0xcd19];

        var k =  [0x428a, 0x2f98, 0x7137, 0x4491,
                  0xb5c0, 0xfbcf, 0xe9b5, 0xdba5,
                  0x3956, 0xc25b, 0x59f1, 0x11f1,
                  0x923f, 0x82a4, 0xab1c, 0x5ed5,
                  0xd807, 0xaa98, 0x1283, 0x5b01,
                  0x2431, 0x85be, 0x550c, 0x7dc3,
                  0x72be, 0x5d74, 0x80de, 0xb1fe,
                  0x9bdc, 0x06a7, 0xc19b, 0xf174,
                  0xe49b, 0x69c1, 0xefbe, 0x4786,
                  0x0fc1, 0x9dc6, 0x240c, 0xa1cc,
                  0x2de9, 0x2c6f, 0x4a74, 0x84aa,
                  0x5cb0, 0xa9dc, 0x76f9, 0x88da,
                  0x983e, 0x5152, 0xa831, 0xc66d,
                  0xb003, 0x27c8, 0xbf59, 0x7fc7,
                  0xc6e0, 0x0bf3, 0xd5a7, 0x9147,
                  0x06ca, 0x6351, 0x1429, 0x2967,
                  0x27b7, 0x0a85, 0x2e1b, 0x2138,
                  0x4d2c, 0x6dfc, 0x5338, 0x0d13,
                  0x650a, 0x7354, 0x766a, 0x0abb,
                  0x81c2, 0xc92e, 0x9272, 0x2c85,
                  0xa2bf, 0xe8a1, 0xa81a, 0x664b,
                  0xc24b, 0x8b70, 0xc76c, 0x51a3,
                  0xd192, 0xe819, 0xd699, 0x0624,
                  0xf40e, 0x3585, 0x106a, 0xa070,
                  0x19a4, 0xc116, 0x1e37, 0x6c08,
                  0x2748, 0x774c, 0x34b0, 0xbcb5,
                  0x391c, 0x0cb3, 0x4ed8, 0xaa4a,
                  0x5b9c, 0xca4f, 0x682e, 0x6ff3,
                  0x748f, 0x82ee, 0x78a5, 0x636f,
                  0x84c8, 0x7814, 0x8cc7, 0x0208,
                  0x90be, 0xfffa, 0xa450, 0x6ceb,
                  0xbef9, 0xa3f7, 0xc671, 0x78f2];

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        var vertices = new Float32Array([1, 1,-1, 1,
                                         1,-1,-1,-1]);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(posAtrLoc, 2, gl.FLOAT, false, 0, 0);

        dataLoc = gl.getUniformLocation(program, "data");
        hash1Loc = gl.getUniformLocation(program, "hash1");
        midstateLoc = gl.getUniformLocation(program, "midstate");
        targetLoc = gl.getUniformLocation(program, "target");
        nonceLoc = gl.getUniformLocation(program, "nonce_base");

        var hLoc = gl.getUniformLocation(program, "H");
        var kLoc = gl.getUniformLocation(program, "K");

        gl.uniform2fv(hLoc, h);
        gl.uniform2fv(kLoc, k);
}

function readScript(n) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", n, false);
    xhr.send(null);
    var x = xhr.responseText;
    return x;
};

function onl() {
    vShaderQuellcode = readScript('shader-vs.js');
    fShaderQuellcode = readScript('shader-fs.js');
};

function glminer(job, callback) {
    var run = true;
    
    var next_run = function(job, callback) {
        var nonces_per_pixel = 1;
        var t = job.t === undefined ? 0 : job.t;
        var nonce = job.nonce === undefined ? 0 : job.nonce;
        var threads = width * nonces_per_pixel;
        var curCnt = 0;
        var x = 0;
        var y = 0;
        var n;

        var submit_nonce = function() {
            n = derMiner.Util.to_uint16_array(job.nonce);
                            
            job.data[6] = n[0];
            job.data[7] = n[1];

            var r = [];
            for (var j = 0; j < job.half.length; j++)
                r.push(job.half[j]);
            for (var j = 0; j < job.data.length; j++)
                r.push(job.data[j]);
            
            var ret = derMiner.Util.toPoolString(r, true);
            
            job.golden_ticket = ret;
            callback(job);
        }

        while(run) {
            n = derMiner.Util.to_uint16_array(nonce);
            gl.uniform2fv(nonceLoc,  n);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            
            if (debug) console.log("w:" + width + " h:" + height);

            gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buf);

            for (var i=0; i<buf.length; i+=4) {
                if (debug) {
                    var out = [];
                    out.push(derMiner.Util.byte_to_hex(buf[i]));
                    out.push(derMiner.Util.byte_to_hex(buf[i+1]));
                    out.push(derMiner.Util.byte_to_hex(buf[i+2]));
                    out.push(derMiner.Util.byte_to_hex(buf[i+3]));
                    console.log("rgba("+(i/4)+"): " + JSON.stringify(out));
                }

                if (nonces_per_pixel == 1) {
                    if (buf[i] == 0 &&
                        buf[i+1] == 0 &&
                        buf[i+2] == 0 &&
                        buf[i+3] == 0) {

                        job.nonce = nonce + i * (nonces_per_pixel / 4);
                        submit_nonce();
                    }
                } else {
                    if (buf[i] != 0 ||
                        buf[i+1] != 0 ||
                        buf[i+2] != 0 ||
                        buf[i+3] != 0) {
                        for (var e = 0; e < 4; e++) {
                            for (var r = 7; r >= 0; r--) {
                                if (buf[i + e] & 1 << r) {
                                    var b = (3 - e) * (nonces_per_pixel / 4) + r;
                                    job.nonce = nonce + i * (nonces_per_pixel / 4) + b;
                                    submit_nonce();
                                }
                            }
                        }
                        
                        job.golden_ticket = null;
                    }
                }
            }

            if (nonce >= maxNonce) {
                cb(null);
                break;
            }

            nonce+= threads;
            TotalHashes += threads;

            if (t < (new Date()).getTime()) {
                t = (new Date()).getTime() + reportPeriod;
                job.total_hashes = TotalHashes;
                callback(job);
                TotalHashes = 0;
            }
            
            if (useTimeout && ++curCnt > maxCnt) {
                curCnt = 0;
                job.nonce = nonce;
                job.t = t;
                var c = function() {
                    next_run(job, callback);
                }
                window.setTimeout(c, 1);
                return;
            }
        }
    }
    var intMessage = function(event) {
        if (!event.data || !event.data.run) {
            run = false;
            console.log("worker: forced quit!");
            return;
        }
    };

    var mine = function(job, callback) {

        gl.uniform2fv(dataLoc, job.data);
        gl.uniform2fv(hash1Loc, job.hash1);
        gl.uniform2fv(midstateLoc, job.midstate);
        gl.uniform2fv(targetLoc, job.target);

        width = canvas.width;
        height = canvas.height;

        buf = new Uint8Array(width * height * 4);

        next_run(job, callback);
        return intMessage;
    }

    var is_golden_hash = function(hash, target) {
        var u1 = derMiner.Util.ToUInt32(hash);
        var u2 = derMiner.Util.ToUInt32(target[6]);
        
        console.log("worker: checking " + u1 + " <= " + u2);
        return (u1 <= u2);
    }

    return mine(job, callback);
};
