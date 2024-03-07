const Axios = require('axios')
const weatherApiKey = process.env.OPENWEATHER_API_KEY
const locationApiKey = process.env.GOOGLE_API_KEY

Axios.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response.status === 401) {
      console.log('catched 401');
  }
  return error;
});

exports.getCityWeather = async (req, res) => {
  let city = null;
  try {
    city = req.query["city"];
  } catch (err) {
    res.status(400).json({ err: "Missing city parameter" });
  }
  if (!city)
    res.send({ err: "Missing city parameter" });
  locationBaseUrl = "https://maps.googleapis.com/maps/api/geocode/";
  locationParams = `json?address=${city}&key=${locationApiKey}`;
  let url = locationBaseUrl + locationParams;
  let locationRes = null;
  try {
      locationRes = await Axios.get(url);
  } catch (error) {
      console.log("Error retrieving latitude and longitude: ", error);
      res.send("Error retrieving latitude and longitude");
  }
  let latitude = locationRes.data.results[0].geometry.location.lat;
  let longitude = locationRes.data.results[0].geometry.location.lng;

  let weatherBaseUrl = "https://api.openweathermap.org/data/2.5/"
  let weatherParams = `onecall?lat=${latitude}&lon=${longitude}&units=metric&exclude=current,minutely,hourly&appid=${weatherApiKey}`;

  url = weatherBaseUrl + weatherParams;
  let weatherRes = null;
  try {
    weatherRes = await Axios.get(url);
  } catch (error) {
    console.log("Error retrieving weather ", error);
    res.send("Error retrieving latitude and longitude");
  }
  res.send(JSON.stringify(weatherRes.data));
};
