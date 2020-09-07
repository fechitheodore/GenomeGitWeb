var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");


module.exports = (function() {
 'use strict';
 var externalRoutes = require('express').Router();

 externalRoutes.get('/', function(req, res) {

   mongoUtil.connectToServer(function(err) {
     if (err) throw err;
     var db = mongoUtil.getDb();
     var dbo = db.db("webcircos");

     dbo.collection("fasta").findOne({
      _id: mongo.ObjectID(req.query.id)
    }, function(err, result){
      if(err) throw err;
      res.send(result);
      db.close();
     })
   })
 });
 return externalRoutes;
})();
