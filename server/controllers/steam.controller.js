const Axios = require('axios');

const key = process.env.STEAM_API_KEY;

exports.getSteamUser = async (req, res) => {
    const steamId = req.query["steamId"];
    await Axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${key}&steamids=${steamId}`)
        .then((response) => {
            res.status(200).json(response.data);
        })
        .catch((e) => {
            console.log(e.message);
            res.status(401).json({err: "User not found"});
        });
};