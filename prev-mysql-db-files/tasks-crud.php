<?php
include_once("../config.php");
header("Content-Type:application/json; charset=UTF-8");

// * conditions
if (isset($_POST["tasks"])) {

  // * json obj
  $task = json_decode($_POST["tasks"]);

  switch ($task->action) {
    case "insert":
      insertTask($task, $pdo);
      break;
    case "status":
      updateTaskStatus($task, $pdo);
      break;
    case "name":
      updateTaskName($task, $pdo);
      break;
    case "delete":
      deleteTask($task, $pdo);
      break;
    case "LAST_ID":
      getTaskLastId($task, $pdo);
      break;
    case "details":
      getProjectDetails($task, $pdo);
      break;
    case "progress":
      updateProjectProgress($task, $pdo);
      break;
    case "ALL":
      getAllProjectTasks($task, $pdo);
      break;
  }

}

// * functions
function insertTask($task, $pdo)
{
  $sql = "INSERT INTO tasks VALUES (default,:project,:name,:date_added,:date_completed);";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);
  $statement->bindParam(":name", $task->name, PDO::PARAM_STR);
  $statement->bindParam(":date_added", $task->date_added, PDO::PARAM_STR);
  $statement->bindParam(":date_completed", $task->date_completed, PDO::PARAM_STR);
  if ($statement->execute()) {
    // response
    echo json_encode(array("res" => $pdo->lastInsertId()));
  }
}

function getAllProjectTasks($task, $pdo)
{
  $sql = "SELECT * FROM tasks WHERE project_id = :project;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);
  if ($statement->execute()) {
    $response = array();
    while ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
      $task = new stdClass();
      $task->id = $row["id"];
      $task->name = $row["name"];
      $task->date_completed = $row["date_completed"];
      $response[] = $task;
    }
    // response
    echo json_encode($response);
  }
}

function updateTaskStatus($task, $pdo)
{
  $sql = "UPDATE tasks SET date_completed = :date_completed WHERE id = :id AND project_id = :project;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":date_completed", $task->date_completed, PDO::PARAM_STR);
  $statement->bindParam(":id", $task->id, PDO::PARAM_INT);
  $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);
  if ($statement->execute()) {
    // response
    echo json_encode(array("res" => "Success"));
  }
}

function updateTaskName($task, $pdo)
{
  $sql = "UPDATE tasks SET name = :name WHERE id = :id AND project_id = :project;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":name", $task->name, PDO::PARAM_STR);
  $statement->bindParam(":id", $task->id, PDO::PARAM_INT);
  $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);
  if ($statement->execute()) {
    // response
    echo json_encode(array("res" => "Success"));
  }
  return;
}

function deleteTask($task, $pdo)
{
  $sql = "DELETE FROM tasks WHERE id = :id AND project_id = :project;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":id", $task->id, PDO::PARAM_INT);
  $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);
  if ($statement->execute()) {
    // response
    echo json_encode(array("res" => "Success"));
  }
}

function getTaskLastId($task, $pdo)
{
  $sql = "SELECT MAX(id) + 1 as last_id FROM tasks WHERE project_id = :project;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);
  $statement->execute();
  if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode(array("res" => $row["last_id"]));
  }
}

function updateProjectProgress($task, $pdo)
{
  $sql = "UPDATE projects SET progress = 
              (SELECT (100 / (COUNT(*)) * (SELECT COUNT(*) FROM `tasks` 
                WHERE project_id = :project AND date_completed IS NOT NULL)) as 'percent' 
              FROM `tasks` WHERE project_id = :project) 
            WHERE id = :project;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);

  if ($statement->execute()) {
    $sql = "SELECT progress FROM projects WHERE id = :project";
    $statement = $pdo->prepare($sql);
    $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);
    $statement->execute();
    $response = array();
    if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
      $project = new stdClass();
      $project->progress = $row["progress"];
      $project->id = $task->project_id;
      $response[] = $project;
    }
    echo json_encode($response);
  }
}

function getProjectDetails($task, $pdo)
{
  $sql = "SELECT * FROM projects WHERE id = :project;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);
  if ($statement->execute()) {
    $response = array();
    if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
      $project = new stdClass();
      $project->title = $row["title"];
      $project->description = $row["description"];
      $project->deadline = $row["deadline"];
      $response[] = $project;
    }
    echo json_encode($response);
  }
}