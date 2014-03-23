
var console = { log: function(m) {
                         postMessage({ golden_ticket: false, print: m});
              }};

var TotalHashes = 0;
var useTimeout = false;
try {
    importScripts('sha256.js');
    importScripts('util.js');
} catch (e) {
    useTimeout = true;
}

var reportPeriod = 1000;
var maxNonce = 0xFFFFFFFF;
var maxCnt = 5;
var run = true;

function scanhash(job, progress_report, cb) {
    var midstate = job.midstate;
    var data = job.data;
    var hash1 = job.hash1;
    var target = job.target;

    var t = job.t === undefined ? 0 : job.t;
    var nonce = job.nonce === undefined ? 0 : job.nonce;
    var curCnt = 0;

    if (!run || nonce > 0xFFFFFFFF) return;

    while(run) {

        data[3] = nonce;
        sha256.reset();
        var h1 = sha256.update(midstate, data).state;

        var h2 = hash1;
        for (var i=0; i<8; i++) h2[i] = h1[i];
        sha256.reset();

        var hash = sha256.update(h2).state;

        // console.log(derMiner.Util.toPoolString(hash));
        if (is_golden_hash(hash, target)) {
            job.nonce = nonce;

            var r = [];
            for (var i = 0; i < job.half.length; i++)
                r.push(job.half[i]);
            for (var i = 0; i < job.data.length; i++)
                r.push(job.data[i]);

            var ret = derMiner.Util.toPoolString(r);
            cb(ret);
            job.golden_ticket = null;
        }

        if (nonce >= maxNonce) {
            cb(null);
            break;
        }

        TotalHashes++;
        nonce++;

        if (t < (new Date()).getTime()) {
            t = (new Date()).getTime() + reportPeriod;
            progress_report();
        }

        if (useTimeout && ++curCnt > maxCnt) {
            curCnt = 0;
            job.nonce = nonce;
            job.t = t;
            var c = function() {
                scanhash(job, progress_report, cb);
            }
            window.setTimeout(c, 1);
            return;
        }
    }

    return;
}

function is_golden_hash(hash, target)
{
    if (hash[7] == 0x00000000) {
        var u1 = derMiner.Util.ToUInt32(hash[6]);
        var u2 = derMiner.Util.ToUInt32(target[6]);

        console.log("worker: checking " + u1 + " <= " + u2);
        return (u1 <= u2);
    }
    return false;
}

///// Web Worker /////

onmessage = function(event) {

    if (!event.data || !event.data.run) {
        run = false;
        console.log("worker: forced quit!");
        return;
    }

    var job = event.data;
    job.golden_ticket = false;

    sendProgressUpdate(job);

    var result = function (golden_ticket) {
        job.golden_ticket = golden_ticket;
        postMessage(job);
    };

    scanhash(event.data, function() { sendProgressUpdate(job); }, result);
};

function sendProgressUpdate(job)
{
    job.total_hashes = TotalHashes;

    postMessage(job);
    TotalHashes = 0;
}
