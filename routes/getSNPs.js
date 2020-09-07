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

        $and: [{
            pos: {
              $gte: parseFloat(req.query.start)
            }
          },
          {
            pos: {
              $lte: parseFloat(req.query.end)
            }
          }
        ]

      }, function(err, cursor) {
        if (err) throw err;
        var alleles;
        cursor.each(function(err, row) {

          if (err) throw err;
          if (row != null) {
            alleles= row.des.split("->")
            var end=row.pos + alleles[1].length-alleles[0].length
            rows.push({
              "source": "dbSNP",
              "alleles": alleles,
              "feature_type": "variation",
              "assembly_name": "GRCh38",
              "clinical_significance": [],
              "start": row.pos,
              "seq_region_name": "1",
              "strand": 1,
              "id":"chr"+row.chr+":"+row.pos+"-"+end,
              "end": end,
              "homo":Number(row.homo).toFixed(2),
              "quality": row.value
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
