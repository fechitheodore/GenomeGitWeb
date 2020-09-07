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
     var rows=[];

     dbo.collection("rows").find({
       file: {$eq: mongo.ObjectID(req.query.file)},
       chr: {$eq : req.query.chr},

       $or : [
         {$and: [
           {pos: {$gte : parseFloat(req.query.start)}},
           {pos: {$lte : parseFloat(req.query.end)}}
         ]}

       ]

     }, function(err, cursor){
       if(err) throw  err;
       cursor.each(function(err, row){
         if(err) throw err;
         if(row!=null){
           rows.push({chr: row.chr, pos: row.pos, value: row.value});
         }else{
           res.send(rows);
         }
       })
     })


   })
 });
 return externalRoutes;
})();
