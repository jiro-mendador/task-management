<?php
include_once("../config.php");
header("Content-Type:application/json; charset=UTF-8");

if (isset($_POST["users"])) {

  // * json obj
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

// * functions
function getUserInformation($user, $pdo)
{
  $sql = "SELECT * FROM users WHERE id = :user_id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":user_id", $user->id, PDO::PARAM_INT);
  if ($statement->execute()) {
    $response = array();
    if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
      $response[] = $row["last_name"];
      $response[] = $row["first_name"];
      $response[] = $row["username"];
      $response[] = $row["password"];
      $response[] = $row["email_number"];
    }
    // response
    echo json_encode($response);
  }
}

function updateUser($user, $pdo)
{
  $sql = "UPDATE users SET last_name = :lName, first_name = :fName, username = :uName, password = :pWord, email_number = :emNum WHERE id = :user_id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":lName", $user->lastName, PDO::PARAM_STR);
  $statement->bindParam(":fName", $user->firstName, PDO::PARAM_STR);
  $statement->bindParam(":uName", $user->username, PDO::PARAM_STR);
  $statement->bindParam(":pWord", $user->password, PDO::PARAM_STR);
  $statement->bindParam(":emNum", $user->email, PDO::PARAM_STR);
  $statement->bindParam(":user_id", $user->id, PDO::PARAM_INT);

  if ($statement->execute()) {
    // response
    echo json_encode(array("res" => "Success"));
  }
}

function insertUser($user, $pdo)
{
  $sql = "INSERT INTO users VALUES (default, :lName, :fName, :uName, :pWord, :emNum, 0);";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":lName", $user->lastName, PDO::PARAM_STR);
  $statement->bindParam(":fName", $user->firstName, PDO::PARAM_STR);
  $statement->bindParam(":uName", $user->username, PDO::PARAM_STR);
  $statement->bindParam(":pWord", $user->password, PDO::PARAM_STR);
  $statement->bindParam(":emNum", $user->email, PDO::PARAM_STR);

  if (isUsernameTaken($user, $pdo)) {
    echo json_encode(["res" => "Username"]);
    return;
  }

  if (isEmailAlreadyInUse($user, $pdo)) {
    echo json_encode(["res" => "Email"]);
    return;
  }

  if ($statement->execute()) {
    // response
    echo json_encode(["res" => "Success"]);
    return;
  }

  echo json_encode(["res" => "Failed"]);
}

function signIn($user, $pdo)
{
  $sql = "SELECT * FROM users WHERE email_number = :emNum AND password = :pWord;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":emNum", $user->email, PDO::PARAM_STR);
  $statement->bindParam(":pWord", $user->password, PDO::PARAM_STR);
  if ($statement->execute()) {
    if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
      // * set the isOnline to 1
      $sql = "UPDATE users SET isOnline = 1 WHERE id = :user_id;";
      $statement = $pdo->prepare($sql);
      $statement->bindParam(":user_id", $row["id"], PDO::PARAM_INT);
      $statement->execute();
      // * response
      echo json_encode(["res" => "Success", "id" => $row["id"]]);
    } else {
      echo json_encode(["res" => "Failed"]);
    }
  }
}

function signOut($user, $pdo)
{
  $sql = "UPDATE users SET isOnline = 0 WHERE id = :user_id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":user_id", $user->id, PDO::PARAM_INT);
  $statement->execute();
}

function isUsernameTaken($user, $pdo)
{
  $sql = "SELECT * FROM users WHERE username = :uName AND id != :user_id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":uName", $user->username, PDO::PARAM_STR);
  $statement->bindParam(":user_id", $user->id, PDO::PARAM_INT);
  if ($statement->execute()) {
    if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
      return true;
    }
  }
  return false;
}

function isEmailAlreadyInUse($user, $pdo)
{
  $sql = "SELECT * FROM users WHERE email_number = :emNum AND id != :user_id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":emNum", $user->email, PDO::PARAM_STR);
  $statement->bindParam(":user_id", $user->id, PDO::PARAM_INT);
  if ($statement->execute()) {
    if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
      return true;
    }
  }
  return false;
}