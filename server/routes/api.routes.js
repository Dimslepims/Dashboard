module.exports = app => {
  var router = require("express").Router();
  
  const redditController = require("../controllers/reddit.controller.js");
  const auth = require("../config/auth");
  const userController = require("../controllers/userController.js");
  const weatherController = require("../controllers/weather.controller.js");
  const cryptoController = require("../controllers/crypto.controller.js");
  const steamController = require("../controllers/steam.controller.js");
  const twitchController = require("../controllers/twitch.controller.js");

  // Account management endpoints
  router.post("/user/register", userController.registerNewUser);
  router.post("/user/login", userController.loginUser);
  router.get("/user/me", auth,userController.getUserDetails);
  router.get("/user/admin", userController.getAllUsers);
  router.delete("/user/admin", userController.removeOneUser);
  router.get("/dashboard", userController.getWidgetOfUser);
  router.post("/dashboard", userController.addWidgetToUser);
  router.post("/dashboard/widgetOrder", userController.swapWidgets);
  router.put("/dashboard", userController.editWidgetOfUser);
  router.delete("/dashboard", userController.deleteWidgetOfUser);
  router.get("/services", userController.getServiceOfUser);

  // Reddit service endpoints
  router.post("/reddit/oauth", redditController.getRedditAccess);
  router.post("/reddit/revoke", redditController.disconnectReddit);
  router.get("/reddit/profile", redditController.getProfile);
  router.get("/reddit/subreddit", redditController.getSubredditInfos);
  router.get("/reddit/user", redditController.getUserInfos);

  //Twitch service endpoints
  router.post("/twitch/oauth", twitchController.getTwitchAccess);
  router.post("/twitch/revoke", twitchController.disconnectTwitch);
  router.get("/twitch/games", twitchController.getTwitchGames);
  router.get("/twitch/clips", twitchController.getTwitchClips);

  // Weather service endpoints
  router.get("/weather", weatherController.getCityWeather);

  //Crypto service endpoints
  router.get("/crypto", cryptoController.getCryptoCurrency);

  //Steam service endpoints
  router.get("/steam", steamController.getSteamUser);

  app.use('/api/', router);
};