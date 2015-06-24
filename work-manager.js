
var console = window.console ?  window.console : { log: function() {} };
var worker = null;
var testmode = false;
var repeat_to = null;
var use_to = 0; // 5;
var no_cache = false;
var init = false;
var start = null;
var id = 1;
// use this in case we can directly connect to a given pool
// var _url = 'http://' + g_user + ':' + g_password + '@' + g_url + ':' + g_port;
var _url = 'index.php';

function readScript(n) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", n, false);
    xhr.send(null);
    var x = xhr.responseText;
    return x;
};

function onError(data) {
    $('#info').val(data.status + " " + data.responseText);
}

function onSuccess(jsonresp) {
    if (worker) {
        try {
            worker.postMessage( { run: false } );
            worker.terminate();
        } catch (e) {}
    }
    id = Number(jsonresp.id) + 1;
    var response = jsonresp.result;
    var data = JSON.stringify(response);

    $('#info').val(data);

    var type = $('[type=radio]');

    if (type.length == 0) type = [ {checked:true} , {checked:false} , {checked:false}]
    var job = {};
    var gl = type[2].checked

    job.run = true;
    job.work = data;

    job.midstate = derMiner.Util.fromPoolString(response.midstate, gl);
    job.half = derMiner.Util.fromPoolString(response.data.substr(0, 128), gl);
    job.data = derMiner.Util.fromPoolString(response.data.substr(128, 256), gl);
    job.hash1 = derMiner.Util.fromPoolString(response.hash1, gl);
    job.target = derMiner.Util.fromPoolString(response.target, gl);

    var t = derMiner.Util.ToUInt32(derMiner.Util.fromPoolString(response.target, false)[6]);
    var d = (4273753909.69051265) / t;
    $('#target').val(t + "/" + d.toFixed(3));
 
    if (testmode) {
        job.nonce = derMiner.Util.fromPoolString("204e2e35")[0];
    } else {
        job.nonce = Math.floor ( Math.random() * 0xFFFFFFFF );
    }

    job.hexdata = response.data;

    if (type[2].checked) {
        var postMessage = function(m) {
            onWorkerMessage({ data: m });
        }
        var th = $('#threads')[0].value;
        if (!init) meinWebGLStart(th);
        worker = { postMessage : function(m) { worker.intMessage( { data: m} ) },
                   intMessage : glminer(job, postMessage) };
    } else if (type[0].checked) {
        var postMessage = function(m) {
            onWorkerMessage({ data: m });
        }
        worker = { postMessage : function(m) { worker.intMessage( { data: m} ); },
                   intMessage: function() {} };
        var m = readScript('miner.js');
        var s = '(function() {' + m + ';\n' + 'onmessage({ data: job });' + ' worker.intMessage = onmessage; })';
        var run = eval(s);
        run();
    } else {
        worker = new Worker("miner.js");
        worker.onmessage = onWorkerMessage;
        worker.onerror = onWorkerError;
        worker.postMessage(job);
    }

    init = true;
}

function begin_mining() {
    var tm = $('#testmode');
    testmode = tm.length > 0 && tm[0].checked;
    start = (new Date()).getTime();
    
    if (testmode) {
        var dd = '{"midstate":"eae773ad01907880889ac5629af0c35438376e8c4ae77906301c65fa89c2779c","data":"0000000109a78d37203813d08b45854d51470fcdb588d6dfabbe946e92ad207e0000000038a8ae02f7471575aa120d0c85a10c886a1398ad821fadf5124c37200cb677854e0603871d07fff800000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000","hash1":"00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000","target":"0000000000000000000000000000000000000000000000000000f8ff07000000", "sol" : "31952e35"}'; // near match with nonce = 0
        onSuccess({ result: JSON.parse(dd)});
    } else {
        if (use_to) {
            var enqueuMiner = function() {
                get_work();
                repeat_to = window.setTimeout(enqueuMiner, use_to * 1000);
            };
            repeat_to = window.setTimeout(enqueuMiner, 1000);
        } else {
            get_work(true);
            long_poll();
        }
    }
}

var long_poll_suc = null;
function long_poll() {
    var done = function(resp) {
        if (resp.result || long_poll_suc) {
            long_poll_suc = true;
            if (resp.result) {
                onSuccess(resp);
                // Workaround to allow the WebWorker to load all files from single threaded web servers like "php -S"
                window.setTimeout(long_poll, 1000);
            } else {
                long_poll();
            }

        } else if (long_poll_suc === null) {
            console.log('Stop polling!!!!');
            long_poll_suc = false;
            window.setInterval(get_work, 3 * 60 * 1000);
        }
    };

    $.ajax({ url: _url + "/long-polling" + (no_cache ? "?cache=0&ts=" + (new Date().getTime()) : ''),
             data: '{ "method": "long-poll", "id": "' + id + ' ", "params": [] }',
             type: "POST",
             headers: {
             },
             success: done,
             error: done,
             dataType: "json" });
}

function get_work() {
    $.post(_url + (no_cache ? "?cache=0&ts=" + (new Date().getTime()) : ''),
           '{ "method": "getwork", "id": "' + id + '", "params": [] }',
           onSuccess,
           "text json");
}

function onWorkerMessage(event) {
    var job = event.data;

    if(job.print) console.log('worker:' + job.print);

    if (job.golden_ticket) {
        if (job.nonce) console.log("nonce: " + job.nonce);
        $('#golden-ticket').val(job.golden_ticket);
   
        if (!testmode) {
            $.post(_url,
                   '{ "method": "getwork", "id": "json", "params": ["' + job.golden_ticket + '"] }',
                   function(data, textStatus) {
                       console.log("manager:" + data + "#" + textStatus);
                       // go to get it... again ;)
                       begin_mining();
                   });
        }
        if (repeat_to) {
            window.clearTimeout(repeat_to);
        }
    }

    if (!job.total_hashes) job.total_hashes = 1;

    var total_time = ((new Date().getTime()) - start) / 1000;
    var total_hashed = job.total_hashes + Number($('#total-hashes').val());
    var hashes_per_second = total_hashed / (total_time+1);

    $('#total-hashes').val(total_hashed);
    var old = Number($('#hashes-per-second').val());
    if (old == "NaN" || old == "Infinity") old = 0;
    $('#hashes-per-second').val(Math.round((old + hashes_per_second) / 2));
}

function onWorkerError(event) {
	throw event.data;
}

window.onload = function(){

    onl();
    
    // try {
        var d = document.createElement('div');
        d.setAttribute('style', 'display:none');

        var add = false;
        var arr = [ "total-hashes", "hashes-per-second", "golden-ticket", "info" ];

        for (var i=0; i < arr.length; i++) {
            var n = arr[i];
            var l = document.getElementById(n);
            if (!l) {
                var e = document.createElement('input');
                d.appendChild(e);
                add = true;
            } else {
                l.value = "";
            }
        }

        if (add) {
            document.body.appendChild(d);
        }

    // } catch (e) {
    //     console.log("manager:" + e);
    // }
}
