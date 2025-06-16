<?php
include_once("../config.php");
header("Content-Type:application/json; charset=UTF-8");

if (isset($_POST["tasks"])) {

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

function insertTask($task, $pdo)
{
  $sql = "INSERT INTO tasks (project_id, name, date_added, date_completed) 
          VALUES (:project, :name, :date_added, :date_completed) RETURNING id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);
  $statement->bindParam(":name", $task->name, PDO::PARAM_STR);
  $statement->bindParam(":date_added", $task->date_added, PDO::PARAM_STR);
  $statement->bindParam(":date_completed", $task->date_completed, PDO::PARAM_STR);
  if ($statement->execute()) {
    $res = $statement->fetch(PDO::FETCH_ASSOC);
    echo json_encode(array("res" => $res["id"]));
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
      $taskObj = new stdClass();
      $taskObj->id = $row["id"];
      $taskObj->name = $row["name"];
      $taskObj->date_completed = $row["date_completed"];
      $response[] = $taskObj;
    }
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
    echo json_encode(array("res" => "Success"));
  }
}

function deleteTask($task, $pdo)
{
  $sql = "DELETE FROM tasks WHERE id = :id AND project_id = :project;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":id", $task->id, PDO::PARAM_INT);
  $statement->bindParam(":project", $task->project_id, PDO::PARAM_INT);
  if ($statement->execute()) {
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
  $sql = "
    UPDATE projects SET progress = (
      SELECT COALESCE(ROUND(100.0 * completed.count / total.count), 0)
      FROM (
        SELECT COUNT(*) as count FROM tasks WHERE project_id = :project
      ) total,
      (
        SELECT COUNT(*) as count FROM tasks WHERE project_id = :project AND date_completed IS NOT NULL
      ) completed
    )
    WHERE id = :project;
  ";
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