<?php     
/*// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');    // cache for 1 day
}
// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");         

        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers:        {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
		exit(0);
}*/
require 'Slim/Slim.php';

$app = new Slim();
//  GET
$app->get('/events/', 'getAll');
$app->get('/events/dateRange/:dateRange', 'getByDateRange');
$app->get('/events/sum/:endDate', 'getSumTillDate');
$app->get('/timeline', 'getTimeline');
$app->get('/sync', 'getSync');
$app->run();

/*--------------------------------------------------------GET SYNC----------------------------------------------------*/
function getSync() {
	$sql = "SELECT startDate, endDate, taskName, status FROM Attention";
	try {
		$db = getConnection();
		$stmt = $db->query($sql);  
		$events = $stmt->fetchAll(PDO::FETCH_ASSOC);
		//print_r($events);
		echo json_encode($events);
		$db = null;
	} catch(PDOException $e) {
		echo '{"error":{"text":'. $e->getMessage() .'}}'; 
	}
}
/*--------------------------------------------------------GET ALL----------------------------------------------------*/
function getAll() {
	$sql = "SELECT id, best_est, latitude, longitude FROM ged40 WHERE date_start = date_end GROUP BY `id` ORDER BY date_start ASC";   
	try {
		$db = getConnection();
		$stmt = $db->query($sql);  
		$events = $stmt->fetchAll(PDO::FETCH_ASSOC);
		//print_r($events);
		echo json_encode($events);
		$db = null;
	} catch(PDOException $e) {
		echo '{"error":{"text":'. $e->getMessage() .'}}'; 
	}
}
/*------------------------------------GET BY-------------------------------------*/
function getByDateRange($dateRange){
		//$sql = "SELECT id, best_est, latitude, longitude FROM ged40 WHERE date_start = date_end AND date_start >= :startDate AND date_start <= :endDate  ORDER BY date_start ASC";   
		$sql = "SELECT SUM(CAST(`best_est` AS UNSIGNED)) AS best_est, SUM(CASE WHEN `side_a` = 'IS' THEN CAST(`deaths_a` AS UNSIGNED) WHEN `side_b` = 'IS' THEN CAST(`deaths_b` AS UNSIGNED) ELSE 0 END) AS deaths_is, SUM(CASE WHEN `side_a` NOT IN ('IS') THEN CAST(`deaths_a` AS UNSIGNED) WHEN `side_b` NOT IN ('IS') THEN CAST(`deaths_b` AS UNSIGNED) ELSE 0 END) AS deaths_geg, SUM(CAST(`deaths_civilians` AS UNSIGNED)) AS deaths_civ, SUM(CAST(`deaths_unknown` AS UNSIGNED)) AS deaths_unk, ANY_VALUE(`latitude`) AS latitude, ANY_VALUE(`longitude`) as longitude, ANY_VALUE(`where_coordinates`) as where_coordinates FROM ged40 WHERE ANY_VALUE(`date_start`) = `date_end` AND ANY_VALUE(`date_start`) >= :startDate AND ANY_VALUE(`date_start`) <= :endDate AND `best_est` != '0' AND `where_coordinates` NOT IN ('Iraq') GROUP BY `geom_wkt` ORDER BY ANY_VALUE(`date_start`) ASC";  
		//`latitude`,`longitude`,`where_coordinates`,`date_start`
		
		//ANY_VALUE()
		try {		
			$db = getConnection();
			$stmt = $db->prepare($sql); 
			$teile = explode("_", $dateRange);
			$stmt->bindParam("startDate", $teile[0]);
			$stmt->bindParam("endDate", $teile[1]);
			$stmt->execute();
			$eventsByLocation = $stmt->fetchAll(PDO::FETCH_ASSOC);
			//print "<pre>";
			//print_r($events);
			//print "</pre>";	
			$sql2 = "SELECT `latitude`, `longitude`, `date_start`, `deaths_a`, `deaths_b`, `deaths_civilians`, `deaths_unknown`, `side_a`, `side_b`, `dyad_name` FROM ged40 WHERE `date_start` = `date_end` AND `date_start` >= :startDate AND `date_start` <= :endDate AND `best_est` != '0' AND `where_coordinates` NOT IN ('Iraq') ORDER BY `date_start` ASC"; 
			$stmt = $db->prepare($sql2); 
			$stmt->bindParam("startDate", $teile[0]);
			$stmt->bindParam("endDate", $teile[1]);
			$stmt->execute();
			$eventsByDate = $stmt->fetchAll(PDO::FETCH_ASSOC);
			
			$object = new stdClass();
			$object->byLoc = $eventsByLocation;
			$object->byDate = $eventsByDate;
			echo json_encode($object);
			$db = null;
		} catch(PDOException $e) {
			echo '{"error":{"text":'. $e->getMessage() .'}}'; 
		}
}
function getSumTillDate($endDate){
		//$sql = "SELECT id, best_est, latitude, longitude FROM ged40 WHERE date_start = date_end AND date_start >= :startDate AND date_start <= :endDate  ORDER BY date_start ASC";   
		$sql = "SELECT SUM(CAST(`best_est` AS UNSIGNED)) AS best_est, SUM(CASE WHEN `side_a` = 'IS' THEN CAST(`deaths_a` AS UNSIGNED) WHEN `side_b` = 'IS' THEN CAST(`deaths_b` AS UNSIGNED) ELSE 0 END) AS deaths_is, SUM(CASE WHEN `side_a` NOT IN ('IS') THEN CAST(`deaths_a` AS UNSIGNED) WHEN `side_b` NOT IN ('IS') THEN CAST(`deaths_b` AS UNSIGNED) ELSE 0 END) AS deaths_geg, SUM(CAST(`deaths_civilians` AS UNSIGNED)) AS deaths_civ, SUM(CAST(`deaths_unknown` AS UNSIGNED)) AS deaths_unk FROM `ged40` WHERE `date_start` <= :endDate AND `date_start` >= '2010-01-01'";  
		try {		
			$db = getConnection();
			$stmt = $db->prepare($sql); 
			$stmt->bindParam("endDate", $endDate);
			$stmt->execute();
			$sumObj = $stmt->fetchAll(PDO::FETCH_ASSOC);
			//print "<pre>";
//			print_r($sumObj);
//			print "</pre>";
			$array = array();	
			//array_push($array, $sumObj[0]['best_est']);
			array_push($array, $sumObj[0]['deaths_is']);
			array_push($array, $sumObj[0]['deaths_geg']);
			array_push($array, $sumObj[0]['deaths_civ']);
			array_push($array, $sumObj[0]['deaths_unk']);
			echo json_encode($array);
			$db = null;
		} catch(PDOException $e) {
			echo '{"error":{"text":'. $e->getMessage() .'}}'; 
		}
}
/*------------------------------------GET FORMATTED DATA-------------------------------------*/


//DATA FORMATTED FOR D3 THEME RIVER
function getTimeline(){
	//AND deaths_a < 100 AND deaths_b < 100 AND deaths_civilians AND deaths_unknown < 100
	//$sql = "SELECT deaths_a, deaths_b, deaths_civilians, deaths_unknown, date_start FROM ged40 WHERE date_start = date_end ORDER BY date_start ASC";
	$sql = "SELECT SUM(CASE WHEN `side_a` = 'IS' THEN CAST(`deaths_a` AS UNSIGNED) WHEN `side_b` = 'IS' THEN CAST(`deaths_b` AS UNSIGNED) ELSE 0 END) AS deaths_is, SUM(CASE WHEN `side_a` NOT IN ('IS') THEN CAST(`deaths_a` AS UNSIGNED) WHEN `side_b` NOT IN ('IS') THEN CAST(`deaths_b` AS UNSIGNED) ELSE 0 END) AS deaths_geg, SUM(CAST(`deaths_civilians` AS UNSIGNED)) AS deaths_civ, SUM(CAST(`deaths_unknown` AS UNSIGNED)) AS deaths_unk, `date_start` FROM `ged40` WHERE `date_start` = `date_end` AND `date_start` >= '2010-01-01' GROUP BY `date_start` ORDER BY `date_start` ASC";
	try {
		$db = getConnection();
		$stmt = $db->query($sql);  
		$events = $stmt->fetchAll(PDO::FETCH_ASSOC);
		//print_r($events);
		$dataArray = array();
		foreach($events as $event) {
			$array = array($event["deaths_is"], $event["deaths_geg"], $event["deaths_civ"], $event["deaths_unk"]);
			$keyArray = array("I","G","Z","U");

			$objectIS = new stdClass();
			$objectGeg = new stdClass();
			$objectCiv = new stdClass();
			$objectUnk = new stdClass();
			
			$objectIS->key = $keyArray[0];
			$objectIS->date = $event["date_start"];
			$objectIS->value = (int)$array[0];
			
			$objectGeg->key = $keyArray[1];
			$objectGeg->date = $event["date_start"];
			$objectGeg->value = (int)$array[1];
				
			$objectCiv->key = $keyArray[2];
			$objectCiv->date = $event["date_start"];
			$objectCiv->value = (int)$array[2];
				
			$objectUnk->key = $keyArray[3];
			$objectUnk->date = $event["date_start"];
			$objectUnk->value = (int)$array[3];
			
			array_push($dataArray, $objectIS);
			array_push($dataArray, $objectGeg);
			array_push($dataArray, $objectCiv);
			array_push($dataArray, $objectUnk);
		}
		//print "<pre>";
//		print_r($dataArray);
//		print "</pre>";
		
		echo json_encode($dataArray);
		$db = null;
	} catch(PDOException $e) {
		echo '{"error":{"text":'. $e->getMessage() .'}}'; 
	}
}

/*function mapToRange($OldMin, $OldMax, $NewMin, $NewMax, $OldValue) {
	$NewValue;
	$OldRange = ($OldMax - $OldMin); 1700
	if($OldRange == 0) {
		$NewValue = $NewMin;
	} else {
		$NewRange = ($NewMax - $NewMin); 10
		$NewValue = ((($OldValue - $OldMin) * $NewRange) / $OldRange) + $NewMin;
	}	
	return $NewValue;
}*/

//DATA FORMATTED FOR GOOGLE AREA CHART
/*function getTimeline(){
	//AND deaths_a < 100 AND deaths_b < 100 AND deaths_civilians AND deaths_unknown < 100
		$sql = "SELECT deaths_a, deaths_b, deaths_civilians, deaths_unknown, date_start FROM ged40 WHERE date_start = date_end ORDER BY date_start ASC";   
		try {
		$db = getConnection();
		$stmt = $db->query($sql);  
		$events = $stmt->fetchAll(PDO::FETCH_ASSOC);
		//print_r($events);	
		$dataArray = array();
		$keyArray = array("Datum","Militär","Zivilisten","Unbekannt");
		array_push($dataArray, $keyArray);
		$lastDate = "";
		foreach($events as $event) {
			if($event["date_start"] == $lastDate) continue;
			$military = (int)$event["deaths_a"] + (int)$event["deaths_b"];
			$array = array($event["date_start"], $military, (int)$event["deaths_civilians"], (int)$event["deaths_unknown"]);
			array_push($dataArray, $array);
			$lastDate = $event["date_start"];
		}
		//print "<pre>";
//		print_r($dataArray);
//		print "</pre>";
		
		echo json_encode($dataArray);
		$db = null;
	} catch(PDOException $e) {
		echo '{"error":{"text":'. $e->getMessage() .'}}'; 
	}
}*/

/*------------------------------------DB CONNECTION -----------------------------------------*/

function getConnection() {
	$dbhost="mysql5";
	$dbuser="flock-1104";
	$dbpass="eN5XnDVjrpHh";
	$dbname="db_flock-1104_1";
	$dbh = new PDO("mysql:host=$dbhost;dbname=$dbname", $dbuser, $dbpass, array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));	//http://stackoverflow.com/questions/584676/how-to-make-pdo-run-set-names-utf8-each-time-i-connect-in-zendframework
	$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
	return $dbh;
}
?>