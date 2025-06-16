<?php
// ! for error checking
ini_set('display_errors', 1);
error_reporting(E_ALL);
// workaround without composer to access .env file
$env = parse_ini_file('../.env');

include_once("../config.php");
header('Content-Type: application/json');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// * receiving data using fetch api POST
$data = json_decode(file_get_contents('php://input'));
if (isset($data->action)) {
  switch ($data->action) {
    case "send":
      sendEmailReminder($data);
      break;
    case "editJSON":
      editJSON($data->user);
      break;
    case "get_email":
      getEmail($data, $pdo);
      break;
  }
  return;
}

// * receiving data using ajax req POST
if (isset($_POST["mail"])) {

  // * json obj
  $mail = json_decode($_POST["mail"]);

  switch ($mail->action) {
    case "send":
      sendEmailReminder($mail);
      break;
    case "get_email":
      getEmail($mail, $pdo);
      break;
    case "editJSON":
      editJSON($mail->user);
      break;
  }
}

function sendEmailReminder($mail)
{

  $recipient_email = $mail->recipient_email;
  $recipient_name = $mail->recipient_name;
  $subject = $mail->subject;
  $contents = $mail->message;

  $mail = new email();
  $mail->sendEmail(
    $recipient_name,
    $recipient_email,
    $subject,
    $contents
  );
}

function getEmail($mail, $pdo)
{
  $sql = "SELECT u.id as 'user_id', CONCAT(u.first_name,' ',u.last_name) as 'name', 
    u.email_number, p.title, p.progress, p.deadline, p.priority_level FROM projects p
	  JOIN users u ON p.user_id = u.id WHERE DATE(deadline) = CURRENT_DATE;";
  $statement = $pdo->prepare($sql);
  if ($statement->execute()) {
    $response = array();
    while ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
      $user = new stdClass();
      $user->user_id = $row["user_id"];
      $user->name = $row["name"];
      $user->email = $row["email_number"];
      $user->title = $row["title"];
      $user->progress = $row["progress"];
      $user->deadline = $row["deadline"];
      $user->priority = $row["priority_level"];
      $response[] = $user;
    }
    echo json_encode($response);
  }
}

// function editJSON($data)
// {
//   // Assuming your JSON file path is 'path/to/your/file.json'
//   $file_path = 'email_checker.json';

//   // Read the existing JSON data from the file
//   $existing_data = json_decode(file_get_contents($file_path), true);

//   // Modify the data (add or update as needed)
//   $existing_data['user'] = array_merge($existing_data['user'], $data->user);

//   // Convert the modified data back to JSON
//   $updated_json_data = json_encode($existing_data, JSON_PRETTY_PRINT);

//   // Write the updated JSON data back to the file
//   file_put_contents($file_path, $updated_json_data);

//   // Send a response (optional)
//   echo json_encode(array("res" => "Success"));
// }

function editJSON($data)
{
  // Read the JSON file
  $jsonFile = 'email_checker.json';
  $jsonString = file_get_contents($jsonFile);
  // decode the JSON
  $existingData = json_decode($jsonString, true);

  // for editing the json file
  // // Decode JSON data
  // //$data = json_decode($jsonString, true);
  // // Modify the "id" value
  // // $data["user"][0]["id"] = 3;

  // just writing data
  $existingData["user"][] = $data;

  // Re-encode and save it back into the file
  $newJsonString = json_encode($existingData, JSON_PRETTY_PRINT);
  file_put_contents($jsonFile, $newJsonString);

  echo json_encode(array("res" => "Success"));
}


class Email
{
  public function sendEmail($name, $email, $subject, $contents)
  {

    // Load Composer's autoloader
    require 'phpmailer/phpmailer/vendor/autoload.php';
    // Instantiation and passing `true` enables exceptions
    $mail = new PHPMailer(true);

    try {
      //Server settings
      $mail->SMTPDebug = 0; // Enable verbose debug output
      $mail->isSMTP(); // Set mailer to use SMTP
      $mail->Host = 'smtp.gmail.com'; // Specify main and backup SMTP servers
      $mail->SMTPAuth = true; // Enable SMTP authentication
      $mail->Username = $env['GMAIL_EMAIL']; // SMTP username
      $mail->Password = $env['GMAIL_APP_KEY']; // SMTP password
      $mail->SMTPSecure = 'tls'; // Enable TLS encryption, `ssl` also accepted
      $mail->Port = 587; // TCP port to connect to

      // * solution to this error => Message could not be sent. Mailer Error: SMTP Error: Could not connect to SMTP host
      $mail->SMTPOptions = array(
        'ssl' => array(
          'verify_peer' => false,
          'verify_peer_name' => false,
          'allow_self_signed' => true
        )
      );

      //Recipients
      $mail->setFrom('20210548m.mendador.jiro.bscs@gmail.com', 'Task-Management');
      $mail->addAddress($email, $name); // Add a recipient

      // Content
      $mail->isHTML(true); // Set email format to HTML
      $mail->Subject = $subject;
      // $mail->Body = '';
      $mail->Body = $contents;
      $mail->send();
      // echo 'Message has been sent'; // ! changed to array response
      echo json_encode(array("res" => "Message has been sent"));
    } catch (Exception $e) {
      // echo 'Message has been sent'; // ! changed to array response
      // echo 'Message could not be sent. Mailer Error: ', $mail->ErrorInfo;
      echo json_encode(array("res" => "Message could not be sent. Mailer Error: " . $mail->ErrorInfo));
    }
  }
}