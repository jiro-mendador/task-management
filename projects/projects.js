//run time
window.onload = function () {
  // retrieve updated projects from db
  getProjects("in-progress");
  getProjects("completed");

  // del button
  const del = elem("section.wrapper .delete");

  // setting the value of select elem
  elem("#sortInProgress").value = localStorage.getItem("ipSortBy");
  elem("#sortCompleted").value = localStorage.getItem("cpSortBy");
  elem("#limitInProgress").value = localStorage.getItem("ipLimit");
  elem("#limitCompleted").value = localStorage.getItem("cpLimit");

  // open project inputs
  elem(".add-project").onclick = openInputs;
  // close
  elem(".close").onclick = closeInputs;

  // sort
  elem("#sortInProgress").onchange = setOrder;
  elem("#sortCompleted").onchange = setOrder;

  // limit
  elem("#limitInProgress").onchange = setLimit;
  elem("#limitCompleted").onchange = setLimit;

  // sort asc or desc
  elem(".ipAscDesc").onclick = toggleAscDesc;

  // sort asc or desc
  elem(".cpAscDesc").onclick = toggleAscDesc;

  // delete project
  del.onclick = remove;

  // add or update
  elem(".add").onclick = function () {
    // destructuring array
    const [title, desc, date, time] = document.querySelectorAll(".input input");
    const priority = document.querySelector(".input select");
    // checking for empty inputs
    if (
      title.value === "" ||
      desc.value === "" ||
      date.value === "" ||
      time.value === ""
    ) {
      return;
    }

    //update
    if (this.innerHTML === "Update") {
      update(title, desc, date, time, priority);
      alert("Updated!");
      return;
    }

    //insert to db req
    insert(title, desc, date, time, priority);
  };

  function addProject(priority, title, progress, deadline, id) {
    let projectLists = null;
    if (progress < 100) {
      projectLists = elem(".projects-in-progress > section");
    } else {
      projectLists = elem(".projects-completed > section");
    }
    const project = new Project(progress, title, priority, id);
    project.applyStyles(
      isProjectDeadlineOver(deadline) && progress < 100,
      "block"
    );
    project.addListeners(openTasks, openInputs);
    project.appendToParent();
    projectLists.appendChild(project.getProject());
  }

  function insert(title, desc, date, time, priority) {
    const project = createProject();
    project.action = "insert";
    project.table = "projects";
    project.title = title.value;
    project.desc = desc.value;
    project.deadline = date.value + " " + time.value;
    project.priority = priority.value;
    project.progress = 0;
    project.date_added = formatDate(new Date());
    ajax_request("POST", "projects-crud.php", project)
      .then(function (response) {
        console.log(JSON.parse(response).res);
        filter(elem(".projects-in-progress > section"), "in-progress");
        [title, desc, date, time, priority].forEach((i) => (i.value = ""));
        alert("New Project Added!");
      })
      .catch((error) => console.error("Error:", error));
  }

  function update(title, desc, date, time, priority) {
    const project = createProject();
    project.action = "update";
    project.table = "projects";
    project.title = title.value;
    project.desc = desc.value;
    project.deadline = date.value + " " + time.value;
    project.priority = priority.value;
    project.id = sessionStorage.getItem("editingProjectId");
    ajax_request("POST", "projects-crud.php", project)
      .then(function (response) {
        console.log(JSON.parse(response).res);
        const projContainer = elem(
          "i[data-id='" + project.id + "']"
        ).parentElement;
        filter(
          projContainer.parentElement,
          projContainer.parentElement.parentElement.classList.value.replace(
            "projects-",
            ""
          )
        );
        sessionStorage.removeItem("editingProjectId");
      })
      .catch((error) => console.error("Error:", error));
  }

  function remove() {
    let removed = confirm(
      "Are you sure you want to delete this entire project?"
    );
    if (removed) {
      const project = createProject();
      project.action = "delete";
      project.table = "projects";
      project.id = sessionStorage.getItem("editingProjectId");
      ajax_request("POST", "projects-crud.php", project)
        .then(function (response) {
          console.log(JSON.parse(response).res);
          if (sessionStorage.getItem("projectID") === project.id) {
            sessionStorage.removeItem("projectID");
          }
          const projContainer = elem(
            "i[data-id='" + project.id + "']"
          ).parentElement;
          projContainer.parentElement.removeChild(projContainer);
          closeInputs();
        })
        .catch((error) => console.error("Error:", error));
    }
  }

  function getProjects(getOption) {
    let opt = getOption === "in-progress" ? "ip" : "cp";
    const project = createProject();
    project.action = "ALL";
    project.table = "projects";
    project.sortBy = localStorage.getItem(opt + "SortBy");
    project.limit = localStorage.getItem(opt + "Limit");
    project.ascDesc = elem("." + opt + "AscDesc").dataset.id;
    project.getOption = getOption;
    ajax_request("POST", "projects-crud.php", project)
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

  function getIndivProjectInfo(project) {
    ajax_request("POST", "projects-crud.php", project)
      .then(function (response) {
        const proj = JSON.parse(response);
        // destructuring array
        const [title, desc, date, time] = selAll(".input input");
        const priority = elem(".input select");
        title.value = proj[0].title;
        desc.value = proj[0].description;
        date.value = proj[0].deadline.split(" ")[0];
        time.value = proj[0].deadline.split(" ")[1];
        priority.value = proj[0].priority;
      })
      .catch((error) => console.error("Error:", error));
  }

  function openInputs(event) {
    console.log(this.dataset.id);
    event.stopPropagation();
    document.body.style.overflow = "hidden";
    elem(".wrapper").style.display = "flex";
    elem(".wrapper .add").innerHTML = this.dataset.role;
    if (this.dataset.role === "Update") {
      elem(".wrapper>p").innerHTML = "Update Project";
      getIndivProjectInfo(
        createProject("details", "projects", this.dataset.id)
      );
      sessionStorage.setItem("editingProjectId", this.dataset.id);
      del.style.display = "block";
      return;
    }
    elem(".wrapper>p").innerHTML = "Add New Project";
    del.style.display = "none";
  }

  function closeInputs() {
    document.body.style.overflow = "auto";
    elem(".wrapper").style.display = "none";
    selAll(".input input").forEach((i) => (i.value = ""));
    selAll(".input select").value = "";
  }

  function filter(container, type) {
    // clear the container
    clearProjectsContainer(container, type);
    // retrieve the projects based on filter
    getProjects(type);
  }

  function setOrder() {
    console.log("id " + this.dataset.id + " role " + this.dataset.role);
    localStorage.setItem(this.dataset.id + "SortBy", this.value);
    filter(
      elem(".projects-" + this.dataset.role + " > section"),
      this.dataset.role
    );
  }

  function setLimit() {
    console.log("id " + this.dataset.id + " role " + this.dataset.role);
    localStorage.setItem(this.dataset.id + "Limit", this.value);
    filter(
      elem(".projects-" + this.dataset.role + " > section"),
      this.dataset.role
    );
  }

  function toggleAscDesc() {
    if (this.dataset.id === "ASC") {
      this.classList.replace("bxs-up-arrow", "bxs-down-arrow");
      this.dataset.id = "DESC";
    } else {
      this.classList.replace("bxs-down-arrow", "bxs-up-arrow");
      this.dataset.id = "ASC";
    }
    filter(
      elem(".projects-" + this.dataset.role + " > section"),
      this.dataset.role
    );
  }

  function clearProjectsContainer(container, type) {
    if (type === "in-progress") {
      while (container.children[1]) {
        container.removeChild(container.children[1]);
      }
    } else {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }
  }
};
