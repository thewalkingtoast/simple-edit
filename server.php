<?php

//	print_r($_POST);

$ret = array("success" => true);

if ( isset($_POST["user-bio"]) )
	$ret["success"] = false;
	
echo json_encode($ret);