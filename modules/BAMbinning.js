var fastaModule = require("./fasta");
var mongo = require("mongodb");
var mongoUtil=require("./mongoUtil")


var nbDiv=1000;

var setBAMbins = function(file, fasta, filesUploading,callback) {

  fastaModule.getFasta(fasta, function(fasta) {
    var data = {};
    fasta = fasta.data;
    var genomeLength = calculateGenomeLength(fasta);

    var regionSize = genomeLength / nbDiv;
    console.log("BAM bins size : " + regionSize +" and nbDiv "+nbDiv)
    var chromosomesArray = [];

    var chromosomeBins = {}
    //Initialize the arrays
    for (var j = 0; j < fasta.length; j++) {
      var positions = [];

      for (var k = 0; k < fasta[j][1] / regionSize; k++) {
        positions.push(0);
      }

      var chromosomePositions = [];

      for (var k = 0; k < nbDiv; k++) {
        chromosomePositions.push(0);
      }

      chromosomeBins[fasta[j][0]] = {
        positions: chromosomePositions,
        regionSize: fasta[j][1] / nbDiv,
        length: fasta[j][1]
      }
    /*  console.log(chromosomeBins[fasta[j][0]].length);
      console.log(chromosomeBins[fasta[j][0]].regionSize);
      console.log(chromosomeBins[fasta[j][0]].positions.length);*/


      /*if (fasta[j][1] % regionSize != 0)
        positions.push(0);*/
      chromosomesArray.push({
        id: fasta[j][0],
        positions: positions,
        length: fasta[j][1]

      })
      //console.log(chromosomesArray[j].id + " " + chromosomesArray[j].positions.length )
    }
    //console.log("chromosomeBins "+chromosomeBins[fasta[0][0]]);

    filesUploading[file] = {
      chromosomesArray: chromosomesArray, //bins for the all genome view
      format: "genomicCov",
      regionSize: regionSize,
      chromosomePositions: chromosomeBins //bins for the indiviual chromosomes view
    };
    callback();
  });
}

var updateBAMbins = function(file, data, lastChunk, filesUploading) {
  //console.log("updateBAMbins, file ="+file);
  //console.log("filesUploading = "+filesUploading);
  console.log("updateBAMbins")
  if (!filesUploading || !file ){
     console.log("Problem with filesUploading");
     return;
   }
   if(!filesUploading[file]){
     console.log(" problem filesUploading[files]")
     return;
   }
   console.log("Data size : " + data.length )

  var chromosomesArray = filesUploading[file].chromosomesArray;
  var regionSize = filesUploading[file].regionSize;

  var indiviualChromosomes = filesUploading[file].chromosomePositions;
  //console.log(data.length);
  for (var j = 0; j < data.length; j++) {
    for (var k = 0; k < chromosomesArray.length; k++) {

      if (data[j].chr == chromosomesArray[k].id && data[j].pos < chromosomesArray[k].length) {
        chromosomesArray[k].positions[Math.floor(data[j].pos / regionSize)]+=data[j].value;

        var chromosomeBins = indiviualChromosomes[data[j].chr].positions;

        var chromRegionSize = indiviualChromosomes[data[j].chr].regionSize;


        chromosomeBins[Math.floor(data[j].pos / chromRegionSize)]+=data[j].value;
        /*console.log(Math.floor(data[j].pos))
        console.log(chromRegionSize)
        console.log(Math.floor(data[j].pos / chromRegionSize));
        console.log(chromosomeBins[Math.floor(data[j].pos / chromRegionSize)]);*/
        break;
      }
    }
  }
  console.log("finished")
  if (lastChunk) {
    serializeBAMbins(file, filesUploading);
  }

}

var serializeBAMbins = function(file, filesUploading) {
  console.log("serializingBAMbins")
  var list = [];
  var chromosomesArray = filesUploading[file].chromosomesArray;
  var regionSize = filesUploading[file].regionSize;
  for (var i = 0; i < chromosomesArray.length; i++) {

    var chrom = chromosomesArray[i];
    console.log(chrom.positions.length + ' '+chrom.id);
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


  mongoUtil.connectToServer(function(err) {
    if (err) throw err;
    var db = mongoUtil.getDb();
    var dbo = db.db("webcircos");
    dbo.collection("bins").insertOne({ //insert the bins for the whole genome view
      data: list,
      file: mongo.ObjectID(file),
      format: "genomicCov",
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
              pos: regionSize * j + (length % regionSize) / 2,
              value: positions[j] / (length - (length % regionSize) / 2)
            });
          } else {
            list.push({
              chr: key,
              pos: regionSize * (0.5 + j),
              value: positions[j] / regionSize
            });
          }

        }
        chromosomesBinsToInsert.push({
          file: mongo.ObjectID(file),
          data: list,
          format: "genomicCov",
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

var calculateBAMDensity = function(genomicCov, fasta, genomeLength, start, end) {


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


    /*if (fasta[j][1] % regionSize != 0)
      positions.push(0);*/
    chromosomesArray.push({
      id: fasta[j][0],
      positions: positions,
      length: fasta[j][1]

    })
  }



  for (var j = 0; j < genomicCov.length; j++) {
    for (var k = 0; k < chromosomesArray.length; k++) {

      if (genomicCov[j].chr == chromosomesArray[k].id && (start == null || (genomicCov[j].pos > start &&
          genomicCov[j].pos < end))) {

        if (start) {
          chromosomesArray[k].positions[Math.floor((genomicCov[j].pos - start) / regionSize)]+=genomicCov[j].value;
        } else {
          chromosomesArray[k].positions[Math.floor(genomicCov[j].pos / regionSize)]+=genomicCov[j].value;
        }
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
          pos: parseFloat(regionSize * j + (chrom.length % regionSize) / 2),
          value: chrom.positions[j] / (chrom.length - (chrom.length % regionSize) / 2)
        });
      } else {
        list.push({
          chr: chrom.id,
          pos: parseFloat(regionSize * (0.5 + j)),
          value: chrom.positions[j] / regionSize
        });
      }

    }
  }

  return list;

}

module.exports = {
  setBAMbins:setBAMbins,
  updateBAMbins:updateBAMbins,
  serializeBAMbins:serializeBAMbins,
  calculateGenomeLength:calculateGenomeLength,
  calculateBAMDensity:calculateBAMDensity
}
