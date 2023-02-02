var db = require("./db.js")
var bcrypt = require("bcryptjs")

function check(obj) {
  var s = obj.username.search(/\W/);
  var len = obj.username.length;
  var plen = obj.password.length;
  var pdig = obj.password.search(/\d/);
  var pnlen = obj.phone.length;
  var pndig = obj.phone.search(/\D/);
  var fnamea = obj.fname.search(/[^a-zA-Z]+/);
  var lnamea = obj.fname.search(/[^a-zA-Z]+/);
  if (s != -1 || len < 6) {
    return "username must be atleast 6 characters and cannot contain special characters";
  }

  else if (plen < 8 || pdig == -1) {
    return "password must be atleast 8 characters and contain one number"
  }
  else if (fnamea != -1 || lnamea != -1) {
    return "name fields must only contain letters"
  }
  else if (obj.gender.toLowerCase() != "male" && obj.gender.toLowerCase() != "female") {
    return "Gender must be male or female"
  }
  else if (pnlen != 10 || pndig != -1) {
    return "phone number must be 10 digits with no dashs"
  }
  else {
    return false;
  }

}

function find(username, callback) {
  db.users.find({ username: username }).toArray((err, user) => {
    if (err) {
      console.log("database error")
      callback(err)
    }
    else if (user.length = 1) {
      callback(null, user[0])
    }
    else if (user.length = 0) {

      callback(null, null)
    }
    else {
      err = "to many users with username"
      callback(err)
    }

  })
}

exports.findUsers = find

exports.createUser = function(userobj, callback) {
  var varify_input = check(userobj);
  if (varify_input) {
    console.log("bad input");
    console.log(varify_input);
    callback(varify_input, null);
  }
  else {
    console.log("input looks good");
    db.users.find({ $or: [{ username: userobj.username }, { phone: userobj.phone }, { email: userobj.email }] }).toArray((err, user) => {
      console.log("database done")
      if (err) {
        console.log("nani")
        callback(err, null)
        return;
      }
      else if (user[0]) {
        console.log(user);
        for (obj in user) {
          if (userobj.username.toLowerCase() == user[obj].username) {
            callback("your username matches another username", null);
            return;
          }
          else if (userobj.email.toLowerCase() == user[obj].email) {
            callback("your email matches an email in a different account", null);
            return;
          }
          else if (userobj.phone == user[obj].phone) {
            callback("your phone number matches a phone number in a different account", null);
            return;
          }
        }
      }
      else {
        console.log("no users detected")
        db.users.insertOne(userobj, { safe: true }, (err, sum) => {
          if (err) {
            callback(err);
            return;
          }
          else {
            bcrypt.hash(userobj.password, 10, (err, hash) => {
              db.users.updateOne(userobj, {
                $set: { password: hash, profile: "/data/uploads/" + userobj.username + "/" + userobj.profile },
                $push: { chats: { name: "Live", id: "63daf4b870ae561a7d301472", pic: "/data/uploads/Live/Live.jpg" } }
              }, (err, succ) => {
                if (err) {
                  //database err
                  callback(err, null);
                  return
                }
                else {
                  callback(null, { username: userobj.username, password: hash });
                }
              });
            })
          }
        })
      }
    })
  }
}