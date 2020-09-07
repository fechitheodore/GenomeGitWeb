var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.get('/', function(req, res) {

    var ids=[];
    req.query.files = JSON.parse(req.query.files);
    for(var i=0; i<req.query.files.length; i++){
      ids.push(mongo.ObjectID(req.query.files[i]));
    }

    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");

      dbo.collection("bins").find({
        file : {$in :ids}
      }).toArray(function(err, bins) {
        files = fasta;


      });
    }, req.query.token)
  });
  return externalRoutes;
})();
