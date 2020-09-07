var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");
var LinkObjects = require("../public/repositoryParser/parser_types");


module.exports = (function () {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.get('/', function (req, res) {

    var files;

    mongoUtil.connectToServer(function (err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
      console.log(req.query.id);

      dbo.collection("fasta").find({
        projects: {
          $elemMatch: {
            $eq: mongo.ObjectID(req.query.id)
          }
        }
      }).toArray(function (err, fasta) {
        files = fasta;

        dbo.collection("projects").findOne({
          _id: mongo.ObjectID(req.query.id)
        }, function (err, result) {
          if (err) throw err;

          dbo.collection("files").find({
            _id: {
              $in: result.files
            }
          }, function (err, cursor) {
            if (err) throw err;
            cursor.each(function (err, file) {
              if (err) throw err;
              if (file != null) {
                files.push(file);
              } else {

                let ids = []
                for (let i = 0; i < files.length; i++) {
                  files[i].format == "fasta" ? ids.push(files[i]._id.toString()) : null;
                }
                if (ids.length > 1) {
                  dbo.collection("linkFiles").find({
                    $or: [
                      { OldFasta: { $in: ids } },
                      { NewFasta: { $in: ids } }],
                  }).toArray(function (err, links) {
                    if (err) throw err;
                    let linkFileCounter = 0;
                    if (err) throw err;
                    if (links.length !== 0) {
                      for (let i = 0; i < links.length; i++) {
                        let linkData = new LinkObjects.FastaLink;
                        linkData.OldFasta = links[i].OldFasta;
                        linkData.NewFasta = links[i].NewFasta;
                        linkData.format = links[i].format;
                        dbo.collection("linksData").find({
                          linkFileID: links[i]._id
                        }).toArray(function (err, values) {
                          if (values != undefined) {
                            linkData.fileID = values[0].linkFileID.toString();
                            linkData.data = values;
                            files.push(linkData);
                          }
                          linkFileCounter++;
                          if (linkFileCounter === links.length) {
                            res.send(files);
                            db.close();
                          }
                        })
                      }

                    } else {
                      res.send(files);
                      db.close();
                    }
                  });
                } else {
                  res.send(files);
                  db.close();
                }


              }
            });
          });
        });//
      });
    })
  });
  return externalRoutes;
})();

