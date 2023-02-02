var mongo = require("mongodb").MongoClient
var async = require("async")
var db;

exports.init =
  function(callback) {
    async.waterfall([
      (cb) => {
        mongo.connect(""/*MONGO DATABASE URI*/, { w: 1, poolSize: 20 }, (err, client) => {
          db = client.db("chat2database")
          cb(null)

        })
      },
      (cb) => {
        db.collection("users", (err, user_coll) => {
          exports.users = user_coll
          cb(null)
        })
      },
      (cb) => {
        db.collection("chats", (err, chats) => {
          exports.chats = chats;
          cb(null);
        })
      }
    ]
      , callback)
  }
exports.users = null