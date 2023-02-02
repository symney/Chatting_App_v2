console.log("running");
var fs = require("fs");
var path = require("path");
var async = require("async");
var express = require("express");
var symney = require("./Helper/files.js");
var data = require("./database/users.js");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var bcrypt = require("bcryptjs");
var users = require("./database/user.js")
var db = require("./database/db.js")
var multer = require("multer");
var passport = require("passport");
var localStrategy = require("passport-local").Strategy
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
ObjectID = require('mongodb').ObjectID;
const salts = 10;
var config = 1;

var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    if (req.path == "/create") {
      preimage(req, file, (err, path) => {
        if (err) {
          callback(err, null);
          return;
        }
        fs.mkdir(path, { recursive: true }, (err) => {
          if (err) { callback(err, null); return }
          callback(null, path);
        })
      })
    }
    else {
      fs.mkdir("./database/uploads/" + req.user.username, { recursive: true }, (err) => {
        //if error because directory already exists return directory as well
        if (err) {
          if (err.errno && err.errno == -17) {
            callback(null, "./database/uploads/" + req.user.username);
          }
          else {
            callback(err, null);
          }
          return
        }

        callback(null, "./database/uploads/" + req.user.username);
      })
    }
  },
  filename: (req, file, callback) => {
    if (req.path == "/create") {
      callback(null, "profile" + path.extname(file.originalname))
    }
    else {
      callback(null, Date.now() + path.extname(file.originalname))
    }
  }
})

var upload = multer({
  storage: storage
}).single("file");

app.use(cookieParser("hjbdofghsdukghsdlkghdjklfghuherjksflgd"));
//app.use("/api",(req,res,next)=>{res.header("Access-Control-Allow-Origin", "*");next();})
app.use("/data", express.static("./database"));
app.use(bodyParser.urlencoded({ encoded: false }));
app.use(bodyParser.json());
app.use(session({
  secret: "hjbdofghsdukghsdlkghdjklfghuherjksflgd",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

passport.use(new localStrategy((username, password, done) => {
  if (config == 1) {
    users.findUsers(username, (err, user) => {
      if (err) {
        console.log(err);
        done(err)//generate error page
      }
      else if (!user) {//res.locals or flash messages
        console.log("no user with that username")
        done(null, false);
      }
      else if (user) {
        bcrypt.compare(password, user.password, function(err, res) {
          if (res) {
            console.log("done");
            return done(null, user);
          }
          else {
            console.log("incorrect password");
            return done(null, false);
          }
        });
      }
      else {
        console.log("error multiple users with that account")
        res.end("there was a server error")//generate error page or flash message back to server error
      }
    })
  }

  else if (config == 2) {
    async.eachSeries(data.users, (user, callback) => {
      if (user.username == username) {
        console.log(username);
        bcrypt.hash(user.password, salts, function(err, hash) {
          bcrypt.compare(password, hash, function(err, res) {
            if (res) {
              console.log("done")
              return done(null, user);
            }
            else {
              if (user == data.users[data.users.length - 1]) {
                console.log("error")
                return done(null, false);
              }
              callback();
            }
          });
        });


      }
      else if (!(user.username == username)) {
        if (user == data.users[data.users.length - 1]) {
          console.log("ERROR")
          return done(null, false);
        }
        callback();
      }

    })
  }
}))

passport.serializeUser((user, done) => {
  if (config == 1) {
    //config with the database
    done(null, user.username)
  }
  else if (config == 2) {
    done(null, user.id)
  }

})

passport.deserializeUser((username/*username or id depending on config*/, done) => {
  if (config == 1) {
    users.findUsers(username, (err, user) => {
      if (err) {
        console.log(err);
        //server error database
        done(null, false);
      }
      else if (!user) {
        //returns back to login because they couldnt find the username in sesh id whats good
        console.log("error serializing");
        done(null, false);
      }
      else if (user) {
        done(null, user);
      }
      else {
        //this case should not occur send message about a problem
        console.log("error serializing");
        done(null, false);
      }
    })
  }
  else if (config == 2) {
    done(null, data.users[username])
  }

})

app.use(passport.initialize());
app.use(passport.session());



app.use("/home", (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  }
  else {

    res.redirect("../login");

  }
});
//commented because you cant req users in app
/*app.use("/api",(req,res,next)=>{
  if(req.isAuthenticated()){
      next();
  }
  else{

      res.redirect("../login");
     
  }
});*/

app.use("/api/chat", (req, res, next) => {
  //var info=req.user.username;
  let query = req.query
  if (/*req.isAuthenticated()*/true) {//was uncommented this was done for server
    //second parameter was req.user.username fix in go
    db.chats.find({ _id: ObjectID(query.id) }).toArray((err, chat) => {
      console.log(chat)
      info = null;
      if (err) {
        //database server error but api so just serve nothing?
        console.log(err);
        res.end(err);
      }
      else if (!chat[0]) {
        res.end("POTENTIAL HACKER")
      }
      else if (chat[0]) {
        res.locals.messages = chat[0];
        console.log("chat  \n" + JSON.stringify(chat[0]))
        next();
      }
      else {

        res.end("server error edge case")
      }
    })

  }
  else {
    //unauthenticated user
    res.redirect("../login");

  }
});

app.get("/", (req, res) => { res.redirect("/home"); });

app.get("/login", (req, res) => { ; symney.stat_req("database/front/html/home.html", res) })
app.get("/home", (req, res) => {
  symney.stat_req("database/front/html/final.html", res)
  res.cookie("user", req.user.username)
})

app.get("/create", (req, res) => { symney.stat_req("database/front/html/create.html", res) })

app.get("/api/user", (req, res) => {
  res.end(JSON.stringify(req.user));
});
app.get("/api/chat", (req, res) => {
  res.end(JSON.stringify({ messages: res.locals.messages }))
});
app.post("/login", passport.authenticate("local", {
  failureRedirect: "/login",
  session: true
}),
  (req, res) => { res.redirect("/home") }
);

app.post("/create", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err)
      res.end(JSON.stringify({ "bad": err + "" }));
    }
    else {
      console.log(req.body)
      fs.rename('./database/uploads/' + req.body.username + "/profile" + path.extname(req.file.originalname), './database/uploads/' + req.body.username + "/profile.jpg", function(err) {
        if (err) {
          console.log(err);
          //profile picture is wrong name advise them to change it
        };
        req.login(req.body, function(err) {
          if (err) { return next(err); }
          return res.redirect('/home');
        });
      });

    }
  })
})
app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.locals.error = err;
      console.log(err);
      //send object back so the user knows something went wrong;
    }
    else {
      console.log(req.file.filename)
      req.file.path = "./data/uploads/" + req.body.sender + "/" + req.file.filename;
      req.file.sender = req.body.sender;
      req.file.time = Number(req.body.time);
      db.chats.updateOne({ _id: ObjectID(req.body.id) }, { $push: { log: req.file } }, (err) => {
        if (err) {

        }
        else {
          io.emit(req.body.id, req.file);
        }
      })
    }
  })
})


if (config == 1) {
  db.init((err, result) => {
    if (err) {
      console.log(err)
    }
    else {
      http.listen(3000);


    }
  })
}
else if (config == 2) {
  http.listen(3000);
}

io.on("connection", (ws) => {
  console.log("connection successful");
  ws.on("logged", (un) => { ws.emit("logged", un) })
  ws.on("chat", (msgobj) => {
    if (msgobj.typed) {
      console.log("recognized type");
      io.emit(msgobj.id, { typed: msgobj.typed, username: msgobj.username });

    }
    else if (msgobj.chat && msgobj.chat != "") {
      console.log(msgobj)
      console.log("sendering");
      db.chats.updateOne({ _id: ObjectID(msgobj.id) }, { $push: { log: msgobj }, $set: { read: false } }, (err) => {
        if (err) {
          console.log(err);
          //database error;
          ws.emit(msgobj.id, "Your last chat could not be sent");
        }
        else {
          console.log("sending event:" + msgobj.id);
          io.emit(msgobj.id, msgobj);
        }
      });
    }
    else {
      console.log("?")
    }

  })
  ws.on("read", (chatid) => {
    db.chats.updateOne({ _id: ObjectID(chatid) }, { $set: { read: true } }, (err, suc) => {
      if (err) {
        console.log(err);
        //database err
      }
      else {
        console.log("read");
        io.emit("read", chatid);
      }
    })
  })
  ws.on("disconnect", (ws) => {
    console.log("someone has disconnected");
  })
  ws.on("click", (id) => {
    //create system where the previous chat data is stored in cookies so it doesnt use up data
    db.chats.find({ _id: ObjectID(id) }).toArray((err, chat) => {
      info = null;
      if (err) {
        //database error 
        console.log(err);
      }
      else if (!chat[0]) {//cant find the chat so do nothing
      }
      else if (chat[0]) {
        symney.fileread("./database/front/html/messages.html", (err, file) => {
          if (err) {
            console.log(err);
          }
          else {//change this you dont have to send the id along
            ws.emit("click", { messages: chat[0].log, read: chat[0].read, id: chat[0]._id, filedata: file });
          }
        })
      }
      else {
      }
    })

  });
  ws.on("search", (search) => {
    //make it so you can search for people by email or username
    var check = search.replace(/\W/g, "");
    console.log("CHECK: " + check);
    var sr = new RegExp("^" + check + ".*")
    if (config == 1) {
      db.users.find({ username: sr }).toArray((err, results) => {
        if (err) {
          console.log(err);
          //database error
        }
        else {
          if (results[0]) {
            ws.emit("search", { results: results });
          }
          else {
            ws.emit("search", {});
          }
        }
      })
    }
    else if (config == 2) {
      ws.emit("search", { results: data.users });
    }

  })
  ws.on("createc", (cobj) => {//(not an todo just description)createchat event when you create a new chat
    db.chats.insertOne({ log: [], usersin: [cobj.creator, cobj.chatwith], name: cobj.creator + " and " + cobj.chatwith, read: false }, { safe: true }, (err, suc) => {
      if (err) {
        //database error
        console.log(err);
      }
      else {
        console.log("---------------");
        console.log(suc.ops[0]._id);

        if (err) {
          //database error
        }
        else {
          console.log("oof");
          console.log(suc.ops[0]._id);
          db.users.updateOne({ username: cobj.creator }, { $push: { chats: { name: cobj.chatwith, id: String(suc.ops[0]._id), other: cobj.chatwith, pic: "/data/uploads/" + cobj.chatwith + "/profile.jpg" } } }, (err) => {
            if (err) {
              //database error
            }
            else {
              db.users.updateOne({ username: cobj.chatwith }, { $push: { chats: { name: cobj.creator, id: String(suc.ops[0]._id), other: cobj.creator, pic: "/data/uploads/" + cobj.creator + "/profile.jpg" } } }, (err) => {
                if (err) {
                  //database error
                }
                else {
                  var finale = suc.ops[0];
                  finale.user = cobj.chatwith;
                  finale.pic = "/data/uploads/" + cobj.chatwith + "/profile.jpg";
                  console.log(finale);
                  ws.emit("createc", finale);
                  finale.user = cobj.creator;
                  finale.pic = "/data/uploads/" + cobj.creator + "/profile.jpg";
                  io.emit(cobj.chatwith, finale)
                }
              })
            }
          })

        }

      }
    })
  })

})


function preimage(req, file, callback) {
  var userobj = {
    username: req.body.username.toLowerCase(),
    password: req.body.password,
    email: req.body.email.toLowerCase(),
    fname: req.body.fname.toLowerCase(),
    lname: req.body.lname.toLowerCase(),
    gender: req.body.gender.toLowerCase(),
    phone: req.body.pnum,
    profile: "profile.jpg"
  }
  users.createUser(userobj, (err, user) => {
    if (err) {
      callback(err, null);
      return;
    }
    else {
      console.log("account successfully created: " + user.username + "   " + user.password);
      callback(null, "./database/uploads/" + user.username);
    }
  })

}
