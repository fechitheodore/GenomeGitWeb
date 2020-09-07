var mongoUtil = require('../modules/mongoUtil');
var mongo = require("mongodb");
var SNPbinning = require("../modules/SNPbinning");
var annotationBinning = require("../modules/annotationBinning");
var diffBinning = require("../modules/diffBinning");
var BAMbinning = require("../modules/BAMbinning");
var transcriptomicCovBinning = require("../modules/transcriptomicCovBinning");
var expressionBinning = require("../modules/expressionBinning")
var nbDiv = 100;

module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.get('/', function(req, res) {


    var ids = [];
    var chromosome = JSON.parse(req.query.chrData);

    var fileIds = JSON.parse(req.query.files);
    for (var i = 0; i < fileIds.length; i++) {
      ids.push(mongo.ObjectID(fileIds[i]))
    }

    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");

      var query;
      var files = {};
      var limitBin=20000000;
      var limitBinVCF=3000000;

      dbo.collection("files").find({
        _id: {
          $in: ids
        }
      }, function(err, cursor) {
        cursor.each(function(err, file) {

          if (file != null) {

            files[file._id] = {
              name: file.name,
              format: file.format,
              data: []
            }
          } else {
            dbo.collection("rows").find({
                file: {
                  $in: ids
                },
                chr: chromosome.chr,
                $or: [
                  {
                    $and : [
                      {
                        pos: {$gte : chromosome.start}
                      },
                      {
                        pos: {$lte: chromosome.end}
                      }
                    ]
                  },
                  {
                    $or: [
                      {
                        $and: [
                          {
                            start: {$gte : chromosome.start}
                          },
                          {
                            start: {$lte : chromosome.end}
                          }
                        ]
                      },
                      {
                        $and: [
                          {
                            end: {$gte : chromosome.start}
                          },
                          {
                            end: {$lte : chromosome.end}
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              function(err, cursor) {
                if(err) throw err;

                var chr;
                var resToReturn = [];

                cursor.each(function(err, row) {
                  if(err) throw err;

                  if (row != null) {

                    var id = row.file;


                    files[id].data.push(row);

                  } else {


                    var newData=null;
                    for (var i = 0; i < fileIds.length; i++) {

                      var obj = {
                        name: files[fileIds[i]].name,
                        format: files[fileIds[i]].format,
                        data: [],
                        _id: fileIds[i]
                      };
                      if (files[fileIds[i]].format == "vcf") {


                        if (files[fileIds[i]].data.length < 2000 && req.query.isComparison== 'false') {
                          for (var j = 0; j < files[fileIds[i]].data.length; j++) {
                            obj.data.push(files[fileIds[i]].data[j]);
                          }
                        } else {
                          obj.data = SNPbinning.calculateSNPDensity(files[fileIds[i]].data, [
                            [chromosome.chr, chromosome.end - chromosome.start]
                          ], chromosome.end - chromosome.start, chromosome.start, chromosome.end);
                        }

                        resToReturn.push(obj);


                      } else if (files[fileIds[i]].format == "diffExp" || files[fileIds[i]].format == "de") {

                          if (chromosome.end - chromosome.start  < limitBin && req.query.isComparison== 'false') {
                          for (var j = 0; j < files[fileIds[i]].data.length; j++) {

                            if (files[fileIds[i]].data[j].start > chromosome.start && files[fileIds[i]].data[j].end < chromosome.end) {
                              obj.data.push(files[fileIds[i]].data[j]);

                            }
                          }
                          obj.isARC =true;
                        }
                        else {

                          obj.data = diffBinning.calculateDiffAverage(files[fileIds[i]].data, [
                            [chromosome.chr, chromosome.end - chromosome.start]
                          ], chromosome.end - chromosome.start, chromosome.start, chromosome.end);
                        }

                        if (obj.data)
                          resToReturn.push(obj);



                      } else if (obj.format == "annotation") {

                        if ((chromosome.end - chromosome.start  < limitBin) && (req.query.isComparison == 'false')) {

                          var rows = files[fileIds[i]].data
                          for (var j = 0; j < rows.length; j++) {

                            if (rows[j].start > chromosome.start && rows[j].end < chromosome.end && rows[j].type=="mRNA") {

                              obj.data.push(files[fileIds[i]].data[j]);

                            }
                          }
                          obj.isARC =true;
                        } else {

                          obj.data = annotationBinning.calculateAnnotationDensity(files[fileIds[i]].data, [
                            [chromosome.chr, chromosome.end - chromosome.start]
                          ], chromosome.end - chromosome.start, chromosome.start, chromosome.end);
                          obj.isARC=false;
                        }

                        if (obj.data)
                          resToReturn.push(obj);
                      } else if (obj.format == "bam" || obj.format == "bai" ||  obj.format == "genomicCov") {

                        if(chromosome.end-chromosome.start < 50){
                        for (var j = 0; j < files[fileIds[i]].data.length; j++) {

                          if (files[fileIds[i]].data[j].pos > chromosome.start && files[fileIds[i]].data[j].pos < chromosome.end) {
                            obj.data.push(files[fileIds[i]].data[j]);

                          }
                        }
                      }
                        else{
                          obj.data = BAMbinning.calculateBAMDensity(files[fileIds[i]].data, [
                            [chromosome.chr, chromosome.end - chromosome.start]
                          ], chromosome.end - chromosome.start, chromosome.start, chromosome.end);
                        }
                        /*obj.data = BAMbinning.calculateBAMDensity(files[fileIds[i]].data, [
                          [chromosome.chr, chromosome.length]
                        ], chromosome.length, chromosome.start, chromosome.end);*/
                        if(obj.data)
                        resToReturn.push(obj);

                      } else if (obj.format == "bedcov" || obj.format == "transcriptomicCov" ) {
                        //  console.log( files[fileIds[i]].data)

                        if(chromosome.end-chromosome.start < 50){
                        for (var j = 0; j < files[fileIds[i]].data.length; j++) {

                          if (files[fileIds[i]].data[j].pos > chromosome.start && files[fileIds[i]].data[j].pos < chromosome.end) {
                            obj.data.push(files[fileIds[i]].data[j]);

                          }
                        }
                      }
                        else{
                          obj.data = transcriptomicCovBinning.calculateTranscriptomicCovDensity(files[fileIds[i]].data, [
                            [chromosome.chr, chromosome.end - chromosome.start]
                          ], chromosome.end - chromosome.start, chromosome.start, chromosome.end);
                        }

                        /*obj.data = BAMbinning.calculateBAMDensity(files[fileIds[i]].data, [
                          [chromosome.chr, chromosome.length]
                        ], chromosome.length, chromosome.start, chromosome.end);*/
                        //console.log(obj.data[0],obj.data[1])
                        if(obj.data)
                          resToReturn.push(obj);

                      }
                      else if (obj.format == "results" || obj.format == "expression" ) {
                        //  console.log( files[fileIds[i]].data)

                          if(chromosome.end-chromosome.start < 50){
                        for (var j = 0; j < files[fileIds[i]].data.length; j++) {

                          if (files[fileIds[i]].data[j].pos > chromosome.start && files[fileIds[i]].data[j].pos < chromosome.end) {
                            obj.data.push(files[fileIds[i]].data[j]);

                          }
                        }
                      }
                      else{
                        obj.data = expressionBinning.calculateExpressionDensity(files[fileIds[i]].data, [
                          [chromosome.chr, chromosome.end - chromosome.start]
                        ], chromosome.end - chromosome.start, chromosome.start, chromosome.end);
                      }
                        /*obj.data = BAMbinning.calculateBAMDensity(files[fileIds[i]].data, [
                          [chromosome.chr, chromosome.length]
                        ], chromosome.length, chromosome.start, chromosome.end);*/
                        if(obj.data)
                          resToReturn.push(obj);

                      }
                    }
                    res.send(resToReturn);
                  }
                });
              })
          }
        });
      });
    });

  });

  return externalRoutes;
})();


function calculateGenomicCoverageAverage(genomicCov, fasta, genomeLength, start, end) {
  nbDiv = 1000;

  /*for(let i=0; i<genomicCov.length;i++){
    console.log(genomicCov[i]);
  }*/
  var regionSize = genomeLength / nbDiv;
  var chromosomesArray = [];

  //Initialize the arrays
  for (var j = 0; j < fasta.length; j++) {
    var positions = [];

    if (start) {
      for (var k = 0; k < nbDiv; k++) {
        positions.push(0);
      }
    } else {
      for (var k = 0; k < fasta[j][1] / regionSize; k++) {

        positions.push(0);
      }
    }


    chromosomesArray.push({
      id: fasta[j][0],
      positions: positions,
      length: fasta[j][1]

    })
  }


  for (var j = 0; j < genomicCov.length; j++) {

    for (var k = 0; k < chromosomesArray.length; k++) {

      if (genomicCov[j].chr == chromosomesArray[k].id && (start == null || (genomicCov[j].pos > start &&
          genomicCov[j].pos < end)) && (genomicCov[j].pos < chromosomesArray[k].length)) {
        //console.log(Math.floor(genomicCov[j].pos / regionSize)) ; console.log("rd : value = "); console.log(genomicCov[j].value);
        if (start) {
          chromosomesArray[k].positions[Math.floor((genomicCov[j].pos - start) / regionSize)] += genomicCov[j].value;
        } else {
          if (k == 1) {


            //  console.log("pos : "+ genomicCov[j].pos);
          }
          chromosomesArray[k].positions[Math.floor(genomicCov[j].pos / regionSize)] += genomicCov[j].value;

        }
      }
    }
  }



  //convert to BioCircos format
  var list = [];
  //console.log("Chrom "); console.log(chromosomesArray[1]);
  for (var i = 0; i < chromosomesArray.length; i++) {

    var chrom = chromosomesArray[i];
    //console.log("Chrom "); console.log(chrom);
    for (var j = 0; j < chrom.positions.length; j++) {

      if (j == chrom.positions.length - 1) {
        list.push({
          chr: chrom.id,
          pos: regionSize * j + (chrom.length % regionSize) / 2,
          value: chrom.positions[j] / (chrom.length - (chrom.length % regionSize) / 2)
        });
      } else {
        list.push({
          chr: chrom.id,
          pos: regionSize * (0.5 + j),
          value: chrom.positions[j] / regionSize
        });
      }

    }
  }
  //console.log("Chrom "); console.log(chromosomesArray[1]);
  return list;

}


function calculateGenomeLength(fasta) {
  var length = 0;
  for (var j = 0; j < fasta.length; j++) {
    length += fasta[j][1];
  }
  return length;
}



function calculateDiffData(chromosome, diffExp) {

  var data = [];

  if (chromosome.end - chromosome.start < 50) {
    for (var j = 0; j < diffExp.length; j++) {

      if (diffExp[j].chr == chromosome.chr) {
        if (chromosome.start == null) {
          if (chromosome.start) {
            diffExp[j].start -= chromosome.start;
            diffExp[j].end -= chromosome.start;
          }
          data.push(diffExp[j]);
        } else if (diffExp[j].start > chromosome.start && diffExp[j].start < chromosome.end) {
          if (diffExp[j].end > chromosome.end) {
            diffExp[j].end = chromosome.end;
          }
          if (chromosome.start) {
            diffExp[j].start -= chromosome.start;
            diffExp[j].end -= chromosome.start;
          }
          data.push(diffExp[j]);
        } else if (diffExp[j].end < chromosome.end && diffExp[j].end > chromosome.start) {
          if (diffExp[j].start < chromosome.start) {
            diffExp[j].start = chromosome.start;
          }
          if (chromosome.start) {
            diffExp[j].start -= chromosome.start;
            diffExp[j].end -= chromosome.start;
          }
          data.push(diffExp[j]);
        }
      }

    }
  } else {
    data = diffBinning.calculateDiffAverage(diffExp, [
      [chromosome.chr, chromosome.end - chromosome.start]
    ], chromosome.end - chromosome.start, chromosome.start, chromosome.end);
  }

  return data;

}

function calculateDiffAverage(diff, fasta, length, start, end) {

  nbDiv = 500
  //console.log("calculateGenomicCoverageAverage, num div = "+nbDiv)
  var regionSize = length / nbDiv;

  var chromosomesArray = [];

  var hasFoundOne = false;

  //Initialize the arrays
  for (var j = 0; j < fasta.length; j++) {

    var positions = [];

    if (start) {
      for (var k = 0; k < nbDiv; k++) {
        positions.push({
          nb: 0,
          value: 0
        });
      }
    } else {
      for (var k = 0; k < fasta[j][1] / regionSize; k++) {

        positions.push({
          nb: 0,
          value: 0
        });
      }

    }
    /*if (fasta[j][1] % regionSize != 0)
      positions.push(0);*/
    chromosomesArray.push({
      id: fasta[j][0],
      positions: positions,
      length: fasta[j][1]

    })
  }

  var index;

  for (var j = 0; j < diff.length; j++) {
    //console.log("Diff Average rows");

    for (var k = 0; k < chromosomesArray.length; k++) {



      if (diff[j].chr == chromosomesArray[k].id) {
        hasFoundOne = true



        if (start) {
          //console.log("aaaaaaaaaaaaa "+diff[j].start+"   "+diff[j].end)
          if ((parseInt(diff[j].start) >= start && parseInt(diff[j].start) <= end) || (parseInt(diff[j].end) <= end && parseInt(diff[j].end) >= start)) {


            var indexStart;
            var indexEnd;

            if (parseInt(diff[j].start) >= start && parseInt(diff[j].end) <= end) {
              indexStart = Math.floor(((parseInt(diff[j].start) - start) / regionSize))
              indexEnd = Math.floor(((parseInt(diff[j].end) - start) / regionSize))
            } else if (parseInt(diff[j].start) >= start) {
              indexStart = Math.floor(((parseInt(diff[j].start) - start) / regionSize))
              indexEnd = chromosomesArray.length - 1;
            } else if (parseInt(diff[j].end) <= end) {
              indexStart = 0;
              indexEnd = Math.floor(((parseInt(diff[j].end) - start) / regionSize))
            } else {}


            //  console.log(indexStart + " / " + indexEnd + " " + chromosomesArray[k].positions.length)
            chromosomesArray[k].positions[indexStart].nb++;
            chromosomesArray[k].positions[indexStart].value += parseFloat(diff[j].value);
            if (indexStart != indexEnd) {
              chromosomesArray[k].positions[indexEnd].nb++;
              chromosomesArray[k].positions[indexEnd].value += parseFloat(diff[j].value);
            }
          }


        } else {


          var indexStart = Math.floor((parseInt(diff[j].start) / regionSize))
          var indexEnd = Math.floor((parseInt(diff[j].end) / regionSize))
          chromosomesArray[k].positions[indexStart].nb++;
          //console.log("diff[j].value " +diff[j].value);
          chromosomesArray[k].positions[indexStart].value += parseFloat(diff[j].value);
          //  console.log("chromosomesArray[k].positions[indexStart].value " +chromosomesArray[k].positions[indexStart].value);
          if (indexStart != indexEnd) {
            chromosomesArray[k].positions[indexEnd].nb++;
            chromosomesArray[k].positions[indexEnd].value += parseFloat(diff[j].value);
          }
        }

        break;
      }

    }
  }



  //convert to BioCircos format
  var list = [];
  var value;
  for (var i = 0; i < chromosomesArray.length; i++) {
    var chrom = chromosomesArray[i];
    for (var j = 0; j < chrom.positions.length; j++) {
      if (chrom.positions[j].nb == 0)
        value = 0;
      else
        value = chrom.positions[j].value / chrom.positions[j].nb;

      if (j == chrom.positions.length - 1) {
        list.push({
          chr: chrom.id,
          start: regionSize * j,
          end: fasta[0][1],
          value: value
        });
      } else {
        list.push({
          chr: chrom.id,
          start: regionSize * j,
          end: regionSize * (j + 1),
          value: value
        });
      }
    }
  }

  //console.log(list)
  if (hasFoundOne)
    return list;
  return null;

}

function calculateAnnotationData(chromosome, annotation) {

  var data = [];

  if (chromosome.length < 50) {
    for (var j = 0; j < annotation.length; j++) {

      if (annotation[j].chr == chromosome.chr && annotation[j].type=="mRNA") {
        if (chromosome.start == null) {
          if (chromosome.start) {
            annotation[j].start -= chromosome.start;
            annotation[j].end -= chromosome.start;
          }
          data.push(annotation[j]);
        } else if (annotation[j].start > chromosome.start && annotation[j].start < chromosome.end) {
          if (annotation[j].end > chromosome.end) {
            annotation[j].end = chromosome.end;
          }
          if (chromosome.start) {
            annotation[j].start -= chromosome.start;
            annotation[j].end -= chromosome.start;
          }
          data.push(annotation[j]);
        } else if (annotation[j].end < chromosome.end && annotation[j].end > chromosome.start) {
          if (annotation[j].start < chromosome.start) {
            annotation[j].start = chromosome.start;
          }
          if (chromosome.start) {
            annotation[j].start -= chromosome.start;
            annotation[j].end -= chromosome.start;
          }
          data.push(diffExp[j]);
        }
      }

    }
  } else {
    data = calculateAnnotationDensity(annotation, [
      [chromosome.chr, chromosome.length]
    ], chromosome.length, chromosome.start, chromosome.end);
  }

  return data;

}

function calculateAnnotationDensity(annotation, fasta, length, start, end) {
  nbDiv = 1000;

  var regionSize = length / nbDiv;

  var chromosomesArray = [];

  var hasFoundOne = false;

  //Initialize the arrays
  for (var j = 0; j < fasta.length; j++) {

    var positions = [];

    if (start) {
      for (var k = 0; k < nbDiv; k++) {
        positions.push({
          genes: 0
        });
      }
    } else {
      for (var k = 0; k < fasta[j][1] / regionSize; k++) {

        positions.push({
          genes: 0
        });
      }

    }
    /*if (fasta[j][1] % regionSize != 0)
      positions.push(0);*/
    chromosomesArray.push({
      id: fasta[j][0],
      positions: positions,
      length: fasta[j][1]

    })
  }

  var index;

  for (var j = 0; j < annotation.length; j++) {
    //  console.log("annotation rows");

    for (var k = 0; k < chromosomesArray.length; k++) {

      if (annotation[j].chr == chromosomesArray[k].id && annotation[j].type=="mRNA") {
        hasFoundOne = true

        if (start) {
          //console.log("aaaaaaaaaaaaa "+diff[j].start+"   "+diff[j].end)
          if ((annotation[j].start >= start && annotation[j].start <= end) || (annotation[j].end <= end && annotation[j].end >= start)) {


            var indexStart;
            var indexEnd;

            if (annotation[j].start >= start && annotation[j].end <= end) {
              indexStart = Math.floor((annotation[j].start - start) / regionSize)
              indexEnd = Math.floor((annotation[j].end - start) / regionSize)
            } else if (annotation[j].start >= start) {
              indexStart = Math.floor((annotation[j].start - start) / regionSize)
              indexEnd = chromosomesArray.length - 1;
            } else if (annotation[j].end <= end) {
              indexStart = 0;
              indexEnd = Math.floor((annotation[j].end - start) / regionSize)
            } else {}

            chromosomesArray[k].positions[indexStart].genes++;
            if (indexStart != indexEnd) {
              chromosomesArray[k].positions[indexEnd].genes++;
            }
          }


        } else {

          var indexStart = Math.floor(annotation[j].start / regionSize);
          var indexEnd = Math.floor(annotation[j].end / regionSize);
          //console.log(chromosomesArray[k].positions[indexStart].genes);
          if (chromosomesArray[k].positions[indexStart]) {
            chromosomesArray[k].positions[indexStart].genes++;
          }
          if (chromosomesArray[k].positions[indexEnd]) {
            if (indexStart != indexEnd) {
              chromosomesArray[k].positions[indexEnd].genes++;
            }
          }
        }

        break;
      }

    }
  }
  for (var i = 0; i < chromosomesArray.length; i++) {

  }
  //convert to BioCircos format
  var list = [];
  var value;

  var max = 0;

  for (var i = 0; i < chromosomesArray.length; i++) {
    var chrom = chromosomesArray[i];
    for (var j = 0; j < chrom.positions.length; j++) {
      //console.log(i+"   "+regionSize+" "+chrom.positions[j].genes)
      if (chrom.positions[j].genes > max) {
        max = chrom.positions[j].genes;
      }
    }
  }

  for (var i = 0; i < chromosomesArray.length; i++) {
    var chrom = chromosomesArray[i];
    for (var j = 0; j < chrom.positions.length; j++) {

      //console.log(chrom.positions[j].genes+"    "+max);


      if (j == chrom.positions.length - 1) {
        list.push({
          chr: chrom.id,
          start: regionSize * j,
          end: fasta[0][1],
          value: chrom.positions[j].genes / max
        });
      } else {
        list.push({
          chr: chrom.id,
          start: regionSize * j,
          end: regionSize * (j + 1),
          value: chrom.positions[j].genes / max
        });
      }
    }
  }

  if (hasFoundOne)
    return list;
  return null;

}
