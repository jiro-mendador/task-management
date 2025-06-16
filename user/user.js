window.onload = function () {
  // * getting and displaying user information
  getUserInformation();

  // * clicked edit
  elem(".edit-div").onclick = edit;

  function getUserInformation() {
    ajax_request("POST", "users-crud.php", createUser("information", "users"))
      .then(function (response) {
        const loggedUser = JSON.parse(response);
        for (const i in loggedUser) {
          selAll(".contents>section input")[i].value = loggedUser[i];
        }
      })
      .catch((error) => console.error("Error:", error));
  }

  function update() {
    const user = createUser();
    user.action = "update";
    user.table = "users";
    user.lastName = selAll(".contents>section input")[0].value;
    user.firstName = selAll(".contents>section input")[1].value;
    user.username = selAll(".contents>section input")[2].value;
    user.password = selAll(".contents>section input")[3].value;
    user.email = selAll(".contents>section input")[4].value;
    ajax_request("POST", "users-crud.php", user)
      .then(function (response) {
        console.log(JSON.parse(response).res);
        changeStyleProperties(
          true,
          "bxs-save",
          "bxs-pencil",
          "edit",
          elem(".edit")
        );
        setUserFullname();
        alert("Changes Saved!");
      })
      .catch((error) => console.error("Error:", error));
  }

  function edit() {
    if (elem(".edit").dataset.role === "update") {
      if (!hasEmptyFields()) {
        update();
      }
      return;
    }
    changeStyleProperties(
      false,
      "bxs-pencil",
      "bxs-save",
      "update",
      elem(".edit")
    );
  }

  function changeStyleProperties(isReadOnly, icon1, icon2, role, btn) {
    selAll(".contents>section input").forEach((i) => (i.readOnly = isReadOnly));
    btn.classList.replace(icon1, icon2);
    btn.dataset.role = role;
  }

  function hasEmptyFields() {
    let isEmpty = false;
    selAll(".contents>section input").forEach((i) => {
      if (i.value === "") {
        isEmpty = true;
      }
    });
    return isEmpty;
  }
};
