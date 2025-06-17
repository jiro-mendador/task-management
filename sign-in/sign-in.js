window.onload = () => {
  // * util function
  const elem = (id) => document.querySelector(id);
  const selAll = (id) => document.querySelectorAll(id);

  // * check if user is signed in
  if (localStorage.getItem("tm-user-id") !== null) {
    location.href = "../index/index.html";
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

  const signUpBtn = elem("#sign-up-btn");
  signUpBtn.onclick = () => (location.href = "../sign-up/index.html");

  const signInBtn = elem(".sign-in-btn");
  signInBtn.addEventListener("click", signIn);

  const showPasswordBtn = elem("#showPassword");
  showPasswordBtn.onclick = showPassword;

  async function signIn() {
    if (hasEmptyFields()) {
      alert("Please fill all fields");
      return;
    }

    const user = {
      table: "users",
      action: "signIn",
      email: selAll(".inputs input")[0].value,
      password: selAll(".inputs input")[1].value,
    };
    console.log(user);

    const response = await ajax_request("POST", "../user/users-crud.php", user);
    console.log("RAW RES: ", response);
    const res = JSON.parse(response);
    console.log(res.res);

    if (res.res === "Success") {
      localStorage.setItem("tm-user-id", res.id);
      location.href = "../index/index.html";
      return;
    }

    alert("Incorrect email or password");
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

  function showPassword() {
    const password = selAll(".inputs input")[1];
    if (password.type === "password") {
      password.type = "text";
      return;
    }
    password.type = "password";
  }
};
