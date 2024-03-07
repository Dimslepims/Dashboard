const e = require("express");
const db = require("../models");
const User = db.user;
const Widget = db.widgets;
const Service = db.service;

exports.registerNewUser = async (req, res) => {
    try {
      const email = req.body.email;
      const name = req.body.name;
      const password = req.body.password;
      const admin = req.body.isadmin;
      const check = await User.findEmail(email);
      if (check) {
        return res.status(409).json({
          err: "Email already in use"
        });
      }
      const user = new User({
        name: name,
        email: email,
        password: password,
        isadmin: admin
      });
      let data = await user.save();
      const token = await user.generateAuthToken();
      res.status(201).json({ data, token });
    } catch (err) {
      res.status(400).json({ err: err.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const user = await User.findByCredentials(email, password);
      if (!user) {
        return res.status(401).json({ error: "Login failed! Check authentication credentials" });
      }
      const token = await user.generateAuthToken();
      res.status(201).json({ user, token });
    } catch (err) {
      console.log('error: ' + err.message)
      res.status(400).json({ err: err.message});
    }
};

exports.getAllUsers = async (req, res) => {
  try {
    const user = await User.findAll();
    if (!user) {
      return res.status(401).json({ error: "No user find" });
    }
    res.status(201).json({user});
  } catch (err) {
    res.status(400).json({ err: err });
  }
};

exports.removeOneUser = async (req, res) => {
  console.log(req.body.Id);
  const name = req.body.Id;
  const user = await User.removeUser(name);
  if (user) {
    res.status(201).json({message: "Deleted successfully !"});
  } else {
    res.status(401).json({message: "No user fond"});
  }
};

exports.getUserDetails = async (req, res) => {
    await res.json(req.userData);
};

exports.addWidgetToUser = async (req, res) => {
  try {
    var widgetModel = new Widget();
    const user = await User.findByEmail(JSON.parse(req.body.config).email);
    widgetModel.service = JSON.parse(req.body.config).service;
    widgetModel.widget = JSON.parse(req.body.config).widget;
    widgetModel.config = JSON.parse(req.body.config).config;
    widgetModel._id = req.body.id;
    user.widgets.push(widgetModel);
    user.save();
    res.status(201).json({message: "Widget added"});
  } catch (err) {
    res.status(401).json({message: "No user found"});
  }
};

exports.swapWidgets = async (req, res) => {
  try {
    const user = await User.findByEmail(req.body.email);
    user.widgets.splice(req.body.idx + req.body.direction, 1, user.widgets.splice(req.body.idx, 1, user.widgets[req.body.idx + req.body.direction])[0]);
    user.markModified('widgets');
    user.save();
    res.status(200).json({message: "Widget moved"});
  } catch (err) {
    console.log(err);
    res.status(401).json({message: "No user found"});
  }
};

exports.editWidgetOfUser = async (req, res) => {
  try {
    const user = await User.findByEmail(req.body.email);
    var widgetIndex = 0;

    for (widgetIndex = 0; widgetIndex < user.widgets.length; widgetIndex++) {
      if (user.widgets[widgetIndex]._id === req.body.widget.id) {
        break;
      }
    }

    if (widgetIndex === user.widgets.length) {
      res.status(401).json({message: "Widget not found"});
      return;
    }

    user.widgets[widgetIndex].service = JSON.parse(req.body.widget.config).service;
    user.widgets[widgetIndex].widget = JSON.parse(req.body.widget.config).widget;
    user.widgets[widgetIndex].config = JSON.parse(req.body.widget.config).config;
    user.widgets[widgetIndex]._id = req.body.widget.id;
    user.markModified('widgets');
    user.save();
    res.status(200).json({message: "Widget edited"});
  } catch (err) {
    console.log(err);
    res.status(401).json({message: "No user found"});
  }
};

exports.deleteWidgetOfUser = async (req, res) => {
  try {
    const user = await User.findByEmail(req.body.email);
    var i = 0;
    for (const element of user.widgets) {
      i++;
      if (element._id == req.body.widget.id)
        break;
    }
    user.widgets.splice(i - 1, 1);
    user.save();
    res.status(200).json({message: "Widget deleted"});
  } catch (err) {
    res.status(401).json({message: "No user found"});
  }
};

exports.getWidgetOfUser = async (req, res) => {
  try {
    const user = await User.findByEmail(req.query["email"]);
    res.status(200).json(user.widgets);
  } catch (err) {
    res.status(401).json({message: "No user found"});
  }
};

exports.getServiceOfUser = async (req, res) => {
  try {
    const user = await User.findByEmail(req.query["email"]);
    res.status(200).json(user.services);
  } catch (err) {
    res.status(401).json({message: "No user found"});
  }
};