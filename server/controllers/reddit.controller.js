const axios = require('axios');
const db = require("../models");
const Service = db.service;
const User = db.user;

const client_id = process.env.REDDIT_CLIENT_ID;
const client_secret = process.env.REDDIT_CLIENT_SECRET;

axios.interceptors.response.use(response => {
    return response;
}, error => {
    if (error.response.status === 401) {
        console.log('catched 401');
    }
    return error;
});

exports.getRedditAccess = async (req, res) => {
    const email = req.body.email;
    let code = new URLSearchParams(req.body.code);
    if (!code) {
        res.status(400).send({ message: "Missing OAuth code !" });
        return;
    }

    try {
        const responseCode = await getToken(req.body.code.toString(), email)
        if (responseCode == "Error")
            res.send({ status: 'Error, authentication failed' })
        else
            res.send({ status: 'Successful login to service' })
    } catch (err) {
        console.error(err);
    }
};

async function getToken(uniqueCode, email) {
    let authString = `${client_id}:${client_secret}`;
    authString = Buffer.from(authString).toString('base64');
    let requestHeaders = {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", uniqueCode);
    params.append("redirect_uri", "http://localhost:8081/oauth_callback");

    let res = null;
    try {
        res = await axios.post('https://www.reddit.com/api/v1/access_token', params, { headers: requestHeaders })
    } catch (error) {
        console.log('Access token retrieval error: ', error);
        return "Error";
    }

    if (res && res.data['access_token']) {
        addService("Reddit", "https://oauth.reddit.com/", res.data, email)
        return res.data.access_token;
    } else
        return "Error";
}

exports.disconnectReddit = async (req, res) => {
    const email = req.body.email;
    const user = await User.findByEmail(email);

    if (!email) {
        res.status(400).send({ message: "Missing email parameter" });
        return;
    }

    try {
        const responseCode = await revokeRedditToken(user);
        if (responseCode == "Error")
            res.send({ status: 'Error, revoke failed' });
        else
            res.send({ status: 'Successfuly revoked reddit token' });
    } catch (err) {
        console.error(err);
    }
};

async function refreshRedditToken(user, email) {
    let authString = `${client_id}:${client_secret}`;
    authString = Buffer.from(authString).toString('base64');
    console.log('begin');
    console.log(client_id);
    console.log(client_secret);
    console.log('end');
    let requestHeaders = {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    var config = null;
    for (let i = 0; i < user.services.length; i++) {
        if (user.services[i].name == "Reddit") {
            config = user.services[i].config;
        }
    }
    if (!config) {
        return "ERROR";
    }
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", config.refresh_token);

    let res = null;
    try {
        res = await axios.post('https://www.reddit.com/api/v1/access_token', params, { headers: requestHeaders })
    } catch (error) {
        console.log('Access token retrieval error: ', error);
        return "Error";
    }

    if (res && res.data['access_token']) {
        for (var i = 0; i < user.services.length; i++) {
            if (user.services[i].name == 'Reddit') {
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

async function revokeRedditToken(user) {
    let authString = `${client_id}:${client_secret}`;
    authString = Buffer.from(authString).toString('base64');
    let requestHeaders = {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    var config = null;
    for (let i = 0; i < user.services.length; i++) {
        if (user.services[i].name == "Reddit") {
            config = user.services[i].config;
        }
    }
    if (!config) {
        return "ERROR";
    }
    const params = new URLSearchParams();
    params.append("token", config.access_token);
    params.append("token_type_hint", 'access_token'); 
    let res = null;
    try {
        res = await axios.post('https://www.reddit.com/api/v1/revoke_token', params, { headers: requestHeaders })
    } catch (error) {
        console.log('Access token retrieval error: ', error);
        return "Error";
    }
    if (res.status === 200) {
        var i = 0;
        for (let i = 0; i < user.services.length; i++) {
            if (user.services[i].name === "Reddit") {
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

exports.getProfile = async (req, res) => {
    const email = req.query.email;
    const user = await User.findByEmail(email);

    let reddit = null;
    for (var i = 0; i < user.services.length; i++) {
        if (user.services[i].name == 'Reddit') {
            reddit = user.services[i];
        }
    }

    if (!reddit) {
        res.status(403).send("Not authenticated to service.");
        return;
    }

    let requestHeaders = {
        'Authorization': `Bearer ${reddit.config.access_token}`,
    };

    const url = `${reddit.baseUrl}api/v1/me`

    let user_infos = null;
    try {
        user_infos = await axios.get(url, { headers: requestHeaders });
    } catch (error) {
        refreshRedditToken(user);
        res.status(403).send("Error retrieving user information");
        return;
    }

    if (user_infos.status === 200) {
        res.send(user_infos.data);
    } else {
        refreshRedditToken(user);
        res.status(403).send("Error retrieving user information");
    }
}

async function addService(service_name, base_url, data, email) {
    if (!service_name || !base_url || !data) {
        console.log("Error: missing parameter to add service");
        return;
    }

    console.log(email);
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
            revokeRedditToken(user);
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

exports.getSubredditInfos = async (req, res) => {
    let url = "";
    if (req.query["sub_name"])
        url = `https://www.reddit.com/r/${req.query["sub_name"]}/about.json`
    else
        res.send("Missing subreddit name parameter");

    let sub_infos = null;
    try {
        sub_infos = await axios.get(url);
    } catch (error) {
        res.send("Error retrieving user information");
    }

    if (sub_infos.status === 200) {
        res.send(sub_infos.data);
    } else {
        res.send("Error retrieving user information");
    }
}

exports.getUserInfos = async (req, res) => {
    let url = "";
    if (req.query["username"])
        url = `https://www.reddit.com/u/${req.query["username"]}/about.json`
    else
        res.send("Missing subreddit name parameter");

    let user_infos = null;
    try {
        user_infos = await axios.get(url);
    } catch (error) {
        res.send("Error retrieving user information");
    }

    if (user_infos.status === 200) {
        res.send(user_infos.data.data);
    } else {
        res.send("Error retrieving user information");
    }
}