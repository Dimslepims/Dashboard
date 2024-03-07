'use strict';

const express = require('express');
var cors = require('cors');
const fs = require('fs');
const db = require("./models");
const morgan = require("morgan");
const axios = require("axios");
const User = db.user;

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
const app = express();


app.use(cors())
app.use(express.json());
app.use(morgan("dev")); 

require("./routes/api.routes")(app);

db.mongoose.connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("accessed db with", db.url);
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.log("tried to access db with", db.url);
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

async function checkAdmin (email) {
    const check = await User.findEmail(email);
    if (!check) {
        axios.post("http://localhost:8080/api/user/register", {
            email: email,
            name: "admin",
            password: "admin",
            isadmin: true
        });
    }
}

checkAdmin("admin@admin.fr");

app.get('/', (req, res) => {
    res.send('Server up');
});

app.get('/about.json',  (req, res) => {
    fs.readFile(__dirname + "/ressources/about.json", (error, data) => {
        if(error) { throw error; }
        let jsonData = JSON.parse(data)
        console.log(req.ip)
        jsonData.client.host = req.ip
        jsonData.server.current_time = Math.floor(Date.now() / 1000)
        res.send(jsonData)
    });
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
