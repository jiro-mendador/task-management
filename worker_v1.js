// let i = 0;

// function timedCount() {
//   i++;
//   postMessage(i);
//   setTimeout("timedCount()", 1000);
// }

// self.addEventListener("message", function (e) {
//   // Perform background tasks
//   let result = e.data * e.data;

//   // Send the result back to the main thread
//   self.postMessage(result);
// });

// timedCount();

// ! test
function ajax_request(method, url, dbObject) {
  return new Promise(function (resolve, reject) {
    const xhttp = new XMLHttpRequest();
    xhttp.onload = function () {
      if (this.status === 200) {
        resolve(this.responseText);
      } else {
        timedCount("ERROR");
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

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function checkEmail() {
  const response = await ajax_request(
    "GET",
    "../mail/email_checker.json",
    null
  );
  return response ? JSON.parse(response) : null;
}

async function updateJSON(user) {
  // * write to a json file
  const response = await ajax_request("POST", "../mail/send-gmail.php", user);
  return response ? JSON.parse(response).res : "NULL RESPONSE";
}

async function sendMail(email, name, subject, message) {
  const response = await ajax_request("POST", "../mail/send-gmail.php", {
    action: "send",
    table: "mail",
    recipient_email: email,
    recipient_name: name,
    subject: subject,
    message: message,
  });
  return response ? response : "NULL RESPONSE";
}

async function gatherEmailContents() {
  const email_response = await checkEmail();

  let users = [];

  const mail = {
    action: "get_email",
    table: "mail",
  };

  const ajax_response = await ajax_request(
    "POST",
    "../mail/send-gmail.php",
    mail
  );

  let prevID = -1; // * for checking of previous user id
  const getEmail = JSON.parse(ajax_response); // * parsing the response to JSON
  /*
   * a loop to populate the users array with the user's information
   * and projects nearing deadline
   */
  for (let i = 0; i < getEmail.length; i++) {
    // * if the previous user id is not equal to the current user id
    // * then create a new user and push it to the users array
    if (prevID !== getEmail[i].user_id) {
      let newUser = {
        action: "editJSON",
        table: "mail",
        user: {
          id: getEmail[i].user_id,
          name: getEmail[i].name,
          email: getEmail[i].email,
          projects: [],
          deadline: formatDate(new Date(getEmail[i].deadline)),
          isEmailSent: true,
        },
      };
      newUser.user.projects.push(getEmail[i].title); // * push the project to the user's projects array
      users.push(newUser); // * push the user to the users array
    } else {
      // * if the previous user id is equal to the current user id
      let prevUser = users.find((p) => p.user.id === getEmail[i].user_id); // * find the user with the current user id
      prevUser.user.projects.push(getEmail[i].title); // * push the project to the user's projects array
    }
    prevID = getEmail[i].user_id; // * set the previous user id to the current user id
  }

  console.log("users", users);

  // * if the json file is empty
  if (email_response === null || email_response === undefined) {
    for (let i = 0; i < users.length; i++) {
      sendEmail(users[i]);
      writeJSON(users[i]);
    }
    timedCount("gatherEmailContents()");
    return;
  }

  // * if the json file is not empty check for some email that is not sent
  for (let i = 0; i < users.length; i++) {
    console.log("counter : ", i);
    // * if the email is already sent in that day then skip
    if (
      email_response.user.find((p) => p.id === users[i].user.id) &&
      email_response.user.find((p) => p.deadline === formatDate(new Date()))
    ) {
      console.log("Email Already Sent to id : ", users[i].user.id);
      continue;
    }
    console.log("Email not sent yet to id : ", users[i].user.id);
    console.log(users[i].user.id, users[i].user.name, users[i].user.email);
    sendEmail(users[i]);
    writeJSON(users[i]);
  }
  timedCount("gatherEmailContents()");
}
gatherEmailContents();

function timedCount(text = "DONE", funcName) {
  postMessage(text);
  setTimeout(funcName, 10000);
}

async function sendEmail(user) {
  // * send email
  const email_res = await sendMail(
    user.user.email,
    user.user.name,
    "Projects Nearing Deadline",
    "<p>Good Day,<br><br>This is to inform you that the following\
          project is nearing its deadline (CURRENT DAY):<br><br><p>" +
      user.user.projects.join("<br>")
  );
  console.log("email response : ", email_res);
}

async function writeJSON(user) {
  // * update json file
  const json_res = await updateJSON(user);
  console.log("response : ", json_res);
}
// ! end of test
