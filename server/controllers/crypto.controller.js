const Axios = require('axios')
exports.getCryptoCurrency = async (req, res) => {
    const cryptoname = req.query["cryptoname"];
    await Axios.get(`https://data.messari.io/api/v1/assets/${cryptoname}/metrics/market-data`)
        .then((response) => {
            res.status(200).json(response.data);
        })
        .catch((e) => {
            res.status(401).json({err: "No crypto found"});
        });
};