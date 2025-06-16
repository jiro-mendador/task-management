window.onload = () => {
  // * util function
  const elem = (id) => document.querySelector(id);
  const selAll = (id) => document.querySelectorAll(id);

  // * check if user is signed in
  if (localStorage.getItem("tm-user-id") !== null) {
    location.href = "../index/";
  }

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
      xhttp.setRequestHeader(
        "Content-Type",
        "application/x-www-form-urlencoded"
      );
      xhttp.send(dbObject.table + "=" + JSON.stringify(dbObject));
    });
  }

  function hasEmptyFields() {
    let isEmpty = false;
    selAll(".inputs input:not([type='checkbox'])").forEach((i) => {
      if (i.value === "") {
        isEmpty = true;
      }
    });
    return isEmpty;
  }

  function setFieldsToEmpty() {
    selAll(".inputs input:not([type='checkbox'])").forEach((i) => {
      i.value = "";
    });
  }

  const signInBtn = elem("#sign-in-btn");
  signInBtn.onclick = () => (location.href = "../sign-in/");

  const signUpBtn = elem(".sign-up-btn");
  signUpBtn.addEventListener("click", signUp);

  const showPasswordBtn = elem("#showPassword");
  showPasswordBtn.onclick = showPassword;

  async function signUp() {
    if (hasEmptyFields()) {
      alert("Please fill all fields");
      return;
    }

    const user = {
      table: "users",
      action: "create",
      id: 0,
      lastName: selAll(".inputs input")[0].value,
      firstName: selAll(".inputs input")[1].value,
      username: selAll(".inputs input")[2].value,
      email: selAll(".inputs input")[3].value,
      password: selAll(".inputs input")[4].value,
    };
    console.log(user);

    const response = await ajax_request("POST", "../user/users-crud.php", user);
    const res = JSON.parse(response).res;
    console.log(res);

    if (res === "Username") {
      alert("This username is not available");
      return;
    }

    if (res === "Email") {
      alert("This email is not available");
      return;
    }

    if (res === "Success") {
      alert("Account created successfully");
      setFieldsToEmpty();
      return;
    }

    alert("Account creation failed");
  }

  function showPassword() {
    const password = selAll(".inputs input")[4];
    if (password.type === "password") {
      password.type = "text";
      return;
    }
    password.type = "password";
  }
};
