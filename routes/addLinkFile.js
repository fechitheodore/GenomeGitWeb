var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.post('/', function(req, res) {

    req.body.project = mongo.ObjectID(req.body.project);

    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
      dbo.collection("links").insertOne(req.body, function(err, result) {
        if (err) throw err;
        db.close();
        res.send({});
      });
    });
  });
  return externalRoutes;
})();
