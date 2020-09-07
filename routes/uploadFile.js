var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");
var moment = require("moment");

module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.post('/', function(req, res) {

    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");

      if (req.body.temp) { //if a new temporary project must be created for unsigned users

        createTemporaryProject(dbo, function(projectID, title) {

          dbo.collection("files").insertOne({
            name: req.body.filename,
            data: req.body.data,
            format: req.body.format,
            projects: [mongo.ObjectID(projectID)]
          }, function(err, result) {
            if (err) throw err;
            dbo.collection("projects").update({
              _id: mongo.ObjectID(req.body.project)
            }, {
              $addToSet: {
                files: result.insertedId
              }
            }, function(err, result2) {
              if (err) throw err;
              db.close();
              res.send({
                projectID: projectID,
                title: title,
                id:result.insertedId
              });
            });
          });
        });

      } else {

        dbo.collection("files").insertOne({
          name: req.body.filename,
          data: req.body.data,
          format: req.body.format,
          projects: [mongo.ObjectID(req.body.project)]
        }, function(err, result) {
          if (err) throw err;
          dbo.collection("projects").update({
            _id: mongo.ObjectID(req.body.project)
          }, {
            $addToSet: {
              files: result.insertedId
            }
          }, function(err, result2) {
            if (err) throw err;
            db.close();
            res.send({id: result.insertedId});
          });
        });

      }
    }, req.body.token)

  });
  return externalRoutes;
})();


//Create a temporary project for the unsigned user and return its id and title, then uploads the file
function createTemporaryProject(dbo, callback) {

  dbo.collection("meta").findAndModify({}, [], {
    $inc: {
      projectCount: 1
    },
  }, {
    upsert: true,
    new: true
  }, function(err, resultUpdate) {
    var title = "Project " + resultUpdate.value.projectCount
    dbo.collection("projects").insertOne({
      title: title,
      description: "",
      files: [],
      expire: moment().add(7, 'days').unix()
    }, function(err, result) {
      callback(result.insertedId, title);
    });
  });


}
