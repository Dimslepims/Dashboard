const axios = require('axios');
const db = require("../models");
const Service = db.service;
const User = db.user;

const clientId = "84ywaahm7orgmuraq6aqqnsb8a9934";
const clientSecret = "fbplawzbq4ztoox7e0o5r5v0hst576";
const getToken = "";

exports.getTwitchGames = async (req, res) => {
    const user2 = await User.findByEmail(req.query["email"]);
    refreshTwitchToken(user2);
    const user = await User.findByEmail(req.query["email"]);
    var config = null;
    for (let i = 0; i < user.services.length; i++) {
        if (user.services[i].name == "Twitch") {
            config = user.services[i].config;
        }
    }
    if (!config) {
        res.status(403).send("Not authenticated to service.");
        return;
    }
    const headers = {
        'Client-ID': clientId,
        'Authorization': 'Bearer ' +  config.access_token
    };
    try {
        const result = await axios.get(`https://api.twitch.tv/helix/games/top?first=${req.query["max"]}`, {headers});
        res.status(200).json(result.data);
    } catch (e) {
        refreshTwitchToken(user);
        console.log(e);
        res.status(400).json({message: "Something went wrong"})
    }
};

exports.getTwitchAccess = async (req, res) => {
    try {
        let result = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&code=${req.query["code"]}&grant_type=authorization_code&redirect_uri=http://localhost:8081/twitch_oauth_callback`);
        addService("Twitch", "https://id.twitch.tv/oauth2", result.data, req.body.email);
        res.send({status: 'Successful login to service'});
    } catch (e) {
        res.send({ status: 'Error, authentication failed' })
    }
};

async function getIdFromUsername(username, user) {
    var config = null;
    for (let i = 0; i < user.services.length; i++) {
        if (user.services[i].name == "Twitch") {
            config = user.services[i].config;
        }
    }
    const headers = {
        'Client-ID': clientId,
        'Authorization': 'Bearer ' +  config.access_token
    };
    try {
        let result = await axios.get(`https://api.twitch.tv/helix/users?login=${username}`, {headers});
        return (result.data.data[0].id);
    } catch (e) {
        refreshTwitchToken(user);
        console.log(e);
        return ("Error");
    }
};

exports.getTwitchClips = async (req, res) => {
    const user = await User.findByEmail(req.query["email"]);
    var config = null;
    for (let i = 0; i < user.services.length; i++) {
        if (user.services[i].name == "Twitch") {
            config = user.services[i].config;
        }
    }
    if (!config) {
        res.status(403).send("Not authenticated to service.");
        return;
    }
    const headers = {
        'Client-ID': clientId,
        'Authorization': 'Bearer ' +  config.access_token
    };
    const broadcasterId = await getIdFromUsername(req.query["username"], user);
    if (broadcasterId === "Error")
        res.status(400).json({message: "No broadcaster found"});
    try {
        let result = await axios.get(`https://api.twitch.tv/helix/clips?broadcaster_id=${broadcasterId}&first=${req.query["clips"]}`, {headers});
        res.status(200).json(result.data);
    } catch (e) {
        refreshTwitchToken(user);
        console.log(e);
        res.status(400).json({message: "No broadcaster found"});
    }
};

async function addService(service_name, base_url, data, email) {
    if (!service_name || !base_url || !data) {
        console.log("Error: missing parameter to add service");
        return;
    }

    const service = new Service({
        name: service_name,
        baseUrl: base_url,
        config: data,
    });
    const user = await User.findByEmail(email);

    // Is service already exists revoke old token and replace by new
    for (var i = 0; i < user.services.length; i++) {
        if (user.services[i].name == service_name) {
            //TODO: revoke old token
            revokeTwitchToken(user);
            user.services[i].config = data;
            user.markModified('services');
            user.save();
            return;
        }
    }

    // Save Service in the database
    user.services.push(service);
    user.save();
    service.save(service)
        .then(data => {
            console.log(`added Service ${data.name} to db`);
        })
        .catch(err => {
            console.log(err.message || "Some error occurred while adding Service.")
        });
};

exports.disconnectTwitch = async (req, res) => {
    const email = req.body.email;
    const user = await User.findByEmail(email);

    if (!email) {
        res.status(400).send({ message: "Missing email parameter" });
        return;
    }
    try {
        const result = await revokeTwitchToken(user);
        if (result === "Error")
            res.send({ status: 'Error, revoke failed' });
        else
            res.send({ status: 'Successfuly revoked reddit token' });
    } catch (e) {
        console.log(e);
    }
};

async function revokeTwitchToken(user)
{
    var config = null;
    for (let i = 0; i < user.services.length; i++) {
        if (user.services[i].name == "Twitch") {
            config = user.services[i].config;
        }
    }
    if (!config) {
        return "ERROR";
    }
    let headers = {
        'client_id': clientId,
        'token': config.access_token
    };
    let res = null;
    try {
        res = await axios.post(`https://id.twitch.tv/oauth2/revoke?client_id=${clientId}&token=${config.access_token}`);
        console.log(res);
    } catch (error) {
        console.log('Access token retrieval error: ', error);
        return "Error";
    }
    if (res.status === 200) {
        var i = 0;
        for (let i = 0; i < user.services.length; i++) {
            if (user.services[i].name === "Twitch") {
                user.services.splice(i, 1);
                user.markModified('services');
                user.save();
                return "OK";
                break;
            }
        }

    }
    return 'ERROR';
}

async function refreshTwitchToken(user) {
    var config = null;
    for (let i = 0; i < user.services.length; i++) {
        if (user.services[i].name == "Twitch") {
            config = user.services[i].config;
        }
    }
    if (!config) {
        return "ERROR";
    }
    let res = null;
    try {
        res = await axios.post(`https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=${config.refresh_token}&client_id=${clientId}&client_secret=${clientSecret}`);
    } catch (error) {
        console.log('Access token retrieval error: ', error);
        return "Error";
    }
    if (res && res.data['access_token']) {
        for (var i = 0; i < user.services.length; i++) {
            if (user.services[i].name == 'Twitch') {
                try {
                    user.services[i].config = res.data;
                    user.markModified('services');
                    user.save();
                    return "Ok";
                } catch (error) {
                    return "Error";
                }
            }
        }
        return res.data.access_token;
    } else
        return "Error";
}