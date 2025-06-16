window.onload = function () {
  // * vars
  let addedTasks = [];
  let completedTasks = [];
  let chart = null;

  // * retrieves the information to be displayed in chart
  getWeeklyTaskActivity();

  // * load the project's tasks with deadlines today
  loadDeadlines();

  // * load 5 project's with near or current date as deadline
  loadProjects();

  // * load completed tasks count
  loadTaskCompletedCount(createProject("COMPLETED_COUNT", "projects"));

  // * clicked view all projects
  elem(".view-all-project").onclick = () => (location.href = "../projects/");

  function loadChart(element) {
    chart = null;
    chart = new Chart(element, {
      type: "bar",
      data: {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [
          {
            label: "Added",
            data: addedTasks /*[1, 2, 3, 4, 5, 6, 7]*/,
            barThickness: 10,
            borderWidth: 1,
            borderRadius: 100,
            backgroundColor: "#543ca6",
          },
          {
            label: "Completed",
            data: completedTasks /*[7, 6, 5, 4, 3, 2, 1]*/,
            barThickness: 10,
            borderWidth: 1,
            borderRadius: 100,
            backgroundColor: "#e2b356",
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  }

  function loadProjects() {
    // project.action = "PROJECTS_LIMIT5";
    // project.table = "projects";
    ajax_request(
      "POST",
      "dashboard-crud.php",
      createProject("PROJECTS_LIMIT5", "projects", createUser().id)
    )
      .then(function (response) {
        const proj = JSON.parse(response);
        for (const i in proj) {
          addProject(
            proj[i].priority,
            proj[i].title,
            proj[i].progress,
            proj[i].deadline,
            proj[i].id
          );
        }
      })
      .catch((error) => console.error("Error:", error));
  }

  function addProject(priority, title, progress, deadline, id) {
    //selects the project container
    const container = elem(".projects-container>div");
    const project = new Project(progress, title, priority, id);
    project.applyStyles(
      isProjectDeadlineOver(deadline) && progress < 100,
      "none"
    );
    project.addListeners(openTasks);
    project.appendToParent();
    //add to parent container
    container.insertBefore(project.getProject(), elem(".view-all-project"));
  }

  function loadDeadlines() {
    // project.action = "DEADLINES";
    // project.table = "projects";
    ajax_request(
      "POST",
      "dashboard-crud.php",
      createProject("DEADLINES", "projects")
    )
      .then(function (response) {
        const deadline = JSON.parse(response);
        for (const i in deadline) {
          addDeadline(
            deadline[i].id,
            deadline[i].project_id,
            deadline[i].task_name
          );
        }
        checkDeadlines(deadline);
      })
      .catch((error) => console.error("Error:", error));
  }

  function addDeadline(task_id, project_id, name) {
    const container = elem(".deadlines-container>div");
    const task = new Task(task_id, name, false, project_id);
    task.applyStyles("none");
    task.addListeners(update);
    task.appendToParent();
    container.appendChild(task.getTask());
  }

  function update() {
    console.log("checkbox data-id :" + this.dataset.id);
    console.log("parent element data-id :" + this.parentElement.dataset.id);

    const task = createTask();
    task.action = "status";
    task.table = "tasks";
    task.id = this.dataset.id;
    task.project_id = this.parentElement.dataset.id;
    task.date_completed = formatDate(new Date());
    updateTaskStatus(task, "dashboard");

    clearCanvas();
    getWeeklyTaskActivity();
  }

  async function getTaskActivity(type, date) {
    const task = createTask();
    task.action = "activity";
    task.table = "tasks";
    task.type = type;
    task.date = date;
    task.user_id = createUser().id;
    const response = await ajax_request("POST", "dashboard-crud.php", task);
    return response;
  }

  async function getWeeklyTaskActivity() {
    const currentDate = formatDate(new Date());
    // * getting all added tasks
    const monAdded = await getTaskActivity(
      "date_added",
      getWeekDates(currentDate)[0]
    );

    const tuesAdded = await getTaskActivity(
      "date_added",
      getWeekDates(currentDate)[1]
    );
    const wedAdded = await getTaskActivity(
      "date_added",
      getWeekDates(currentDate)[2]
    );
    const thuAdded = await getTaskActivity(
      "date_added",
      getWeekDates(currentDate)[3]
    );
    const friAdded = await getTaskActivity(
      "date_added",
      getWeekDates(currentDate)[4]
    );
    const satAdded = await getTaskActivity(
      "date_added",
      getWeekDates(currentDate)[5]
    );
    const sunAdded = await getTaskActivity(
      "date_added",
      getWeekDates(currentDate)[6]
    );

    // * getting all completed tasks
    const monCompleted = await getTaskActivity(
      "date_completed",
      getWeekDates(currentDate)[0]
    );
    const tuesCompleted = await getTaskActivity(
      "date_completed",
      getWeekDates(currentDate)[1]
    );
    const wedCompleted = await getTaskActivity(
      "date_completed",
      getWeekDates(currentDate)[2]
    );
    const thuCompleted = await getTaskActivity(
      "date_completed",
      getWeekDates(currentDate)[3]
    );
    const friCompleted = await getTaskActivity(
      "date_completed",
      getWeekDates(currentDate)[4]
    );
    const satCompleted = await getTaskActivity(
      "date_completed",
      getWeekDates(currentDate)[5]
    );
    const sunCompleted = await getTaskActivity(
      "date_completed",
      getWeekDates(currentDate)[6]
    );

    // * when all the promises are resolved
    const added = Promise.all([
      monAdded,
      tuesAdded,
      wedAdded,
      thuAdded,
      friAdded,
      satAdded,
      sunAdded,
    ]).then((values) => {
      return (addedTasks = values.map((value) => JSON.parse(value)[0].count));
    });

    const completed = Promise.all([
      monCompleted,
      tuesCompleted,
      wedCompleted,
      thuCompleted,
      friCompleted,
      satCompleted,
      sunCompleted,
    ]).then((values) => {
      return (completedTasks = values.map(
        (value) => JSON.parse(value)[0].count
      ));
    });

    // * when the promises all are all resolved
    added
      .then((addedValues) => {
        console.log("1 addedTasks", addedValues);
        return completed;
      })
      .then((completedValues) => {
        console.log("2 completedTasks", completedValues);
        loadChart(elem("#graph"));
      });
  }

  function getWeekDates(currentDate) {
    const currentDateObj = new Date(currentDate);
    const currentDayOfWeek = (currentDateObj.getDay() + 6) % 7;

    // Calculate the start date of the week by subtracting the current day of the week
    const startDate = new Date(currentDateObj);
    startDate.setDate(currentDateObj.getDate() - currentDayOfWeek);

    // Create an array to store all the dates in the week
    const weekDates = [];

    // Loop through the days of the week and push the formatted date strings to the array
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      weekDates.push(currentDate.toISOString().split("T")[0]);
    }

    return weekDates;
  }

  const currentDate = formatDate(new Date());
  const weekDates = getWeekDates(currentDate);
  console.log(weekDates);

  function clearCanvas() {
    if (chart) {
      i = 0;
      j = 0;
      chart.destroy();
      chart = null; // Set chart to null or undefined to indicate it has been destroyed
    }
  }

  // * to solve the chart not resizing when the window is resized
  window.onresize = function () {
    checkWindowSize();
    clearCanvas();
    loadChart(elem("#graph"));
  };

  // // ! test of web worker js
  // // Create a new Web Worker
  // const myWorker = new Worker("../workers/worker1.js");

  // // Handle messages from the Web Worker
  // myWorker.addEventListener("message", function (e) {
  //   console.log("Background result:", e.data);
  // });

  // // Start the background task by sending a message to the Web Worker
  // myWorker.postMessage(10);

  // // Continue with other tasks in the main thread
  // console.log("Main thread continues...");
  // // ! end of test

  let email_worker;
  // let workerRepeat = 1;

  // function stopWorker() {
  //   if (email_worker !== undefined) {
  //     email_worker.terminate();
  //     email_worker = undefined;
  //   }
  // }

  // function startWorker() {
  //   // ! test web worker
  //   if (typeof Worker !== "undefined") {
  //     console.log("Yes! Web worker support!");
  //   } else {
  //     console.log("Sorry! No Web Worker support..");
  //   }

  //   if (typeof email_worker == "undefined") {
  //     email_worker = new Worker("../workers/sending_email_worker.js");
  //   }

  //   if (typeof email_worker === "undefined") {
  //     email_worker.onmessage = function (event) {
  //       console.log("Message received from worker", event.data);
  //       // if (workerRepeat > 10 && event.data === "DONE") {
  //       //   stopWorker();
  //       // } else {
  //       //   workerRepeat++;
  //       // }
  //     };
  //   }
  //   // ! end of test web worker
  // }
  // startWorker();
};

// ! test
let worker_response = "";
if (typeof email_worker == "undefined") {
  console.log("Worker started");
  email_worker = new Worker("../workers/send_email_worker.js");
}
email_worker.onmessage = function (event) {
  // Check if the message is not from the worker itself
  if (event.origin !== self.origin) {
    console.log("Message received from worker", event.data);
    worker_response = event.data;
    if (worker_response === "SUCCESS") {
      console.log("Worker terminated");
      email_worker.terminate();
      email_worker = undefined;
    }
  }
};
// ! test

// ! MAIN PROBLEM IDENTIFIED : LIVE SERVER AUTO RELOAD THE PAGE
// ! WHEN WRITING TO JSON BC OF FILE MODIFICATION

// TODO : task activity retrieval based on week
// TODO : filter task activity and task completed per week and day
