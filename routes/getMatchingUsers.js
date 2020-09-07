var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.get('/', function(req, res) {

    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");

      var users = [];
      dbo.collection("users").find({
        email: {
          $regex: "^"+req.query.input+".*"

        },

      }, function(err, cursor) {
        cursor.each(function(err, user) {
          if (user != null) {
            users.push({
              id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email
            });
          } else {
            db.close();
            res.send(users);
          }
        });
      })

    })
  });
  return externalRoutes;
})();
