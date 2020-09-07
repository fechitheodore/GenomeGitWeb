var fastaModule = require("./fasta");
var mongo = require("mongodb");
var mongoUtil = require("./mongoUtil")

var nbDiv = 1000;

var setDiffBins = function(file, fasta, filesUploading,callback) {


  fastaModule.getFasta(fasta, function(fasta) {
    var data = {};
    fasta = fasta.data
    var genomeLength = calculateGenomeLength(fasta);

    var regionSize = genomeLength / nbDiv;
    var chromosomesArray = [];

    var chromosomeBins = {}


    for (var j = 0; j < fasta.length; j++) {

      var positions = [];

      for (var k = 0; k < fasta[j][1] / regionSize; k++) {

        positions.push({
          nb: 0,
          value: 0
        });
      }

      var chromosomePositions = [];

      for (var k = 0; k < nbDiv; k++) {
        chromosomePositions.push({
          nb: 0,
          value: 0
        });
      }

      chromosomeBins[fasta[j][0]] = {
        positions: chromosomePositions,
        regionSize: fasta[j][1] / nbDiv,
        length: fasta[j][1]
      }


      chromosomesArray.push({
        id: fasta[j][0],
        positions: positions,
        length: fasta[j][1]

      })
    }


    filesUploading[file] = {
      chromosomesArray: chromosomesArray, //bins for the all genome view
      format: "diffExp",
      regionSize: regionSize,
      chromosomePositions: chromosomeBins //bins for the indiviual chromosomes view
    };
      callback();
  });
}

var updateDiffBins = function(file, data, lastChunk, filesUploading) {

  console.log("updateDiffbins")
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


  var index;

  for (var j = 0; j < data.length; j++) {

    for (var k = 0; k < chromosomesArray.length; k++) {

      if (data[j].chr == chromosomesArray[k].id) {
        if (parseInt(data[j].end) < chromosomesArray[k].length) {
          hasFoundOne = true

          var indexStart = Math.floor((parseInt(data[j].start) / regionSize));
          var indexEnd = Math.floor((parseInt(data[j].end) / regionSize));


          for (var l = indexStart; l <= indexEnd; l++) {
            chromosomesArray[k].positions[l].nb++;
            chromosomesArray[k].positions[l].value += parseFloat(data[j].value);
          }


          var chromosomeBins = indiviualChromosomes[data[j].chr].positions;
          var chromRegionSize = indiviualChromosomes[data[j].chr].regionSize;





          indexStart = Math.floor((parseInt(data[j].start) / chromRegionSize));
          indexEnd = Math.floor((parseInt(data[j].end) / chromRegionSize));


          for (var l = indexStart; l <= indexEnd; l++) {
            chromosomeBins[l].nb++;
            chromosomeBins[l].value += parseFloat(data[j].value);
          }
        }
        break;
      }
    }
  }


  if (lastChunk) {
    serializeDiffBins(file, filesUploading);
  }

}

var serializeDiffBins = function(file, filesUploading) {


  var list = [];
  var chromosomesArray = filesUploading[file].chromosomesArray;
  var regionSize = filesUploading[file].regionSize;
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
          end: chrom.length - 1,
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

  mongoUtil.connectToServer(function(err) {
    if (err) throw err;
    var db = mongoUtil.getDb();
    var dbo = db.db("webcircos");
    dbo.collection("bins").insertOne({ //insert the bins for the whole genome view
      data: list,
      file: mongo.ObjectID(file),
      format: "diffExp",
      chr: "all"
    }, function(err, result) {

      if (!filesUploading || !file ){
         console.log("Problem with filesUploading");
         return;
       }
       if(!filesUploading[file]){
         console.log(" problem filesUploading[files]")
         return;
       }

      var indiviualChromosomes = filesUploading[file].chromosomePositions;

      var chromosomesBinsToInsert = [];

      for (var key in indiviualChromosomes) {

        if (!indiviualChromosomes.hasOwnProperty(key)) continue;


        var positions = indiviualChromosomes[key].positions;
        var regionSize = indiviualChromosomes[key].regionSize;


        var length = indiviualChromosomes[key].length;
        var list = [];
        for (var j = 0; j < positions.length; j++) {

          if (positions[j].nb == 0)
            value = 0;
          else
            value = positions[j].value / positions[j].nb;

          if (j == positions.length - 1) {
            list.push({
              chr: key,
              start: regionSize * j,
              end: length - 1,
              value: value
            });
          } else {
            list.push({
              chr: key,
              start: regionSize * j,
              end: regionSize * (j + 1),
              value: value
            });
          }
        }
        chromosomesBinsToInsert.push({
          file: mongo.ObjectID(file),
          data: list,
          format: "diffExp",
          chr: key
        });
      }

      dbo.collection("bins").insert(chromosomesBinsToInsert, function(err, result) {
        if (err) throw err;
        db.close();
        delete filesUploading[file]; //remove the bins from memory once inserted in the database
      });

    })
  });


}

var calculateGenomeLength = function(fasta) {
  var length = 0;
  for (var j = 0; j < fasta.length; j++) {
    length += fasta[j][1];
  }
  return length;
}

var calculateDiffAverage = function(diffExp, fasta, length, start, end) {



  var regionSize = length / nbDiv;

  var chromosomesArray = [];

  var hasFoundOne = false;

  //Initialize the arrays

  var positions = [];


  for (var i = 0; i < fasta[0][1] / regionSize; i++) {

    positions.push({
      nb: 0,
      value: 0
    });
  }

  var chromosome = {
    id: fasta[0][0],
    positions: positions,
    length: fasta[0][1]
  };


  var index;

  for (var j = 0; j < diffExp.length; j++) {

    if ((parseInt(diffExp[j].start) >= start && parseInt(diffExp[j].start) <= end) || (parseInt(diffExp[j].end) <= end && parseInt(diffExp[j].end) >= start)) {


      var indexStart;
      var indexEnd;

      if (parseInt(diffExp[j].start) >= start && parseInt(diffExp[j].end) <= end) {
        indexStart = Math.floor(((parseInt(diffExp[j].start) - start) / regionSize))
        indexEnd = Math.floor(((parseInt(diffExp[j].end) - start) / regionSize))

      } else if (parseInt(diffExp[j].start) >= start) {
        indexStart = Math.floor(((parseInt(diffExp[j].start) - start) / regionSize))
        indexEnd = chromosome.positions.length - 1;
      } else if (parseInt(diffExp[j].end) <= end) {
        indexStart = 0;
        indexEnd = Math.floor(((parseInt(diffExp[j].end) - start) / regionSize))
      } else {}

    //  console.log(chromosome.positions.length, indexStart, indexEnd)

      for (var k = indexStart; k < indexEnd; k++) {
        chromosome.positions[k].nb++;
        chromosome.positions[k].value += parseFloat(diffExp[j].value);
      }


    }

  }

  //convert to BioCircos format
  var list = [];
  var value;




  for (var j = 0; j < chromosome.positions.length; j++) {

    if (chromosome.positions[j].nb == 0)
      value = 0;
    else
      value = chromosome.positions[j].value / chromosome.positions[j].nb;

    if (j == chromosome.positions.length - 1) {
      list.push({
        chr: chromosome.id,
        start: regionSize * j,
        end: fasta[0][1],
        value: value
      });
    } else {
      list.push({
        chr: chromosome.id,
        start: regionSize * j,
        end: regionSize * (j + 1),
        value: value
      });
    }
  }

  return list;


}


module.exports = {
  setDiffBins: setDiffBins,
  updateDiffBins: updateDiffBins,
  serializeDiffBins: serializeDiffBins,
  calculateGenomeLength: calculateGenomeLength,
  calculateDiffAverage: calculateDiffAverage
}
