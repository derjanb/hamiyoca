<?php

    function mopen($myFile, $mode) {
        for ($i = 1; $i <= 10; $i++) {
            try {
                $fh = fopen($myFile, $mode);
                if (is_resource($fh)) return $fh;
            } catch (Exception $e) {} 
        }
        return null;
    }

    function read($myFile) {
        $theData = "";

        if (file_exists($myFile) && filesize($myFile) > 0) {
            $fh = mopen($myFile, 'r');
            $theData = fread($fh, filesize($myFile));
            fclose($fh);
        }
        return $theData;
    }

    function write($myFile, $data) {
        $fh = mopen($myFile, 'w+') or die("can't open file");
        $stringData = $data;
        fwrite($fh, $stringData);
        fclose($fh);
    }

    function fappend($myFile, $data) {
        $fh = mopen($myFile, 'a+') or die("can't open file");
        $stringData = $data . "\n";
        fwrite($fh, $stringData);
        fclose($fh);
    }

    function mtime($myFile) {
        $LastModified = 0;

        if (file_exists($myFile)) {
            $LastModified = filemtime($myFile);
        }
        return $LastModified;
    }

    function emu_getallheaders() { 
        foreach ($_SERVER as $name => $value)  { 
            if (substr($name, 0, 5) == 'HTTP_')  { 
                $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5))))); 
                $headers[$name] = $value; 
            } else if ($name == "CONTENT_TYPE") { 
                $headers["Content-Type"] = $value; 
            } else if ($name == "CONTENT_LENGTH") { 
                $headers["Content-Length"] = $value; 
            } 
        } 
        return $headers; 
    }
?>