<?php
include_once("../config.php");
header("Content-Type:application/json; charset=UTF-8");

// * conditions
if (isset($_POST["projects"])) {

  // * json obj
  $object = json_decode($_POST["projects"]);

  switch ($object->action) {
    case "DEADLINES":
      getDeadlinesToday($object, $pdo);
      break;
    case "PROJECTS_LIMIT5":
      getRecentProjects($object, $pdo, 5);
      break;
    case "COMPLETED_COUNT":
      getTaskCompletedCount($object, $pdo);
      break;
    case "progress":
      updateProjectProgress($object, $pdo);
      break;
  }

} elseif (isset($_POST["tasks"])) {
  // * json obj
  $object = json_decode($_POST["tasks"]);

  switch ($object->action) {
    case "status":
      updateTaskStatus($object, $pdo);
      break;
    case "activity":
      getTaskActivity($object, $pdo);
      break;
  }
}


// * functions
function getDeadlinesToday($object, $pdo)
{
  $sql = "SELECT t.id, t.project_id, t.name FROM projects p 
              JOIN tasks t ON p.id = t.project_id 
              WHERE p.id IN (SELECT id FROM projects WHERE DATE(deadline) = CURRENT_DATE) 
              AND t.date_completed IS NULL AND user_id = :user ORDER BY CASE p.priority_level 
      			WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END, p.deadline";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":user", $object->user_id, PDO::PARAM_INT);
  $statement->execute();
  $response = array();
  while ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
    $object = new stdClass();
    $object->id = $row["id"];
    $object->project_id = $row["project_id"];
    $object->task_name = $row["name"];
    $response[] = $object;
  }
  echo json_encode($response);
}

function getRecentProjects($object, $pdo, $limit)
{
  $sql = "SELECT * FROM projects WHERE user_id = :user ORDER BY id DESC LIMIT :limit;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":user", $object->user_id, PDO::PARAM_INT);
  $statement->bindParam(":limit", $limit, PDO::PARAM_INT);
  $statement->execute();
  $response = array();
  while ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
    $object = new stdClass();
    $object->id = $row["id"];
    $object->title = $row["title"];
    $object->priority = $row["priority_level"];
    $object->progress = $row["progress"];
    $object->deadline = $row["deadline"];
    $response[] = $object;
  }
  echo json_encode($response);
}

function getTaskCompletedCount($object, $pdo)
{
  $sql = "SELECT COUNT(*) as 'completed_count' FROM users JOIN projects ON users.id = projects.user_id JOIN tasks ON projects.id = tasks.project_id WHERE users.id = :user and tasks.date_completed IS NOT NULL;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":user", $object->user_id, PDO::PARAM_INT);
  $statement->execute();
  $response = array();
  while ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
    $object = new stdClass();
    $object->count = $row["completed_count"];
    $response[] = $object;
  }
  echo json_encode($response);
}

function updateProjectProgress($object, $pdo)
{
  $sql = "UPDATE projects SET progress = 
              (SELECT (100 / (COUNT(*)) * (SELECT COUNT(*) FROM `tasks` 
                WHERE project_id = :project AND date_completed IS NOT NULL)) as 'percent' 
              FROM `tasks` WHERE project_id = :project) 
           WHERE id = :project AND user_id = :user";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":project", $object->id, PDO::PARAM_INT);
  $statement->bindParam(":user", $object->user_id, PDO::PARAM_INT);

  if ($statement->execute()) {
    $sql = "SELECT progress FROM projects WHERE id = :project AND user_id = :user;";
    $statement = $pdo->prepare($sql);
    $statement->bindParam(":project", $object->id, PDO::PARAM_INT);
    $statement->bindParam(":user", $object->user_id, PDO::PARAM_INT);
    $statement->execute();
    $response = array();
    if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
      $object = new stdClass();
      $object->progress = $row["progress"];
      $response[] = $object;
    }
    echo json_encode($response);
  }
}

function updateTaskStatus($object, $pdo)
{
  $sql = "UPDATE tasks SET date_completed = :date_completed WHERE id = :id AND project_id = :project;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":id", $object->id, PDO::PARAM_INT);
  $statement->bindParam(":project", $object->project_id, PDO::PARAM_INT);
  $statement->bindParam(":date_completed", $object->date_completed, PDO::PARAM_STR);
  if ($statement->execute()) {
    // response
    echo json_encode(array("res" => "Success"));
  }
}

function getTaskActivity($object, $pdo)
{
  // ! theres a bug here
  $sql = "SELECT COUNT(tasks.date_completed) as 'count' FROM users JOIN projects ON users.id = projects.user_id JOIN tasks ON projects.id = tasks.project_id WHERE users.id = :user and DATE(tasks.date_completed) = :date and tasks.date_completed IS NOT NULL;";

  if ($object->type === "date_added") {
    $sql = "SELECT COUNT(t.date_added) as count FROM tasks t JOIN projects p ON p.id = t.project_id JOIN users u ON p.user_id = u.id WHERE DATE(t.date_added) = :date AND u.id = :user;";
    // $sql = "SELECT COUNT(date_added) AS 'count' FROM `tasks` WHERE DATE(date_added) = :date AND user_id = :user;";
  }

  $response = array();
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":user", $object->user_id, PDO::PARAM_INT);
  $statement->bindParam(":date", $object->date, PDO::PARAM_STR);
  $statement->execute();
  if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
    $object = new stdClass();
    $object->count = $row["count"];
    $response[] = $object;
    echo json_encode($response);
    return;
  }
  echo json_encode(array("count" => "0"));
}