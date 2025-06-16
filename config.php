<?php
// workaround without composer to access .env file
$env = parse_ini_file('.env');

// configs for PostgreSQL
$host = $env['DB_HOST_NAME'];
$port = $env['DB_PORT'];
$dbName = $env['DB_DATABASE_NAME'];
$uName = $env['DB_USERNAME'];
$pWord = $env['DB_PASSWORD'];
$connectionString = "pgsql:host=$host;port=$port;dbname=$dbName;";

// configs prev mysql
// $host = "localhost";
// $dbName = "task_management";
// $uName = "root";
// $pWord = "";
//connection string
// $connectionString = "mysql:host=$host;dbname=$dbName;";

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
