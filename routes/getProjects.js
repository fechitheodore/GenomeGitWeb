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
      dbo.collection("users").findOne({
        email: req.query.email
      }, {
        _id: 0,
        projects: 1
      }, function(err, result) {
        if (err) throw err;

        var projects = [];
        var data = dbo.collection("projects").find({
          _id: {
            $in: result.projects
          }
        }, function(err, cursor) {
          cursor.each(function(err, project) {

            if (project != null) {
              projects.push({title: project.title, id: project._id, public: project.public});
            } else {
              db.close();
              res.send(projects);
            }
          });
        })
      });
    }, req.query.token)
  });
  return externalRoutes;
})();
