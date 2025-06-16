window.onload = function () {
  // * global vars for db update later
  let tasksIdHolder = []; // * for deletion
  let tasks = []; // * for cancellation, holds orig tasks details
  // * flag to know if user is editing
  let isEditing = false;

  let id = 1;

  // * setting project details
  setProjectDetails();

  // * retrieve all the tasks available when the page loaded
  getAllTasks();

  // * clicked + button open inputs
  elem(".add-new").onclick = openInputs;
  // * clicked -> button closed inputs
  elem(".close").onclick = closeInputs;

  // * clicked delete indiv task button
  selAll("i.delete").forEach((elem) => (elem.onclick = deleteIndividualTask));
  // * clicked delete all buttons
  selAll("i.deleteAll").forEach((element) => {
    element.onclick = function () {
      let taskId = 0;
      let container = this.parentElement.nextElementSibling;
      for (
        let i = 0;
        i < this.parentElement.nextElementSibling.childElementCount;
        i++
      ) {
        //gets the data-id of every icon inside a task
        taskId = prntChld(container.children[i], "i").dataset.id;
        // hiding it temporarily
        container.children[i].style.display = "none";
        // checks if the same task is already in the taskIDLists
        if (!tasksIdHolder.includes(taskId)) tasksIdHolder.push(taskId);
      }
    };
  });

  // * clicked edit button
  elem(".edit").onclick = function () {
    // edit here
    if (this.dataset.role === "edit") {
      isEditing = true;
      toggleEditInputs();
      toggleDeleteButtons("block");
      changeIconsAttr(this, "bxs-pencil", "bxs-save", "update");
      changeIconsAttr(elem(".add-new"), "bx-plus", "bx-x-circle", "cancel");
      return;
    }

    // update here
    let saved = confirm(
      "All changes cannot be undone, are you sure you want to proceed?"
    );
    if (saved) {
      saveUpdate();
      isEditing = false;
      toggleEditInputs();
      toggleDeleteButtons("none");
      changeIconsAttr(this, "bxs-save", "bxs-pencil", "edit");
      changeIconsAttr(elem(".add-new"), "bx-x-circle", "bx-plus", "add");
    }
  };

  function addNewTask(input, taskId, container) {
    let parent = elem("." + container + ">div:nth-child(2)");
    const task = new Task(taskId, input, container === "completed", 0);
    task.applyStyles("none");
    task.addListeners(taskCompleted, deleteIndividualTask);
    task.appendToParent();
    parent.appendChild(task.getTask());
  }

  function insert(input) {
    const task = createTask();
    task.action = "insert";
    task.name = input.value;
    task.table = "tasks";
    task.date_added = formatDate(new Date());
    task.date_completed = null;
    task.project_id = sessionStorage.getItem("projectID");
    ajax_request("POST", "tasks-crud.php", task)
      .then(function (response) {
        console.log(JSON.parse(response).res);
        id = JSON.parse(response).res;
        addNewTask(input.value, id, "to-do"); //add to dom
        updateProjectProgress(task, "tasks");
        input.value = "";
        alert("New Task Added!");
      })
      .catch((error) => console.error("Error:", error));
  }

  function getAllTasks() {
    ajax_request(
      "POST",
      "tasks-crud.php",
      createTask("ALL", "tasks", 0, sessionStorage.getItem("projectID"))
    )
      .then(function (response) {
        const taskINFO = JSON.parse(response);
        for (const i in taskINFO) {
          addNewTask(
            taskINFO[i].name,
            taskINFO[i].id,
            taskINFO[i].date_completed != null ? "completed" : "to-do"
          );
        }
      })
      .catch((error) => console.error("Error:", error));
  }

  function updateTaskName(id, name) {
    const task = createTask();
    task.action = "name";
    task.table = "tasks";
    task.id = id;
    task.name = name;
    task.project_id = sessionStorage.getItem("projectID");
    ajax_request("POST", "tasks-crud.php", task)
      .then(function (response) {
        console.log(JSON.parse(response).res);
      })
      .catch((error) => console.error("Error:", error));
  }

  function deleteOnDB(id) {
    const task = createTask();
    task.action = "delete";
    task.table = "tasks";
    task.id = id;
    task.project_id = sessionStorage.getItem("projectID");
    ajax_request("POST", "tasks-crud.php", task)
      .then(function (response) {
        console.log(JSON.parse(response).res);
      })
      .catch((error) => console.error("Error:", error));
  }

  function saveUpdate() {
    // delete in db when there is something to delete
    if (tasksIdHolder.length > 0) {
      for (let i = 0; i < tasksIdHolder.length; i++) {
        deleteOnDB(tasksIdHolder[i]);
      }
    }
    // then update what's left
    const inputs = selAll("section>div>section.task input");
    for (let i = 0; i < inputs.length; i++) {
      updateTaskName(
        inputs[i].nextElementSibling.nextElementSibling.dataset.id,
        inputs[i].value
      );
    }
    updateProjectProgress(
      createTask("progress", "tasks", 0, sessionStorage.getItem("projectID")),
      "tasks"
    );
    alert("Changes Saved!");
  }

  function changeIconsAttr(source, class1, class2, role) {
    source.classList.replace(class1, class2);
    source.dataset.role = role;
  }

  function toggleDeleteButtons(display) {
    selAll("i[data-role='delete']").forEach((i) => (i.style.display = display));
  }

  function toggleEditInputs() {
    tasks.length = 0;
    tasksIdHolder.length = 0;
    const labels = selAll("section>div>section.task label");
    const inputs = selAll("section>div>section.task input");
    if (isEditing) {
      //settin the label to be the value of input
      labelsToInputs(inputs, labels, "text", "none");
      return;
    }
    //setting the value of input to labels
    labelsToInputs(inputs, labels, "checkbox", "block");
  }

  function labelsToInputs(inputs, labels, type, display) {
    for (let i = 0; i < inputs.length; i++) {
      tasks.push(labels[i].innerHTML);
      inputs[i].type = type;
      labels[i].style.display = display;
      if (isEditing) {
        inputs[i].value = labels[i].innerHTML;
        continue;
      }
      labels[i].innerHTML = inputs[i].value;
    }
  }

  function openInputs() {
    if (this.dataset.role === "cancel") {
      cancel();
      toggleDeleteButtons("none");
      changeIconsAttr(elem(".edit"), "bxs-save", "bxs-pencil", "edit");
      changeIconsAttr(elem(".add-new"), "bx-x-circle", "bx-plus", "add");
      return;
    }
    // open input panel
    document.body.style.overflow = "hidden";
    elem(".wrapper").style.display = "flex";
    //clicked add new tasks
    elem(".add").onclick = function () {
      const input = elem(".input input");
      if (input.value !== "") {
        insert(input); //insert to db
      }
    };
  }

  function closeInputs() {
    document.body.style.overflow = "auto";
    elem(".wrapper").style.display = "none";
  }

  function cancel() {
    for (const i in tasksIdHolder) {
      elem(
        ".task>i[data-id='" + tasksIdHolder[i] + "']"
      ).parentElement.style.display = "flex";
    }
    const labels = selAll("section>div>section.task label");
    const inputs = selAll("section>div>section.task input");
    for (let i = 0; i < tasks.length; i++) {
      inputs[i].type = "checkbox";
      labels[i].style.display = "block";
      labels[i].innerHTML = tasks[i];
    }
    isEditing = false;
  }

  // * hiding it temporarily
  function deleteIndividualTask() {
    elem(
      ".task>i[data-id='" + this.dataset.id + "']"
    ).parentElement.style.display = "none";
    tasksIdHolder.push(this.dataset.id);
  }

  function taskCompleted() {
    if (isEditing) {
      return;
    }
    const toDo = elem(".to-do>div:nth-child(2)");
    const completed = elem(".completed>div:nth-child(2)");
    const clickedTask = elem(
      ".project-tasks>section input[id='" + this.id + "']"
    ).parentElement;

    const task = createTask();
    task.action = "status";
    task.table = "tasks";
    task.id = this.id.replace("cb", "");
    task.project_id = sessionStorage.getItem("projectID");
    task.date_completed = this.checked ? formatDate(new Date()) : null;
    updateTaskStatus(task, "tasks");

    if (this.checked) {
      completed.appendChild(clickedTask);
      return;
    }
    toDo.appendChild(clickedTask);
  }

  function setProjectDetails() {
    if (sessionStorage.getItem("projectID") === null) {
      location.href = "../projects/";
      return;
    }
    
    ajax_request(
      "POST",
      "tasks-crud.php",
      createTask("details", "tasks", 0, sessionStorage.getItem("projectID"))
    )
      .then(function (response) {
        console.log(response);
        const taskINFO = JSON.parse(response);
        elem(".project-title").innerHTML = taskINFO[0].title;
        elem(".project-description").innerHTML = taskINFO[0].description;
        elem("#deadline-date").value = taskINFO[0].deadline;
        if (isProjectDeadlineOver(taskINFO[0].deadline)) {
          elem(".project-deadline").innerHTML = "Deadline already passed on ";
          elem(".project-deadline").style.color = "#a83732";
          elem("#deadline-date").style.color = "#a83732";
        }
      })
      .catch((error) => console.error("Error:", error));
  }
};
