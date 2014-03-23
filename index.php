<?php
        error_reporting('E_NONE');
        $debug = 0;

        require_once 'filesystem.class.php';
        require_once 'jsonRPCClient.class.php';
        require_once 'credentials.class.php';

        $params = $_POST;
        if (empty($params)) {
            $params = $_GET;
        }

        $cache = array_key_exists('cache', $params) ? $params['cache'] : 0;
        $write = 0;

        if ($cache == 1) {
            $filename = 'work.dat';
            $workCacheTime = 120;
        }

        $request_body = $GLOBALS['HTTP_RAW_POST_DATA'];
        if (empty($request_body)) $request_body = @file_get_contents('php://input');

        # echo $request_body;
        # {"params": [], "method": "getwork", "id": "json"}
        try {
            $oo = json_decode( $request_body );
            if ($oo->{'method'} == "getwork") {
                $param = null;
                $bitcoin = new jsonRPCClient('http://'.$username.':'.$password.'@'.$url.':'.$port.'/');

                # ugly stuff, but count() returns always 0 :(
                foreach ($oo->{'params'} as $i => $value) {
                    $param = $value;
                    break;
                }

                if ($param == null) {
                    # example
                    # $w = '{ "midstate":"eae773ad01907880889ac5629af0c35438376e8c4ae77906301c65fa89c2779c","data":"0000000109a78d37203813d08b45854d51470fcdb588d6dfabbe946e92ad207e0000000038a8ae02f7471575aa120d0c85a10c886a1398ad821fadf5124c37200cb677854e0603871d07fff800000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000080020000","hash1":"00000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000010000","target":"0000000000000000000000000000000000000000000000000000f8ff07000000" }';
                    # real
                    if ($cache == 1 &&
                        mtime($filename) + $workCacheTime > time()) {
                        $of = json_decode(read($filename));
                    } else {
                        $of = $bitcoin->getwork();
                        if ($cache == 1) $write = 1;
                    }
                    header('HTTP/1.1 200 OK');
                    header('Content-Type: application/json');
                    # patch request id into response
                    $ret = json_decode('{}');
                    $ret->{'id'} = $oo->{'id'};
                    $ret->{'result'} = $of;
                    $ret->{'error'} = null;
                    echo json_encode($ret);
                    if ($write == 1) write($filename, json_encode($of));
                        
                } else {
                    $solution = $oo->{'params'}[0];
                    fappend('solutions.dat', '\nDATA:' . $solution);
                    # woooha! nonce to submit!
                    $of = $bitcoin->getwork($solution);
                    header('HTTP/1.1 200 OK');
                    header('Content-Type: application/json');
                    $ret = json_decode('{}');
                    $ret->{'id'} = $oo->{'id'};
                    $ret->{'result'} = $of;
                    $ret->{'error'} = null;
                    echo json_encode($ret);
                }
            } else if ($oo->{'method'} == "long-poll") {
                $longpoll = new jsonRPCClient('http://'.$username.':'.$password.'@'.$url.':'.$port.'/long-polling');
                $of = $longpoll->getwork();

                header('HTTP/1.1 200 OK');
                header('X-Long-Polling: /long-polling');
                header('Content-Type: application/json');

                # patch request id into response
                $ret = json_decode('{}');
                $ret->{'id'} = $oo->{'id'};
                $ret->{'result'} = $of;
                $ret->{'error'} = null;
                echo json_encode($ret);
            } else {
                header('HTTP/1.1 500 Internal Server Error :(');    
                # fappend('solutions.dat', "#03->" . $i . "<>" . $oo->{'params'}[$i] . "\n");
                # echo "Nerror";
            }
        } catch (Exception $e) {
            header('HTTP/1.1 500 Internal Server Error :(');
            # echo $e->getMessage();
        }
?>