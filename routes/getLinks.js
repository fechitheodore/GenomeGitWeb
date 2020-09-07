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
      var ids = req.query.project.split(",");
      console.log(ids);
      dbo.collection("linksTest").find({
        $or: [
          {OldFasta : { $in: ids}},
          {NewFasta : { $in: ids}}]
      }).toArray(function(err, linkFiles) {
        if (err) throw err;
        db.close();
        res.send(linkFiles);
      });
    })
  });
  return externalRoutes;
})();



// module.exports = (function() {
//   'use strict';
//   var externalRoutes = require('express').Router();

//   externalRoutes.get('/', function(req, res) {

//     mongoUtil.connectToServer(function(err) {
//       if (err) throw err;
//       var db = mongoUtil.getDb();
//       var dbo = db.db("webcircos");

//       dbo.collection("links").find({
//         project : mongo.ObjectID(req.query.project)
//       }).toArray(function(err, linkFiles) {
//         if (err) throw err;
//         db.close();
//         res.send(linkFiles);
//       });
//     })
//   });
//   return externalRoutes;
// })();
