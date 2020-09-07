var fastaModule = require("./fasta");
var mongo = require("mongodb");
var mongoUtil = require("./mongoUtil")

var nbDiv = 1000;
genesPresent: boolean = false;
enhancersPresent: boolean = false;
promotersPresent: boolean = false;
TF_binding_sitesPresent: boolean = false;
exonsPresent: boolean = false;
tRNAsPresent: boolean = false;
operonsPresent: boolean = false;
five_prime_UTRsPresent = false;



var setAnnotationBins = function(file, fasta, filesUploading,callback) {

  fastaModule.getFasta(fasta, function(fasta) { //retrieve FASTA file

    var data = {};
    fasta = fasta.data
    var genomeLength = calculateGenomeLength(fasta);

    var regionSize = genomeLength / nbDiv;
    var chromosomesArray = [];

    var chromosomeBins = {}

    for (var j = 0; j < fasta.length; j++) { //for each chromosome in FASTA file

      var positions = [];

      for (var k = 0; k < fasta[j][1] / regionSize; k++) { // iterating through all chromosomes and through their length i.e. fasta[j][1]

        positions.push({ // for genome view, positions is the array that stores all the bins {} this object is one bin
          genes: 0,
          enhancers: 0,
          exons: 0,
          operons: 0,
          TF_binding_sites: 0,
          promoters: 0,
          tRNAs: 0,
          five_prime_UTRs: 0


          // exons: 0,
          // introns: 0,
          // UTRs: 0,
          // unspecifiedRegions: 0

        });
      }

      var chromosomePositions = [];

      for (var k = 0; k < nbDiv; k++) { //nbDiv=1000, chromosomePositions is the array that contains all my bins for chromosome view,
        chromosomePositions.push({
          genes: 0,
          enhancers: 0,
          exons: 0,
          operons: 0,
          TF_binding_sites: 0,
          promoters: 0,
          tRNAs: 0,
          five_prime_UTRs: 0


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
      format: "annotation",
      regionSize: regionSize,
      chromosomePositions: chromosomeBins //bins for the indiviual chromosomes view
    };



    callback();
  });

}

var updateAnnotationBins = function(file, data, lastBin, filesUploading) {

  var chromosomesArray = filesUploading[file].chromosomesArray;
  var regionSize = filesUploading[file].regionSize;

  var indiviualChromosomes = filesUploading[file].chromosomePositions;

  var index;

  var arrayIds = []
  for (var k = 0; k < chromosomesArray.length; k++) {
    arrayIds.push(chromosomesArray[k].id)
  }

  for (var j = 0; j < data.length; j++) { //data is the chunk, here you iterate through each annotation in the chunk


    for (var k = 0; k < chromosomesArray.length; k++) { //chromosomesArray contains all chromosomes. Here, the idea is to match the annotation to its correct chromosome in the database


      if (data[j].chr == chromosomesArray[k].id) { // if the match is found i.e. chromosome number matches the chromosome ID that the row corresponds to
        if(data[j].chr=="1"){
          console.log('aaaaaaa')
        }


        if (parseInt(data[j].end) < chromosomesArray[k].length) { //if the end position of the row is less than the chromosome length
          hasFoundOne = true



          //GENOME VIEW
          var indexStart = Math.floor((parseInt(data[j].start) / regionSize)); //you need to find the index of the bin that will contain the row
          var indexEnd = Math.floor((parseInt(data[j].end) / regionSize));


          for (var l = indexStart; l <= indexEnd; l++) { //to check how many bins this particular annotation is spanning
            if (data[j].type == "mRNA")
            chromosomesArray[k].positions[l].genes++; // then increment the counter so you know how many bins to give it/add more counters here - ZS
            else if (data[j].type == "enhancer")
            chromosomesArray[k].positions[l].enhancers++;
            else if (data[j].type == "promoter")
            chromosomesArray[k].positions[l].promoters++;
            else if (data[j].type == "exon")
            chromosomesArray[k].positions[l].exons++;
            else if (data[j].type == "operon")
            chromosomesArray[k].positions[l].operons++;
            else if (data[j].type == "TF_binding_site")
            chromosomesArray[k].positions[l].TF_binding_sites++;
            else if (data[j].type == "tRNA")
            chromosomesArray[k].positions[l].tRNAs++;
            else if (data[j].type == "five_prime_UTR")
            chromosomesArray[k].positions[l].five_prime_UTRs++;

          }

          //CHROMOSOME VIEW
          var chromosomeBins = indiviualChromosomes[data[j].chr].positions;
          var chromRegionSize = indiviualChromosomes[data[j].chr].regionSize;



          indexStart = Math.floor((parseInt(data[j].start) / chromRegionSize));
          indexEnd = Math.floor((parseInt(data[j].end) / chromRegionSize));
          if (indexEnd<chromosomeBins.length){
          for (var l = indexStart; l <= indexEnd; l++) {

            //chromosomeBins[l].genes++;
            if (data[j].type == "mRNA")
            chromosomeBins[l].genes++; // then increment the counter so you know how many bins to give it/add more counters here - ZS
            else if (data[j].type == "enhancer")
            chromosomeBins[l].enhancers++;
            else if (data[j].type == "promoter")
            chromosomeBins[l].promoters++;
            else if (data[j].type == "exon")
            chromosomeBins[l].exon++;
            else if (data[j].type == "operon")
            chromosomeBins[l].operons++;
            else if (data[j].type == "TF_binding_site")
            chromosomeBins[l].TF_binding_sites++;
            else if (data[j].type == "tRNA")
            chromosomeBins[l].tRNAs++;
            else if (data[j].type == "five_prime_UTR")
            chromosomeBins[l].five_prime_UTRs++;

          }
          }


        }

        break;
      }

    }
  }


  if (lastBin) {
    serializeAnnotationBins(file, filesUploading);
  }

}

var serializeAnnotationBins = function(file, filesUploading) {


  var list = [];
  var chromosomesArray = filesUploading[file].chromosomesArray;
  var regionSize = filesUploading[file].regionSize;
  var value;





  for (var i = 0; i < chromosomesArray.length; i++) { //iterate through all the chromosomes, all the bins; so that you can persist the whole bin which contains the start and end of the bin itself, chromosome ID,
    var chrom = chromosomesArray[i];
    for (var j = 0; j < chrom.positions.length; j++) {

//HERE IS WHERE YOUR REAL WORK STARTS
//value is a value between 0 and 1, this is used to display a heatmap
      if (j == chrom.positions.length - 1) {
        list.push({
          chr: chrom.id,
          start: regionSize * j,
          end: chrom.length - 1,
          genes: chrom.positions[j].genes,
          enhancers: chrom.positions[j].enhancers,
          polyA_sites: chrom.positions[j].exons,
          operons: chrom.positions[j].operons,
          TF_binding_sites: chrom.positions[j].TF_binding_sites,
          promoters: chrom.positions[j].promoters,
          tRNAs: chrom.positions[j].tRNAs,
          five_prime_UTRs: chrom.positions[j].five_prime_UTRs

        });
      } else {
        list.push({ //this is one of the elements of the content of data.annotation.data from BioCircos]
          chr: chrom.id,
          start: regionSize * j,
          end: regionSize * (j + 1),
          genes: chrom.positions[j].genes,
          enhancers: chrom.positions[j].enhancers,
          polyA_sites: chrom.positions[j].exons,
          operons: chrom.positions[j].operons,
          TF_binding_sites: chrom.positions[j].TF_binding_sites,
          promoters: chrom.positions[j].promoters,
          tRNAs: chrom.positions[j].tRNAs,
          five_prime_UTRs: chrom.positions[j].five_prime_UTRs

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
      format: "annotation",
      chr: "all"
    }, function(err, result) {
      //console.log(file);
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
              start: regionSize * j,
              end: length - 1,
              //value: positions[j].genes / max
              genes: positions[j].genes,
              enhancers: positions[j].enhancers ,
              polyA_sites: positions[j].polyA_sites ,
              operons: positions[j].operons ,
              TF_binding_sites: positions[j].TF_binding_sites,
              promoters: positions[j].promoters,
              tRNAs: positions[j].tRNAs,
              five_prime_UTRs: positions[j].five_prime_UTRs

            });
          } else {0
            list.push({
              chr: key,
              start: regionSize * j,
              end: regionSize * (j + 1),
              //value: positions[j].genes / max
              genes: positions[j].genes,
              enhancers: positions[j].enhancers,
              polyA_sites: positions[j].polyA_sites,
              operons: positions[j].operons,
              TF_binding_sites: positions[j].TF_binding_sites,
              promoters: positions[j].promoters,
              tRNAs: positions[j].tRNAs,
              five_prime_UTRs: positions[j].five_prime_UTRs
            });
          }
        }
        chromosomesBinsToInsert.push({
          file: mongo.ObjectID(file),
          data: list,
          format: "annotation",
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

var calculateAnnotationDensity = function(annotation, fasta, length, start, end) {


  var regionSize = length / nbDiv;

  var chromosomesArray = [];

  var hasFoundOne = false;

  //Initialize the arrays

  var positions = [];


  for (var i = 0; i < fasta[0][1] / regionSize; i++) {

    positions.push({
      genes: 0,
      enhancers: 0,
      exons: 0,
      operons: 0,
      TF_binding_sites: 0,
      promoters: 0,
      tRNAs: 0,
      five_prime_UTRs: 0
    });
  }

  var chromosome = {
    id: fasta[0][0],
    positions: positions,
    length: fasta[0][1]
  };


  var index;

  for (var j = 0; j < annotation.length; j++) {


    if ((parseInt(annotation[j].start) >= start && parseInt(annotation[j].start) <= end) || (parseInt(annotation[j].end) <= end && parseInt(annotation[j].end) >= start)) {


      var indexStart;
      var indexEnd;

      if (parseInt(annotation[j].start) >= start && parseInt(annotation[j].end) <= end) {
        indexStart = Math.floor(((parseInt(annotation[j].start) - start) / regionSize))
        indexEnd = Math.floor(((parseInt(annotation[j].end) - start) / regionSize))

      } else if (parseInt(annotation[j].start) >= start) {
        indexStart = Math.floor(((parseInt(annotation[j].start) - start) / regionSize))
        indexEnd = chromosome.positions.length - 1;
      } else if (parseInt(annotation[j].end) <= end) {
        indexStart = 0;
        indexEnd = Math.floor(((parseInt(annotation[j].end) - start) / regionSize))
      } else {}


      for (var k = indexStart; k <= indexEnd; k++) {
        //chromosome.positions[k].genes++;
        if (annotation[j].type == "mRNA")
        chromosome.positions[k].genes++; // then increment the counter so you know how many bins to give it/add more counters here - ZS
        else if (annotation[j].type == "enhancer")
        chromosome.positions[k].enhancers++;
        else if (annotation[j].type == "promoter")
        chromosome.positions[k].promoters++;
        else if (annotation[j].type == "exon")
        chromosome.positions[k].exons++;
        else if (annotation[j].type == "operon")
        chromosome.positions[k].operons++;
        else if (annotation[j].type == "TF_binding_site")
        chromosome.positions[k].TF_binding_sites++;
        else if (annotation[j].type == "tRNA")
        chromosome.positions[k].tRNAs++;
        else if (annotation[j].type == "five_prime_UTR")
        chromosome.positions[k].five_prime_UTRs++;

      }


    }

  }

  //convert to BioCircos format
  var list = [];

  //var max = 0;


  for (var j = 0; j < chromosome.positions.length; j++) {


    if (j == chromosome.positions.length - 1) {
      list.push({
        chr: chromosome.id,
        start: regionSize * j ,
        end: fasta[0][1],
        //value: chromosome.positions[j].genes / max
        genes: chromosome.positions[j].genes ,
        enhancers: chromosome.positions[j].enhancers ,
        polyA_sites: chromosome.positions[j].exons,
        operons: chromosome.positions[j].operons,
        TF_binding_sites: chromosome.positions[j].TF_binding_sites,
        promoters: chromosome.positions[j].promoters,
        tRNAs: chromosome.positions[j].tRNAs,
        five_prime_UTRs: chromosome.positions[j].five_prime_UTRs

      });
    } else {
      list.push({
        chr: chromosome.id,
        start: regionSize * j,
        end: regionSize * (j + 1),
        //value: chromosome.positions[j].genes / max
        genes: chromosome.positions[j].genes,
        enhancers: chromosome.positions[j].enhancers,
        polyA_sites: chromosome.positions[j].polyA_siexonstes,
        operons: chromosome.positions[j].operons,
        TF_binding_sites: chromosome.positions[j].TF_binding_sites,
        promoters: chromosome.positions[j].promoters,
        tRNAs: chromosome.positions[j].tRNAs,
        five_prime_UTRs: chromosome.positions[j].five_prime_UTRs

      });
    }
  }


  return list;


}


module.exports = {
  setAnnotationBins: setAnnotationBins,
  updateAnnotationBins: updateAnnotationBins,
  serializeAnnotationBins: serializeAnnotationBins,
  calculateGenomeLength: calculateGenomeLength,
  calculateAnnotationDensity: calculateAnnotationDensity
}
