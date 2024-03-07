const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {Schema} = require("mongoose");
var Widget = require("./widget.model");
var Service = require("./service.model");
module.exports = mongoose => {
    var userSchema = mongoose.Schema({
        name: {
          type: String,
          required: [true, "Please Include your name"]
        },
        email: {
          type: String,
          required: [true, "Please Include your email"]
        },
        password: {
          type: String,
          required: [true, "Please Include your password"]
        },
        isadmin: {
          type: Boolean,
          default: false
        },
        tokens: [
          {
            token: {
              type: String,
              required: true
            }
          }
        ],
        widgets: {
          type: [Widget.schema]
        },
        services : {
          type: [Service.schema]
        }
      });

      userSchema.pre("save", async function(next) {
        const user = this;
        if (user.isModified("password")) {
          user.password = await bcrypt.hash(user.password, 8);
        }
        next();
      });
      
      userSchema.methods.generateAuthToken = async function() {
        const user = this;
        const token = jwt.sign({ _id: user._id, name: user.name, email: user.email, admin: user.isadmin},
        "secret");
        user.tokens = user.tokens.concat({ token });
        await user.save();
        return token;
      };

      userSchema.statics.findByCredentials = async (email, password) => {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('Invalid login details');
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
          throw new Error("Invalid login details");
        }
        return user;
      };

      userSchema.statics.findByEmail = async (email) => {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('No user found');
        }
        return user;
      }
      
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
        const user = await User.findByIdAndRemove(name);
        if (!user) {
          throw new Error({ error: "Invalid User" });
        }
        return user;
      };
    
    const User = mongoose.model("user", userSchema);
    return User;
};
  