const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

userSchema.pre("save", async function(next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id, name: user.name, email: user.email },
  "secret");
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  console.log("caca");
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error({ err: "Invalid login details" });
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error({ err: "Invalid login details" });
  }
  console.log(user)
  return user;
};

userSchema.statics.findAll = async () => {
  const user = await User.find({});
  if (!user) {
    throw new Error({ error: "No user found" });
  }
  return user;
};

userSchema.statics.findEmail = async (email) => {
  const user = await User.findOne({email: email});
  return user;
}

userSchema.statics.removeUser = async (name) => {
  console.log(name);
  const user = await User.findByIdAndRemove(name);
  if (!user) {
    throw new Error({ error: "Invalid User" });
  }
  return user;
};

const User = mongoose.model("User", userSchema);
module.exports = User;