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

      var ids = [];


      req.body.files = JSON.parse(req.body.files);
      for (var i = 0; i < req.body.files.length; i++) {
        ids.push(mongo.ObjectID(req.body.files[i]));
      }


      dbo.collection("files").update({
        _id: {
          $in: ids
        }
      }, {
        $addToSet: {
          projects: mongo.ObjectID(req.body.project)
        }
      }, function(err, result) {
        if (err) throw err;

        dbo.collection("fasta").update({
          _id: {
            $in: ids
          }
        }, {
          $addToSet: {
            projects: mongo.ObjectID(req.body.project)
          }
        }, function(err, result) {
          if (err) throw err;

          dbo.collection("projects").update({
            _id: mongo.ObjectID(req.body.project)
          }, {
            $addToSet: {
              files: {
                $each: ids
              }
            }
          }, function(err, result2) {
            if (err) throw err;
            db.close();
            res.send({});
          });
        });
      });
    })
  });
  return externalRoutes;
})();
