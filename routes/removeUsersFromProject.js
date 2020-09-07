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
      var users=[];

      var bodyUsers = JSON.parse(req.body.users);

      for(var i=0; i<bodyUsers.length; i++){
        users.push(mongo.ObjectID(bodyUsers[i]));
      }

      dbo.collection("users").update({
        _id: {$in: users}
      }, {
        $pull: {
          projects: mongo.ObjectID(req.body.project)
        }
      }, function(err, result) {
        if (err) throw err;

        var data = dbo.collection("projects").update({
          _id: mongo.ObjectID(req.body.project)
        }, {
          $pull: {
            users: {$in : users}
          }
        }, function(err, result) {
          if (err) throw err;
          res.send({});
        })
      });
    }, req.body.token)
  });
  return externalRoutes;
})();
