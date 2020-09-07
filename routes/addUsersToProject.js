var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.get('/', function(req, res) {
    mongoUtil.connectToServer(function(err) {
      console.log(req.query)

      req.query.emails = JSON.parse(req.query.emails);
      console.log(req.query.emails)
      console.log("IN ")
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
      dbo.collection("users").find({
        email: {
          $in: req.query.emails
        }
        }, function(err, users) {
        if (err) throw err;
        var usersIds =[]
        users.each(function(err, user) {
          if (err) throw err;
          console.log(user)
          if(user!=null){
          dbo.collection("projects").update(

            {
            _id: mongo.ObjectID(req.query.project)
          },{
            $addToSet: {
              users: user._id
            }
          }
          , function(err, result2) {
        //  console.log(result2)
            if (err) throw err;
          });
          dbo.collection("users").update(

            {
            _id: user._id
          },{
            $addToSet: {
              projects: mongo.ObjectID(req.query.project)
            }
          }
          , function(err, result2) {

            if (err) throw err;
          });
        }
        else {
          var success =false
          var count = dbo.collection("users").find({
            email: {
              $in: req.query.emails
            }
          }).count(function(err, count) {

            if (count>=req.query.emails.length-1)
              success=true;
            db.close();

            res.send({complete:success});
          })


        }
        });



      });
    })
  });
  return externalRoutes;
})();
