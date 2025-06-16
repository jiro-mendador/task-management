<?php
include_once("../config.php");
header("Content-Type:application/json; charset=UTF-8");

// * conditions
if (isset($_POST["projects"])) {

  // * json obj
  $project = json_decode($_POST["projects"]);

  switch ($project->action) {
    case "insert":
      insertProject($project, $pdo);
      break;
    case "update":
      updateProject($project, $pdo);
      break;
    case "date_completed":
      updateProjectDateCompleted($project, $pdo);
      break;
    case "delete":
      deleteProject($project, $pdo);
      break;
    case "details":
      getProjectDetails($project, $pdo);
      break;
    case "ALL":
      getAllProjects($project, $pdo);
      break;
  }

}

// * functions
function insertProject($project, $pdo)
{
  $sql = "INSERT INTO projects VALUES (default,:user,:title,:descrip,:deadline,:prio,:progress, :added, default);";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":user", $project->user_id, PDO::PARAM_STR);
  $statement->bindParam(":title", $project->title, PDO::PARAM_STR);
  $statement->bindParam(":descrip", $project->desc, PDO::PARAM_STR);
  $statement->bindParam(":deadline", $project->deadline, PDO::PARAM_STR);
  $statement->bindParam(":prio", $project->priority, PDO::PARAM_STR);
  $statement->bindParam(":progress", $project->progress, PDO::PARAM_INT);
  $statement->bindParam(":added", $project->date_added, PDO::PARAM_STR);
  // response
  if ($statement->execute()) {
    echo json_encode(array("res" => $pdo->lastInsertId()));
  }
}

function updateProject($project, $pdo)
{
  $sql = "UPDATE projects SET title = :title, description = :descrip, deadline = :deadline, priority_level = :prio WHERE id = :id AND user_id = :user;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":title", $project->title, PDO::PARAM_STR);
  $statement->bindParam(":descrip", $project->desc, PDO::PARAM_STR);
  $statement->bindParam(":deadline", $project->deadline, PDO::PARAM_STR);
  $statement->bindParam(":prio", $project->priority, PDO::PARAM_STR);
  $statement->bindParam(":id", $project->id, PDO::PARAM_INT);
  $statement->bindParam(":user", $project->user_id, PDO::PARAM_INT);
  // response
  if ($statement->execute()) {
    echo json_encode(array("res" => "Success"));
  }
}

function updateProjectDateCompleted($project, $pdo)
{
  $sql = "UPDATE projects SET date_completed = :completed WHERE id = :id";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":completed", $project->date_completed, PDO::PARAM_STR);
  $statement->bindParam(":id", $project->id, PDO::PARAM_INT);
  // response
  if ($statement->execute()) {
    echo json_encode(array("res" => "Success"));
  }
}

function deleteProject($project, $pdo)
{
  $sql = "DELETE FROM projects WHERE id = :id AND user_id = :user;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":id", $project->id, PDO::PARAM_INT);
  $statement->bindParam(":user", $project->user_id, PDO::PARAM_INT);
  $statement->execute();

  $sql = "DELETE FROM tasks WHERE project_id = :id;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":id", $project->id, PDO::PARAM_INT);
  $statement->execute();

  // response
  echo json_encode(array("res" => "Success"));
}

function getProjectDetails($project, $pdo)
{
  $sql = "SELECT * FROM projects WHERE id = :id AND user_id = :user;";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":id", $project->id, PDO::PARAM_INT);
  $statement->bindParam(":user", $project->user_id, PDO::PARAM_INT);
  $statement->execute();
  $response = array();
  if ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
    $project = new stdClass();
    $project->id = $row["id"];
    $project->title = $row["title"];
    $project->description = $row["description"];
    $project->deadline = $row["deadline"];
    $project->priority = $row["priority_level"];
    $project->progress = $row["progress"];
    $response[] = $project;
  }
  echo json_encode($response);
}

function getAllProjects($project, $pdo)
{
  $sql = "SELECT * FROM projects WHERE user_id = :user";

  if ($project->getOption === "in-progress") {
    $sql .= " AND progress < 100";
  } elseif ($project->getOption === "completed") {
    $sql .= " AND progress >= 100";
  }

  if ($project->sortBy !== "priority_level") {
    $sql .= " ORDER BY " . $project->sortBy . " " . $project->ascDesc;
  } else {
    $sql .= " ORDER BY CASE " . $project->sortBy . " WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END " . $project->ascDesc . " , deadline " . $project->ascDesc;
  }

  if ($project->limit !== "all") {
    $sql .= " LIMIT " . $project->limit;
  }

  $sql .= ";";
  $statement = $pdo->prepare($sql);
  $statement->bindParam(":user", $project->user_id, PDO::PARAM_INT);
  $statement->execute();
  $response = array();
  while ($row = $statement->fetch(PDO::FETCH_ASSOC)) {
    $project = new stdClass();
    $project->id = $row["id"];
    $project->title = $row["title"];
    $project->priority = $row["priority_level"];
    $project->progress = $row["progress"];
    $project->deadline = $row["deadline"];
    $response[] = $project;
  }
  echo json_encode($response);
}