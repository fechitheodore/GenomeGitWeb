var MongoClient = require('mongodb').MongoClient;

var _db;

module.exports = {

  connectToServer: function(callback, token) {
    //MongoClient.connect( "mongodb://81.154.249.176:27017/webcircos", function( err, db ) {
    MongoClient.connect("mongodb://localhost:27017/webcircos", function(err, db) {
      _db = db;
      if (token) {
        db.db("webcircos").collection("users").findOne({
          token: token
        }, function(err, result) {
          if (err) throw err;
          if (result != null) {
            callback();
          } else {
            console.log("NO token match")
          }
        })
      } else {
        callback();
      }
    })
  },

  getDb: function() {
    return _db;
  },


};
