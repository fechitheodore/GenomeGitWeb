module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.post('/', function(req, res) {
    deleteProj(req.body.project, req.body.user);
    res.send({});
  });
  return externalRoutes;
})();


function deleteProj(project, user) {
  console.log("delete project")
  console.log(project)
  console.log(user)
  let ProjectEraser = require("./deleteProjectHelper")

  let deleter = new ProjectEraser.ProjectEraser
  
  deleter.collectProjectData(project.toString(), user)

}
