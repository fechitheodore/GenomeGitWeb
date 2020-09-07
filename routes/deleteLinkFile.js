var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.post('/', function(req, res) {

    mongoUtil.connectToServer(function(err) {
      console.log(req.body.project)
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
      dbo.collection("links").remove({
        project: mongo.ObjectID(req.body.project)
      }, function(err, result) {
        if (err) throw err;
        db.close();
        res.send({});
      });
    })
  });
  return externalRoutes;
})();
