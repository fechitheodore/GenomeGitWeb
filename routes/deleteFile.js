var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");


module.exports = (function () {
  'use strict';
  var externalRoutes = require('express').Router();
  
  externalRoutes.get('/', function (req, res) {

   mongoUtil.connectToServer(function (err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
      var fileid=mongo.ObjectID(req.query.id);
	console.log(fileid);
      dbo.collection("files").deleteMany({ _id: fileid }, function (err, result) { });

      dbo.collection("bins").deleteMany({ file: fileid }, function (err, result) { });

      dbo.collection("rows").deleteMany({ file: fileid }, function (err, result) { });

      dbo.collection("projects").deleteMany({ _id: fileid }, function (err, result) { });

      dbo.collection("projects").update({}, { $pull: { files: fileid } }, { multi: true });

      res.send(true);

    })
  });
  return externalRoutes;
})();

