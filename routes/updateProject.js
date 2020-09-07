var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");

module.exports = (function() {
    // console.log("updateProject.js function called");
    'use strict';
    var externalRoutes = require('express').Router();
  
    externalRoutes.post('/', function(req, res) {
  
  
      mongoUtil.connectToServer(function(err) {
        if (err) throw err;
        var db = mongoUtil.getDb();
        var dbo = db.db("webcircos");
        dbo.collection("projects").update({title: req.body.title, users:[mongo.ObjectID(req.body.user)], public: req.body.public });
      }, req.body.token)
    });
    return externalRoutes;
  })();
  