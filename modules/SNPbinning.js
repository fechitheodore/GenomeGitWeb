var fastaModule = require("./fasta");
var mongo = require("mongodb");
var mongoUtil = require("./mongoUtil")


var nbDiv = 1000;

var setSNPbins = function(file, fasta, filesUploading, callback) {



  fastaModule.getFasta(fasta, function(fasta) {
    var data = {};
    fasta = fasta.data
    var genomeLength = calculateGenomeLength(fasta);

    var regionSize = genomeLength / nbDiv;
    var chromosomesArray = [];

    var chromosomeBins = {}
    //Initialize the arrays
    for (var j = 0; j < fasta.length; j++) {
      var positions = [];

      for (var k = 0; k < fasta[j][1] / regionSize; k++) {
        positions.push({
          all: 0,
          homo: 0
        });
      }

      var chromosomePositions = [];

      for (var k = 0; k < nbDiv; k++) {
        chromosomePositions.push({
          all: 0,
          homo: 0
        });
      }

      chromosomeBins[fasta[j][0]] = {
        positions: chromosomePositions,
        regionSize: fasta[j][1] / nbDiv,
        length: fasta[j][1]
      }

      /*if (fasta[j][1] % regionSize != 0)
        positions.push(0);*/
      chromosomesArray.push({
        id: fasta[j][0],
        positions: positions,
        length: fasta[j][1]

      })
    }

    filesUploading[file] = {
      chromosomesArray: chromosomesArray, //bins for the all genome view
      format: "vcf",
      regionSize: regionSize,
      chromosomePositions: chromosomeBins //bins for the indiviual chromosomes view
    };
    callback();
  });
}

var updateSNPbins = function(file, data, lastChunk, filesUploading) {
  var chromosomesArray = filesUploading[file].chromosomesArray;
  var regionSize = filesUploading[file].regionSize;

  var indiviualChromosomes = filesUploading[file].chromosomePositions;
  var bin;
  for (var j = 0; j < data.length; j++) {
    for (var k = 0; k < chromosomesArray.length; k++) {

      if (data[j].chr == chromosomesArray[k].id) {
        if (Math.floor(data[j].pos / regionSize) < chromosomesArray[k].positions.length) {
          chromosomesArray[k].positions[Math.floor(data[j].pos / regionSize)].all++;
          if (data[j].homo > 0.75) {
            chromosomesArray[k].positions[Math.floor(data[j].pos / regionSize)].homo++;
          }

          var chromosomeBins = indiviualChromosomes[data[j].chr].positions;
          var chromRegionSize = indiviualChromosomes[data[j].chr].regionSize;

          bin = Math.floor(data[j].pos / chromRegionSize);
          if (bin < nbDiv) {
            chromosomeBins[bin].all++;
            if (data[j].homo > 0.75) {
              chromosomeBins[bin].homo++;
            }
          }
        }
        break;
      }
    }
  }

  if (lastChunk) {
    serializeSNPbins(file, filesUploading);
  }

}

var serializeSNPbins = function(file, filesUploading) {

  var list = [];
  var chromosomesArray = filesUploading[file].chromosomesArray;
  var regionSize = filesUploading[file].regionSize;
  for (var i = 0; i < chromosomesArray.length; i++) {

    var chrom = chromosomesArray[i];



    for (var j = 0; j < chrom.positions.length; j++) {

      if (j == chrom.positions.length - 1) {
        list.push({
          chr: chrom.id,
          start: Math.floor(regionSize * j),
          end: Math.floor(regionSize * j + (chrom.length % regionSize)),
          name: "",
          value: chrom.positions[j].all, // / (chrom.length - (chrom.length % regionSize) / 2)
          homo: chrom.positions[j].homo
        });
      } else {
        list.push({
          chr: chrom.id,
          start: Math.floor(regionSize * j),
          end: Math.floor(regionSize * (1 + j)),
          name: "",
          value: chrom.positions[j].all, // / regionSize
          homo: chrom.positions[j].homo
        });
      }
    }

  }


  mongoUtil.connectToServer(function(err) {
    if (err) throw err;
    var db = mongoUtil.getDb();
    var dbo = db.db("webcircos");
    dbo.collection("bins").insertOne({ //insert the bins for the whole genome view
      data: list,
      file: mongo.ObjectID(file),
      format: filesUploading[file].format,
      chr: "all"
    }, function(err, result) {

      var indiviualChromosomes = filesUploading[file].chromosomePositions;

      var chromosomesBinsToInsert = [];

      for (var key in indiviualChromosomes) {

        if (!indiviualChromosomes.hasOwnProperty(key)) continue;

        var positions = indiviualChromosomes[key].positions;
        var regionSize = indiviualChromosomes[key].regionSize;
        var length = indiviualChromosomes[key].length;
        var list = [];
        for (var j = 0; j < positions.length; j++) {

          if (j == positions.length - 1) {
            list.push({
              chr: key,
              start: Math.floor(regionSize * j),
              end: Math.floor(regionSize * j + (length % regionSize)),
              name: "",
              value: positions[j].all, // / (length - (length % regionSize) / 2)
              homo: positions[j].homo
            });
          } else {
            list.push({
              chr: key,
              start: Math.floor(regionSize * j),
              end: Math.floor(regionSize * (j + 1)),
              name: "",
              value: positions[j].all, // / regionSize
              homo: positions[j].homo
            });
          }

        }
        chromosomesBinsToInsert.push({
          file: mongo.ObjectID(file),
          data: list,
          format: "vcf",
          chr: key
        });
      }

      dbo.collection("bins").insert(chromosomesBinsToInsert, function(err, result) {
        if (err) throw err;
        db.close();
        delete filesUploading[file]; //remove the bins from memory once inserted in the database
      });

    });
  });

}

var calculateGenomeLength = function(fasta) {
  var length = 0;
  for (var j = 0; j < fasta.length; j++) {
    length += fasta[j][1];
  }
  return length;
}

var calculateSNPDensity = function(vcf, fasta, length, start, end) {

  var regionSize = length / nbDiv;

  var chromosomesArray = [];

  //Initialize the arrays
  for (var j = 0; j < fasta.length; j++) {
    var positions = [];

    if (start) {
      for (var k = 0; k < nbDiv; k++) {
        positions.push({
          all: 0,
          homo: 0
        });
      }
    } else {
      for (var k = 0; k < fasta[j][1] / regionSize; k++) {
        positions.push({
          all: 0,
          homo: 0
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
  for (var j = 0; j < vcf.length; j++) {
    for (var k = 0; k < chromosomesArray.length; k++) {
      index = Math.floor((vcf[j].pos - start) / regionSize)
      chromosomesArray[k].positions[index].all++;
      if (vcf[j].homo >= 0.75) {
        chromosomesArray[k].positions[index].homo++;
      }
    }
  }


  //convert to BioCircos format
  var list = [];
  for (var i = 0; i < chromosomesArray.length; i++) {

    var chrom = chromosomesArray[i];

    for (var j = 0; j < chrom.positions.length; j++) {

      if (j == chrom.positions.length - 1) {
        list.push({
          chr: chrom.id,
          start: regionSize * j,
          end: regionSize * j + (length % regionSize),
          value: chrom.positions[j].all,
          homo: chrom.positions[j].homo
        });
      } else {
        list.push({
          chr: chrom.id,
          start: regionSize * j,
          end: regionSize * (j + 1),
          value: chrom.positions[j].all,
          homo: chrom.positions[j].homo
        });
      }
    }
  }
  return list;
}

module.exports = {
  setSNPbins: setSNPbins,
  updateSNPbins: updateSNPbins,
  serializeSNPbins: serializeSNPbins,
  calculateGenomeLength: calculateGenomeLength,
  calculateSNPDensity: calculateSNPDensity
}
