// TODO : admin dashboard
// TODO : admin user management
// ? a landing page

// * util function
const elem = (id) => document.querySelector(id);
const selAll = (id) => document.querySelectorAll(id);
const prntChld = (parent, id) => parent.querySelector(id);

// * check if user is signed in
if (localStorage.getItem("tm-user-id") === null) {
  location.href = "../sign-in/";
}

const CURRENT_USER_ID = localStorage.getItem("tm-user-id");

// * globals
function createUser(
  action = "",
  table = "",
  lastName = "",
  firstName = "",
  username = "",
  password = ""
) {
  return {
    action: action,
    table: table,
    id: CURRENT_USER_ID, // * get the id automatically in the localStorage
    lastName: lastName,
    firstName: firstName,
    username: username,
    password: password,
  };
}

function createProject(
  action = "",
  table = "",
  id = 0,
  user_id = CURRENT_USER_ID,
  title = "",
  desc = "",
  deadline = "",
  priority = "",
  date_added = "",
  date_completed = "",
  getOption = "",
  sortBy = "",
  limit = "",
  ascDesc = ""
) {
  return {
    action: action,
    table: table,
    id: id,
    user_id: user_id,
    title: title,
    desc: desc,
    deadline: deadline,
    priority: priority,
    date_added: date_added,
    date_completed: date_completed,
    getOption: getOption,
    sortBy: sortBy,
    limit: limit,
    ascDesc: ascDesc,
  };
}

function createTask(
  action = "",
  table = "",
  id = 0,
  project_id = 0,
  task_name = "",
  date_added = "",
  date_completed = "",
  user_id = CURRENT_USER_ID
) {
  return {
    action: action,
    table: table,
    id: id,
    project_id,
    task_name: task_name,
    date_added: date_added,
    date_completed: date_completed,
    user_id: user_id,
  };
}

// * global functions

// * sends and receives data to or from the server
function ajax_request(method, url, dbObject) {
  return new Promise(function (resolve, reject) {
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function () {
      if (this.status === 200) {
        resolve(this.responseText);
      } else {
        reject(new Error(`Request failed with status: ${this.status}`));
      }
    };
    xhttp.open(method, url);
    if (method === "GET") {
      xhttp.send();
      return;
    }
    xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhttp.send(dbObject.table + "=" + JSON.stringify(dbObject));
  });
}

// * getting and displaying user fullname
function setUserFullname() {
  ajax_request(
    "POST",
    "../user/users-crud.php",
    createUser("information", "users")
  )
    .then(function (response) {
      elem(".user-fullname>p").textContent = `${JSON.parse(response)[1]} ${
        JSON.parse(response)[0]
      }`;
    })
    .catch((error) => console.error("Error:", error));
}

// * to know if the proj deadline has passed already
function isProjectDeadlineOver(deadline) {
  return new Date() > new Date(deadline);
}

// * text to display if there's no deadlines
function checkDeadlines(deadline) {
  const container = elem(".deadlines-container>div");
  if (deadline.length === 0 && container.childElementCount <= 0) {
    const p = document.createElement("p");
    p.textContent = "No deadlines for today...";
    p.classList.add("nothing");
    container.appendChild(p);
  }
}

// * when a project is clicked
function openTasks() {
  let id = null;
  if (this.dataset.id === undefined) {
    id = this.querySelector("i").dataset.id;
  } else {
    id = this.dataset.id;
  }
  // alert(id);
  // Save data to session storage
  sessionStorage.setItem("projectID", id);
  // then redirect to tasks page
  location.href = "../tasks/";
}

// * updating task status
function updateTaskStatus(task, file) {
  ajax_request("POST", file + "-crud.php", task)
    .then(function (response) {
      console.log(JSON.parse(response).res);
      updateProjectProgress(
        createTask("progress", "tasks", 0, task.project_id),
        file === "dashboard" ? "../tasks/tasks" : "tasks"
      );

      if (file === "dashboard") {
        eventSrc = elem(`input[data-id='${task.id}']`);
        eventSrc.parentElement.parentElement.removeChild(
          eventSrc.parentElement
        );

        checkDeadlines([]);
        loadTaskCompletedCount(createProject("COMPLETED_COUNT", "projects"));

        console.log("checkpoint 3");
      }
    })
    .catch((error) => console.error("Error:", error));
}

// * updating project progress
function updateProjectProgress(taskProject, file) {
  taskProject.action = "progress";

  ajax_request("POST", file + "-crud.php", taskProject)
    .then(function (response) {
      if (file === "../tasks/tasks") {
        const recentProj = elem(
          ".project>i[data-id='" + taskProject.project_id + "']"
        );
        if (recentProj !== null) {
          prntChld(recentProj.parentElement, "div>p:last-of-type").innerHTML =
            JSON.parse(response)[0].progress + "%";
        }
      }

      const project = createProject();
      project.action = "date_completed";
      project.table = "projects";
      project.id = taskProject.project_id;
      project.date_completed =
        JSON.parse(response)[0].progress < 100 ? null : formatDate(new Date());

      updateProjectDateCompleted(project, "../projects/projects");
    })
    .catch((error) => console.error("Error:", error));
}

// * updates the date a project has been completed
function updateProjectDateCompleted(project, file) {
  // project.action = "date_completed";
  // project.table = "projects";
  // project.id = id;
  // project.date_completed = date;
  ajax_request("POST", file + "-crud.php", project)
    .then(function (response) {
      console.log(response);
      console.log(JSON.parse(response).res);
    })
    .catch((error) => console.error("Error:", error));
}

// * formatting date for project's date added and completed
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// * load completed tasks count
function loadTaskCompletedCount(project) {
  // project.action = "COMPLETED_COUNT";
  // project.table = "projects";
  ajax_request("POST", "dashboard-crud.php", project)
    .then(function (response) {
      // ! test
      console.log("completed", response);
      // ! test
      prntChld(elem("div.task-completed"), "p").innerHTML =
        JSON.parse(response)[0].count;
    })
    .catch((error) => console.error("Error:", error));
}

// * checks window size
function checkWindowSize() {
  if (window.innerWidth >= 768 || window.innerWidth >= 1024) {
    console.log("window size is greater than 768px");
    elem("#menu").click();
  } else {
    console.log("window size is less than 768px");
    elem("#close-menu").click();
  }
}

// * opening user information page
elem(".user-icon").onclick = () => (location.href = "../user/");

// * sign out user
elem("#sign-out").onclick = async function () {
  localStorage.removeItem("tm-user-id");
  await ajax_request("POST", "../user/users-crud.php", {
    table: "users",
    action: "signOut",
    id: CURRENT_USER_ID,
  });
};

// * open menu
elem("#menu").onclick = () => (elem("nav").style.display = "flex");

// * close menu
elem("#close-menu").onclick = () => (elem("nav").style.display = "none");

// * global classes
class Project {
  constructor(progress, title, priority, id) {
    // properties
    [
      this.project,
      this.div,
      this.paragPriority,
      this.paragTitle,
      this.paragProgress,
      this.paragProgLabel,
      this.edit,
    ] = [
      document.createElement("section"),
      document.createElement("div"),
      document.createElement("p"),
      document.createElement("p"),
      document.createElement("p"),
      document.createElement("p"),
      document.createElement("i"),
    ];
    // values
    this.edit.dataset.id = id;
    this.edit.dataset.role = "Update";
    this.paragPriority.innerText = priority;
    this.paragTitle.innerText = title;
    this.paragProgLabel.innerText = "Progress";
    this.paragProgress.innerText = progress + "%";
  }
  // styles
  applyStyles(deadlinePassed, editDisp) {
    this.project.classList.add("project");
    this.paragPriority.classList.add("project-priority-level");
    this.paragTitle.classList.add("project-title");
    this.paragProgLabel.classList.add("project-progress-label");
    this.paragProgress.classList.add("project-progress");
    this.edit.classList.add("bx", "bxs-pencil", "edit");
    this.edit.style.display = editDisp;
    if (deadlinePassed) {
      this.paragPriority.classList.add("not-completed-in-time");
      this.paragTitle.classList.add("not-completed-in-time");
      this.paragProgress.classList.add("not-completed-in-time");
    }
  }
  // listeners
  addListeners(listener1, listener2) {
    this.project.onclick = listener1;
    this.edit.onclick = listener2;
  }
  // append to a parent element
  appendToParent() {
    this.div.appendChild(this.paragProgLabel);
    this.div.appendChild(this.paragProgress);
    this.project.appendChild(this.edit);
    this.project.appendChild(this.paragPriority);
    this.project.appendChild(this.paragTitle);
    this.project.appendChild(this.div);
  }
  // getter
  getProject() {
    return this.project;
  }
}

class Task {
  constructor(task_id, name, isChecked, project_id) {
    [this.task, this.checkbox, this.label, this.icon] = [
      document.createElement("section"),
      document.createElement("input"),
      document.createElement("label"),
      document.createElement("i"),
    ];

    this.task.dataset.id = project_id;
    this.icon.dataset.role = "delete";
    this.icon.dataset.id = task_id;
    this.label.htmlFor = "cb" + task_id;
    this.label.innerHTML = name;
    this.checkbox.id = "cb" + task_id;
    this.checkbox.dataset.id = task_id;
    this.checkbox.type = "checkbox";
    this.checkbox.checked = isChecked;
  }

  applyStyles(delDisp) {
    this.task.classList.add("task");
    this.checkbox.classList.add("round-checkbox");
    this.icon.classList.add("bx", "bxs-checkbox-minus", "bx-sm", "delete");
    this.icon.style.display = delDisp;
  }

  addListeners(listener1, listener2) {
    this.checkbox.onchange = listener1;
    this.icon.onclick = listener2;
  }

  appendToParent() {
    this.task.appendChild(this.checkbox);
    this.task.appendChild(this.label);
    this.task.appendChild(this.icon);
  }

  getTask() {
    return this.task;
  }
}

// * a function call that repeats in every page
setUserFullname(createUser("information", "users"));

// * check window size
window.onresize = checkWindowSize;

// * data to be saved in localStorage for sorting and limiting
if (
  localStorage.getItem("ipSortBy") === null ||
  localStorage.getItem("cpSortBy") === null
) {
  localStorage.setItem("ipSortBy", "id");
  localStorage.setItem("cpSortBy", "id");
}

if (
  localStorage.getItem("ipLimit") === null ||
  localStorage.getItem("cpLimit") === null
) {
  localStorage.setItem("ipLimit", "all");
  localStorage.setItem("cpLimit", "all");
}

// ! this is a test
// ajax_request("GET", "../mail/send-gmail.php", null)
//   .then((response) => {
//     console.log(response);
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });
// ! this is a test

// ! this is a test
// ajax_request("GET", "../mail/email_checker.json", null)
//   .then((response) => {
//     let json = JSON.parse(response);
//     json.user.forEach(element => {
//         console.log(element);
//     });
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });
// ! this is a test

// ! this is a test
// const mail = {
//   action: "get_email",
//   table: "mail",
// };
// ajax_request("POST", "../mail/send-gmail.php", mail)
//   .then((response) => {
//     console.log(response);
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });
// ! this is a test

// ! this is a test
// const user = {
//   action: "editJSON",
//   table: "mail",
//   data: {
//     user: [
//       {
//         id: 1,
//         name: "New User",
//         email: "newuser@gmail.com",
//         isEmailSent: true,
//       },
//     ],
//   },
// };
// ajax_request("POST", "../mail/send-gmail.php", user)
//   .then((response) => {
//     console.log(JSON.parse(response).res);
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });
// ! this is a test

// ! test
// // * retrieve emails from the database and send email notification
// const mail = {
//   action: "get_email",
//   table: "mail",
// };
// ajax_request("POST", "../mail/send-gmail.php", mail)
//   .then((response) => {
//     // console.log(response);
//     // let json = JSON.parse(response);
//     // console.log(json);
//     // json.forEach((element) => {
//     //   console.log(element.name);
//     // });
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });
// ! end of test
