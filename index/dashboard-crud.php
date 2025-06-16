<?php
include_once("../config.php");
header("Content-Type:application/json; charset=UTF-8");

if (isset($_POST["projects"])) {
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

function getDeadlinesToday($object, $pdo)
{
  $sql = "SELECT t.id, t.project_id, t.name 
          FROM projects p 
          JOIN tasks t ON p.id = t.project_id 
          WHERE p.deadline::date = CURRENT_DATE 
            AND t.date_completed IS NULL 
            AND p.user_id = :user 
          ORDER BY 
            CASE p.priority_level
              WHEN 'High' THEN 1
              WHEN 'Medium' THEN 2
              WHEN 'Low' THEN 3
            END, 
            p.deadline";
  $stmt = $pdo->prepare($sql);
  $stmt->bindParam(":user", $object->user_id, PDO::PARAM_INT);
  $stmt->execute();

  $response = [];
  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $item = new stdClass();
    $item->id = $row["id"];
    $item->project_id = $row["project_id"];
    $item->task_name = $row["name"];
    $response[] = $item;
  }

  echo json_encode($response);
}

function getRecentProjects($object, $pdo, $limit)
{
  $sql = "SELECT * FROM projects 
          WHERE user_id = :user 
          ORDER BY id DESC 
          LIMIT :limit";
  $stmt = $pdo->prepare($sql);
  $stmt->bindParam(":user", $object->user_id, PDO::PARAM_INT);
  $stmt->bindValue(":limit", $limit, PDO::PARAM_INT); // must use bindValue here
  $stmt->execute();

  $response = [];
  while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $item = new stdClass();
    $item->id = $row["id"];
    $item->title = $row["title"];
    $item->priority = $row["priority_level"];
    $item->progress = $row["progress"];
    $item->deadline = $row["deadline"];
    $response[] = $item;
  }

  echo json_encode($response);
}

function getTaskCompletedCount($object, $pdo)
{
  $sql = "SELECT COUNT(*) AS completed_count 
          FROM users 
          JOIN projects ON users.id = projects.user_id 
          JOIN tasks ON projects.id = tasks.project_id 
          WHERE users.id = :user 
            AND tasks.date_completed IS NOT NULL";
  $stmt = $pdo->prepare($sql);
  $stmt->bindParam(":user", $object->user_id, PDO::PARAM_INT);
  $stmt->execute();

  $response = [];
  if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $item = new stdClass();
    $item->count = $row["completed_count"];
    $response[] = $item;
  }

  echo json_encode($response);
}

function updateProjectProgress($object, $pdo)
{
  // Split into multiple statements for compatibility
  $sql = "SELECT COUNT(*) FROM tasks WHERE project_id = :project";
  $stmt = $pdo->prepare($sql);
  $stmt->bindParam(":project", $object->id, PDO::PARAM_INT);
  $stmt->execute();
  $total = (int) $stmt->fetchColumn();

  $sql = "SELECT COUNT(*) FROM tasks WHERE project_id = :project AND date_completed IS NOT NULL";
  $stmt = $pdo->prepare($sql);
  $stmt->bindParam(":project", $object->id, PDO::PARAM_INT);
  $stmt->execute();
  $completed = (int) $stmt->fetchColumn();

  $percent = $total > 0 ? round(($completed / $total) * 100) : 0;

  $sql = "UPDATE projects SET progress = :progress WHERE id = :project AND user_id = :user";
  $stmt = $pdo->prepare($sql);
  $stmt->bindParam(":progress", $percent, PDO::PARAM_INT);
  $stmt->bindParam(":project", $object->id, PDO::PARAM_INT);
  $stmt->bindParam(":user", $object->user_id, PDO::PARAM_INT);
  $stmt->execute();

  echo json_encode([["progress" => $percent]]);
}

function updateTaskStatus($object, $pdo)
{
  $sql = "UPDATE tasks 
          SET date_completed = :date_completed 
          WHERE id = :id AND project_id = :project";
  $stmt = $pdo->prepare($sql);
  $stmt->bindParam(":id", $object->id, PDO::PARAM_INT);
  $stmt->bindParam(":project", $object->project_id, PDO::PARAM_INT);
  $stmt->bindParam(":date_completed", $object->date_completed, PDO::PARAM_STR);
  if ($stmt->execute()) {
    echo json_encode(["res" => "Success"]);
  }
}

function getTaskActivity($object, $pdo)
{
  if ($object->type === "date_added") {
    $sql = "SELECT COUNT(t.date_added) AS count 
            FROM tasks t 
            JOIN projects p ON p.id = t.project_id 
            JOIN users u ON p.user_id = u.id 
            WHERE DATE(t.date_added) = :date AND u.id = :user";
  } else {
    $sql = "SELECT COUNT(t.date_completed) AS count 
            FROM users u 
            JOIN projects p ON u.id = p.user_id 
            JOIN tasks t ON p.id = t.project_id 
            WHERE u.id = :user 
              AND DATE(t.date_completed) = :date 
              AND t.date_completed IS NOT NULL";
  }

  $stmt = $pdo->prepare($sql);
  $stmt->bindParam(":user", $object->user_id, PDO::PARAM_INT);
  $stmt->bindParam(":date", $object->date, PDO::PARAM_STR);
  $stmt->execute();

  if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo json_encode([["count" => $row["count"]]]);
  } else {
    echo json_encode(["count" => 0]);
  }
}