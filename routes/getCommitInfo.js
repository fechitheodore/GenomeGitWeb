var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");
//var LinkObjects = require("../src/app/webcircos/project-panel/project-panel.component");


module.exports = (function () {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.get('/', function (req, res) {

    var gitFiles;

    mongoUtil.connectToServer(function (err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");

      dbo.collection("gitFiles").find({ projectID: mongo.ObjectID(req.query.id), dataset: "Genome" }).toArray(function (err, response) {
        gitFiles = response;
        let commitHashes = []
        for (let i=0; i<gitFiles.length; i++)  { commitHashes.push(gitFiles[i].commitHash) }
        dbo.collection("commits").find({ commitHash: {$in: commitHashes} }).toArray(function (err, commits) {
          if (err) throw err;
          //match the fasta files to commits
          let result =[]
          for (let i=0; i<gitFiles.length; i++){
            for (let j=0; j<commits.length; j++){
              if (gitFiles[i].commitHash === commits[j].commitHash) {
                result.push([gitFiles[i].fileHash,commits[j]])
                break;
              }
            }
          }
          db.close();
          res.send(result);
        });
      });
    })
  });
  return externalRoutes;
})();

