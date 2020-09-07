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
      var rows = [];
      dbo.collection("rows").find({
        file: {
          $eq: mongo.ObjectID(req.query.fileID)
        },
        chr: {
          $eq: req.query.chr
        },
        type: "mRNA",

        $or: [{
            $and: [{
                start: {
                  $gte: parseFloat(req.query.start)
                }
              },
              {
                start: {
                  $lte: parseFloat(req.query.end)
                }
              }
            ]
          },
          {
            $and: [{
                end: {
                  $gte: parseFloat(req.query.start)
                }
              },
              {
                end: {
                  $lte: parseFloat(req.query.end)
                }
              }
            ]
          }
        ]

      }, function(err, cursor) {
        if (err) throw err;

        var indexSplitID_Version, id, version;
        //console.log("starting rows");
        cursor.each(function(err, row) {
          console.log(row);
          if (err) throw err;
          if (row != null) {

            if (Array.isArray(row.id)){
              for (let k=0; k<row.id.length;k++){
                let index = row.id.indexOf(".");
                if (row.id[k].indexOf("=")===-1 && index!==-1){
                  id = row.id[k].substr(0, index);
                  version = row.id[k].substr(index + 1);
                }
              }


            } else {
              indexSplitID_Version = row.id.indexOf(".");
              if (indexSplitID_Version != 1) {
                id = row.id.substr(0, indexSplitID_Version);
                version = row.id.substr(indexSplitID_Version + 1);
              } else {
                id = row.id;
                version = 1;
              }
          }




            rows.push({
              "feature_type": "transcript",
              "external_name": id,
              "Parent": row.parent,
              "transcript_support_level": "1",
              "seq_region_name": "1",
              "strand": 1,
              "tag": "basic",
              "id": row.id,
              "transcript_id": row.id,
              "version": version,
              "assembly_name": "GRCh38",
              "description": row.des,
              "end": row.end,
              "biotype": "processed_transcript",
              "start": row.start
            });

          } else {
            res.send(rows);
          }
        })
      })


    })
  });
  return externalRoutes;
})();
