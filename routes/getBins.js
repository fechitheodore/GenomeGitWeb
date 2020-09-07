var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.get('/', function(req, res) {

    var ids = [];

    req.query.files = JSON.parse(req.query.files);
    for (var i = 0; i < req.query.files.length; i++) {
      ids.push(mongo.ObjectID(req.query.files[i]))
    }

    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");

      var query;

      var files = {};

      var binsQuery = {
        file: {
          $in: ids
        }
      }
      if (req.query.chr) {
        binsQuery.chr = req.query.chr;
      } else {
        binsQuery.chr = "all";
      }
      dbo.collection("fasta").findOne({
        _id: {
          $in: ids
        }
      }, function(err, result) {
        files.fasta = result;
        var tracks = []
        dbo.collection("bins").find(binsQuery, function(err, cursor) {
          cursor.each(function(err, file) {
            if (file != null) {
              tracks.push(file);
            } else {
              files.tracks = tracks;
              res.send(files);
              db.close();
            }
          })
        })
      });
    })
  });
  return externalRoutes;
})();
