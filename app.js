const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const express = require("express");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

let db = null;
const filePath = path.join(__dirname, "userData.db");
const InitializeServerAndDb = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("starting server at localhost//:3000");
    });
  } catch (e) {
    console.log(`Error occurred  while starting server ${e.message}`);
    process.exit(1);
  }
};
InitializeServerAndDb();
//register
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const query = `select * from user where username = '${username}';`;
  const queryOutput = await db.get(query);
  if (queryOutput === undefined) {
    if (password.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertQuery = `
            insert
                into 
                user(username,
                    name,
                    password,
                    gender,
                    location)
                values(
                    '${username}',
                    '${name}',
                    '${hashedPassword}',
                    '${gender}',
                    '${location}'
                );`;
      const insertQueryOutput = await db.run(insertQuery);
      response.status = 200;
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

//login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const query = `select * from user where username = '${username}';`;
  const queryOutput = await db.get(query);
  if (queryOutput === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const passwordMatched = await bcrypt.compare(
      password,
      queryOutput.password
    );
    if (passwordMatched === true) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

//password changing
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const query = `select * from user where username = '${username}';`;
  const queryOutput = await db.get(query);
  const passwordMatched = await bcrypt.compare(
    oldPassword,
    queryOutput.password
  );
  if (passwordMatched === true) {
    if (newPassword.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      response.status = 200;
      response.send("Password Updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
