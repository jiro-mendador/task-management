<?php
// workaround without composer to access .env file
$env = parse_ini_file('.env');

//configs
$host = $env['MYSQL_HOST_NAME'];
$dbName = $env['MYSQL_DATABASE_NAME'];
$uName = $env['MYSQL_USERNAME'];
$pWord = $env['MYSQL_PASSWORD'];
// $host = "localhost";
// $dbName = "task_management";
// $uName = "root";
// $pWord = "";
//connection string
$connectionString = "mysql:host=$host;dbname=$dbName;";

try {

  //getting connection
  $pdo = new PDO($connectionString, $uName, $pWord);

  // for better error handling
  $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  // echo "Connection success...";

} catch (PDOException $pdoException) {

  //connection error
  die("Connection failed : " . $pdoException->getMessage());
}
