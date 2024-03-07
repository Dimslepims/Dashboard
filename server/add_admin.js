'use strict';

const db = require("./models");
const axios = require("axios");
const User = db.user;

db.mongoose.connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to the database!");
    if (process.argv[2] === '-h') {
        console.log("\nUSAGE:\n    node add_admin.js [email] [password]\n");
        process.exit();
    } else if (process.argv[2] && process.argv[3]) {
        add_admin(process.argv[2], process.argv[3]);
    } else {
        console.log("\nUSAGE:\n    node add_admin.js [email] [password]\n");
        process.exit();
    }
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

async function add_admin (email, password) {
    const check = await User.findEmail(email);
    if (!check) {
        await axios.post("http://localhost:8080/api/user/register", {
            email: email,
            name: `admin-${email}`,
            password: password,
            isadmin: true
        });
        console.log("Successfully added new admin", email);
    }
    process.exit();
}