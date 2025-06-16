<?php
include_once("../config.php");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_POST["users"])) {
  $user = json_decode($_POST["users"]);

  switch ($user->action) {
    case "information":
      getUserInformation($user, $pdo);
      break;
    case "create":
      insertUser($user, $pdo);
      break;
    case "signIn":
      signIn($user, $pdo);
      break;
    case "signOut":
      signOut($user, $pdo);
      break;
    case "update":
      updateUser($user, $pdo);
      break;
  }
}

// * FUNCTIONS

function getUserInformation($user, $pdo)
{
  $sql = "SELECT last_name, first_name, username, password, email_number FROM users WHERE id = :user_id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":user_id", $user->id, PDO::PARAM_INT);
  if ($statement->execute()) {
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    echo json_encode(array_values($row));
  }
}

function updateUser($user, $pdo)
{
  $sql = "UPDATE users 
          SET last_name = :lName, first_name = :fName, username = :uName, 
              password = :pWord, email_number = :emNum 
          WHERE id = :user_id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":lName", $user->lastName);
  $statement->bindParam(":fName", $user->firstName);
  $statement->bindParam(":uName", $user->username);
  $statement->bindParam(":pWord", $user->password);
  $statement->bindParam(":emNum", $user->email);
  $statement->bindParam(":user_id", $user->id);

  echo json_encode(["res" => $statement->execute() ? "Success" : "Failed"]);
}

function insertUser($user, $pdo)
{
  if (isUsernameTaken($user, $pdo)) {
    echo json_encode(["res" => "Username"]);
    return;
  }

  if (isEmailAlreadyInUse($user, $pdo)) {
    echo json_encode(["res" => "Email"]);
    return;
  }

  $sql = "INSERT INTO users (last_name, first_name, username, password, email_number, isOnline)
          VALUES (:lName, :fName, :uName, :pWord, :emNum, 0);";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":lName", $user->lastName);
  $statement->bindParam(":fName", $user->firstName);
  $statement->bindParam(":uName", $user->username);
  $statement->bindParam(":pWord", $user->password);
  $statement->bindParam(":emNum", $user->email);

  echo json_encode(["res" => $statement->execute() ? "Success" : "Failed"]);
}

function signIn($user, $pdo)
{
  $sql = "SELECT id FROM users WHERE email_number = :emNum AND password = :pWord;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":emNum", $user->email);
  $statement->bindParam(":pWord", $user->password);
  $statement->execute();

  if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
    $update = $pdo->prepare("UPDATE users SET isOnline = 1 WHERE id = :user_id;");
    $update->bindParam(":user_id", $row["id"]);
    $update->execute();
    echo json_encode(["res" => "Success", "id" => $row["id"]]);
  } else {
    echo json_encode(["res" => "Failed"]);
  }
}

function signOut($user, $pdo)
{
  $sql = "UPDATE users SET isOnline = 0 WHERE id = :user_id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":user_id", $user->id);
  $statement->execute();
}

function isUsernameTaken($user, $pdo)
{
  $sql = "SELECT 1 FROM users WHERE username = :uName AND id != :user_id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":uName", $user->username);
  $statement->bindParam(":user_id", $user->id);
  $statement->execute();
  return $statement->fetch() !== false;
}

function isEmailAlreadyInUse($user, $pdo)
{
  $sql = "SELECT 1 FROM users WHERE email_number = :emNum AND id != :user_id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":emNum", $user->email);
  $statement->bindParam(":user_id", $user->id);
  $statement->execute();
  return $statement->fetch() !== false;
}