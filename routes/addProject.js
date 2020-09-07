var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");
var execProcess = require("../public/repositoryParser/exec_process")
var environment = require("../src/environments/environment")


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.post('/', function(req, res) {
    console.log(environment.environment.gitDirectory);
    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
//check if exists
      dbo.collection("projects").find({title: req.body.title}).toArray(function(err, info){
        if (err) throw err;
        if (info.length == 0){ //does not exist
          execProcess.result("bash ./public/repositoryParser/initialiseGit.sh " + "/Users/cranfieldbix/ggWRepo/" + " " + req.body.username + " " + req.body.title, function(err, result){});
          dbo.collection("projects").insertOne({title: req.body.title, description: req.body.description, files:[], users:[mongo.ObjectID(req.body.user)], public: req.body.public, issues: [] }, function(err, result) {
            if (err) throw err;
            dbo.collection("users").update({_id: mongo.ObjectID(req.body.user)}, { $addToSet: { projects: result.insertedId } }, function(err, resultUpdate) {
              if (err) throw err;
              db.close();
              res.send({id: result.insertedId});
            });
    
          });
        }
        else { //exists
          db.close();
          //send warning
          res.send({id: "exists"})
        }
        
      });
    }, req.body.token)
  });
  return externalRoutes;
})();
