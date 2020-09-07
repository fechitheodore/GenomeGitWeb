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
      dbo.collection("projects").findOne({
        _id: mongo.ObjectID(req.query.project)
      }, {
        _id: 0,
        users: 1,
      }, function(err, result) {
        if (err) throw err;

        var users = [];
        var data = dbo.collection("users").find({
          _id: {
            $in: result.users
          },

        }, function(err, cursor) {
          cursor.each(function(err, user) {
            if (user != null) {
              users.push({firstName: user.firstName, lastName: user.lastName, email: user.email, id: user._id});
            } else {
              db.close();
              res.send(users);
            }
          });
        })
      });
    }, req.query.token)
  });
  return externalRoutes;
})();
