<?php
require_once 'credentials.class.php';
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
        <title>Mining via Javascript and WebGL</title>
      <script>
         var g_user = '<? echo $username ?>';
         var g_password = '<? echo $password ?>';
         var g_url = '<? echo $url ?>';
         var g_port = '<? echo $port ?>';
      </script>

      <SCRIPT src="http://code.jquery.com/jquery-1.11.0.min.js"></SCRIPT>
      <SCRIPT src="sha256.js"></SCRIPT>
      <SCRIPT src="util.js"></SCRIPT>
      <SCRIPT src="work-manager.js"></SCRIPT>
      <SCRIPT src="glminer.js"></SCRIPT>
    </head>

    <BODY>
                <br /><b>Hamiyoca! - Hash me if you can :D</b>
                <br />
                <br />This is a demo page that shows how to mine bitcoins via Javascript and WebGL.
                <br />If this page helps you to understand mining or saves you some time to implement
                <br />one these methods by yourself please donate me some cents!
                <br />
                <br />1DonatemDfMvQsLweYxPyA29rdgsXsxEc7 <b>Thanks.</b>
                <br />
                <br />The project source is located <a href="https://github.com/derjanb/hamiyoca">here</a>.
                <br />
                <div id="control">
		<br />Mine Method: 
		<input type="radio" name="method" value="js" checked="checked"> Javascript
		<input type="radio" name="method" value="jsworker"> WebWorker
		<input type="radio" name="method" value="webgl"> WebGL
		<br />WebGL Threads: <INPUT id="threads" value="512"/>
		<br /><input type="checkbox" id="testmode"> Testmode (Nonce will be found after ~18 khashes)
		<br><br><button id="start" onclick="begin_mining(); document.getElementById('start').style.display = 'none';">Start</button>
                </div">
		<br />
		<br />Total Hashes: <INPUT id="total-hashes" />
		<br />Hash/s: <INPUT id="hashes-per-second" />
		<br />Target/Difficulty: <INPUT id="target" />
		<br />Golden Ticket: <INPUT id="golden-ticket" />
		<BR/>
		<br />Info: <textarea id="info" style="width: 400px; height: 300px;"></textarea>
		<BR/>
     </BODY>

</html>
