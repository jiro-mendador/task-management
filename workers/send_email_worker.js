async function fetchData(url, method, data) {
  const options = {
    method,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: method !== "GET" ? JSON.stringify(data) : undefined,
  };
  const response = await fetch(url, options);
  try {
    const jsonData = await response.json();
    return jsonData;
  } catch (error) {
    postMessage("ERROR");
    console.error("Error : ", error); //! this catches the error in check_email_res as null
    return null;
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function checkEmail() {
  const response = await fetchData("../mail/email_checker.json", "GET", null);
  return response;
}

async function updateJSON(user) {
  const response = await fetchData("../mail/send-gmail.php", "POST", user);
  return response;
}

async function sendMail(user) {
  const response = await fetchData("../mail/send-gmail.php", "POST", {
    action: "send",
    table: "mail",
    recipient_email: user.email,
    recipient_name: user.name,
    subject: "Projects Nearing Deadline",
    message:
      "<p>Good Day,<br><br>This is to inform you that the following\
          project is nearing its deadline (CURRENT DAY):<br><br><p>" +
      user.projects.join("<br>"),
  });
  return response;
}

async function getEmail() {
  const response = await fetchData("../mail/send-gmail.php", "POST", {
    action: "get_email",
    table: "mail",
  });
  return response;
}

function populateUsersArray(getEmail, users) {
  let prevID = -1; // * for checking of previous user id
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
      // * push the project to the user's projects array
      newUser.user.projects.push(getEmail[i].title);
      // * push the user to the users array
      users.push(newUser);
    } else {
      // * if the previous user id is equal to the current user id
      // * find the user with the current user id
      let prevUser = users.find((p) => p.user.id === getEmail[i].user_id);
      // * push the project to the user's projects array
      prevUser.user.projects.push(getEmail[i].title);
    }
    // * set the previous user id to the current user id
    prevID = getEmail[i].user_id;
  }
}

async function worker() {
  let users = [];

  // ! an exception occur here when it runs again which returns a null
  const check_email_res = await checkEmail();
  const get_email_res = await getEmail();

  populateUsersArray(get_email_res, users);

  console.log("check_email_res", check_email_res);

  // * if the json file is empty
  if (check_email_res === null || check_email_res === undefined) {
    for (let i = 0; i < users.length; i++) {
      const res = await sendMail(users[i].user);
      const update_json_res = await updateJSON(users[i]);
    }
    postMessage("SUCCESS");
    return;
  }

  // * if the json file is not empty check for some email that is not sent
  for (let i = 0; i < users.length; i++) {
    // * if the email is already sent in that day then skip
    if (
      check_email_res.user.find((p) => p.id === users[i].user.id) &&
      check_email_res.user.find((p) => p.deadline === formatDate(new Date()))
    ) {
      console.log("Email ALREADY sent to id : ", users[i].user.id);
      continue;
    }
    console.log("Email NOT sent yet to id : ", users[i].user.id);
    const res = await sendMail(users[i].user);
    const update_json_res = await updateJSON(users[i]);
  }
  postMessage("SUCCESS");
}
worker();

// * for checking email in json file
// const check_email_res = await checkEmail();
// workerResponse = res.user[0].id;
// workerResponse = res;

// * getting email in database
// const get_email_res = await getEmail();
// workerResponse = res;

// * for writing to a json file
// const res = await updateJSON(
//   1,
//   "John Doe",
//   "johndoe@gmail",
//   "Project 1",
//   "2021-12-31",
//   "false"
// );
// workerResponse = res.res;

// * for sending email
// const res = await sendMail(
//   "jiromendador@gmail.com",
//   "John Doe",
//   "Test",
//   "Test message"
// );
// workerResponse = res.res;
