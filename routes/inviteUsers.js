var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.post('/', function(req, res) {

    mongoUtil.connectToServer(function(err) {

      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
      dbo.collection("users").update({
        _id: mongo.ObjectID(req.body.user)
      }, {
        $push: {
          projects: mongo.ObjectID(req.body.project)
        }
      }, function(err, result) {
        if (err) throw err;

        var data = dbo.collection("projects").update({
          _id: mongo.ObjectID(req.body.project)
        }, {
          $push: {
            users: mongo.ObjectID(req.body.user)
          }
        }, function(err, result) {
          if (err) throw err;
          res.send({});
        })
      });
    })
  });
  return externalRoutes;
})();
