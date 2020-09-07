parsers = function() {
  var parsers = {
    version: "1.0"
  };


  parsers.canReadNext = true;
  parsers.lengthChromosome;

  parsers.resultBam;
  var countline = 0;

  parsers.parseFile = function(file, nextLoad, format, header, callback, onError, chromosomeSignature) {

    var mistake_found = false;
    var _this = this;
    var extension = file.name.split('.');
    extension = extension[extension.length - 1];

    var result = {
      format: "",
      data: {}
    };

    var maxChunk = 5000;

    switch (format) {

      case "fasta":
        {
          result.format = "fasta";
          readParseByChunkFASTA(file, maxChunk, chromosomeSignature, function(name, length, lineLength, lastChunk, chromosomeSignature) {

            result.data = _this.parse_fasta(name, length, lineLength, onError, chromosomeSignature);
            result.sizeUploaded = length;
            result.lastChunk = lastChunk;
            //console.log(result.data)
            if (result.data || result.lastChunk) {
              callback(result);
            }
          });
          break;
        }
      case "fa":
        {
          result.format = "fasta";
          readParseByChunkFASTA(file, maxChunk, chromosomeSignature, function(name, sizeUploaded, lastChunk, chromosomeSignature) {
            result.data = _this.parse_fasta(name, length, lineLength, onError, chromosomeSignature);
            result.sizeUploaded = sizeUploaded;
            result.lastChunk = lastChunk;
            //console.log(result.data)

            if (result.data || result.lastChunk) {
              callback(result);
            }
          });
          break;
        }
      case "gff3":
        {
          result.format = "annotation";
          readParseByChunk(file, maxChunk, function(chunk, sizeUploaded, lastChunk) {
            result.data = _this.parse_GFF_GTF(chunk, onError);
            result.sizeUploaded = sizeUploaded;
            result.lastChunk = lastChunk;
            callback(result);
          });
          break;
        }
      case "gff2":
        {
          result.format = "annotation";
          readParseByChunk(file, maxChunk, function(chunk, sizeUploaded, lastChunk) {
            result.data = _this.parse_GFF_GTF(chunk, onError);
            result.sizeUploaded = sizeUploaded;
            result.lastChunk = lastChunk;
            callback(result);
          });
          break;
        }
      case "annotation":
        {
          result.format = "annotation";
          readParseByChunk(file, maxChunk, function(chunk, sizeUploaded, lastChunk) {
            result.data = _this.parse_GFF_GTF(chunk, onError);
            result.sizeUploaded = sizeUploaded;
            result.lastChunk = lastChunk;
            callback(result);
          });
          break;
        }
      case "gtf":
        {
          result.format = "annotation";
          readParseByChunk(file, maxChunk, function(chunk, sizeUploaded, lastChunk) {
            result.data = _this.parse_GFF_GTF(chunk, onError);
            result.sizeUploaded = sizeUploaded;
            result.lastChunk = lastChunk;
            callback(result);
          });
          break;
        }
      case "diff":
        {
          result.format = "diff";
          readParseByChunk(file, maxChunk, function(chunk, sizeUploaded, lastChunk) {
            result.data = _this.parse_DIFF(chunk, 0.05, onError);
            result.sizeUploaded = sizeUploaded;
            result.lastChunk = lastChunk;
            callback(result);
          });
          break;
        }
      case "de":
        {
          result.format = "de";
          readParseByChunk(file, maxChunk, function(chunk, sizeUploaded, lastChunk) {
            result.data = _this.parse_GeneMat(chunk, "Real", onError);
            result.sizeUploaded = sizeUploaded;
            result.lastChunk = lastChunk;

            callback(result);
          });
          break;
        }
      case "results":
        {
          result.format = "results";
          readParseByChunk(file, maxChunk, function(chunk, sizeUploaded, lastChunk) {
            result.data = _this.parse_RESULTS(chunk, "TPM", onError);
            result.sizeUploaded = sizeUploaded;
            result.lastChunk = lastChunk;
            callback(result);
          });
          break;
        }
      case "bed":
        {
          break;
        }
      case "bedcov":
        {
          result.format = "bedcov";
          readParseByChunk(file, maxChunk, function(chunk, sizeUploaded, lastChunk) {

            result.data = _this.parse_bed(chunk, onError);
            result.lastChunk = lastChunk;
            result.sizeUploaded = sizeUploaded;
            callback(result);
          });
          break;
        }
      case "vcf":
        {
          result.format = "vcf";
          readParseByChunk(file, maxChunk, function(chunk, sizeUploaded, lastChunk) {
            result.data = _this.parse_vcf(chunk, header, onError);
            result.sizeUploaded = sizeUploaded;
            result.lastChunk = lastChunk;
            callback(result);



          });
          break;
        }
      case "bam":
        {
          //BINARY File
          result.format = "bam";
          if (!(nextLoad.list.get(nextLoad.file) == "bai")) {
            //Sending back the bam file because bai file not found
            result.data = file;

            callback(result);
          } else {

            readByChunkBamBai(file, nextLoad.file, function(chr, tab, sizeUploaded, lastChunk) {

              var chrom = _this.numberInChromosome(chr);

              function formatBam(callback2) {
                var data = [];

                for (let i = 0; i < tab.length; i++) {
                  data[i] = {
                    chr: chrom,
                    pos: tab[i].pos,
                    value: tab[i].depth
                  };
                  //console.log(msg.data[i]);
                }
                callback2(data);
              }
              formatBam(function(data) {
                result.data = data;
                result.sizeUploaded = sizeUploaded;
                result.lastChunk = lastChunk;
                callback(result);
              })
            });
            /*  readByChunkBamBai(file, nextLoad.file, function(chunk, list, index, sizeUploaded, lastChunk, minBinSize,nbBinsByChunks) {

                  _this.resultBam={};
                  _this.resultBam.sizeUploaded = sizeUploaded;
                  _this.resultBam.lastChunk = lastChunk;
                //  console.log(_this.resultBam)
                  _this.parse_BAM(chunk, list, index, minBinSize,nbBinsByChunks,onError, callback);

              });*/
          }
          break;
        }
      case "bai":
        {
          //BINARY File
          //Sending back the bam file because bai file not found
          result.format = "bai";
          if (!(nextLoad.list.get(nextLoad.file) == "bam")) {
            result.data = file;

            callback(result);
          } else {
            readByChunkBamBai(nextLoad.file, file, function(chr, tab, sizeUploaded, lastChunk) {
              var chrom = _this.numberInChromosome(chr);

              function formatBam(callback2) {
                var data = [];

                for (let i = 0; i < tab.length; i++) {
                  data[i] = {
                    chr: chrom,
                    pos: tab[i].pos,
                    value: tab[i].depth
                  };
                  //console.log(msg.data[i]);
                }
                callback2(data);
              }
              if (chrom == "0") {
                formatBam(function(data) {
                  result.data = data;
                  result.sizeUploaded = sizeUploaded;
                  result.lastChunk = lastChunk;
                  callback(result);
                })
              }
            });
            //remove the files from memory
            /*_this.bamFile ='';
            _this.baiFile = '';*/
          }
          break;
        }

      default:
        console.log("error no such file");
    }

  };

  parsers.recognise_file = function(file, callback, Error_file) {
    var extension = file.name.split('.');
    extension = extension[extension.length - 1];
    if (extension[extension.length - 2])
      var ext2 = extension[extension.length - 2]
    var format;
    var fileID;

    switch (extension) {

      case "fasta":
        {
          format = "fasta";

          callback(format)

          break;
        }
      case "fa":
        {
          format = "fasta";
          callback(format)
          break;
        }
      case "gff3":
        {
          format = "annotation";
          callback(format)
          break;
        }
      case "gff2":
        {
          format = "annotation";
          callback(format)
          break;
        }
      case "gff":
        {
          format = "annotation";
          callback(format)
          break;
        }
      case "gtf":
        {
          format = "annotation";
          callback(format)

          break;
        }
      case "diff":
        {
          format = "diffExp";
          callback(format)
          break;
        }
      case "results":
        {
          format = "results";
          callback(format)
          break;
        }
      case "bed":
        {

          format = "bedcov";
          callback(format)
          break;
        }
      case "bedcov":
        {
          format = "bedcov";
          callback(format)
          break;
        }
      case "vcf":
        {
          format = "vcf";
          callback(format)
          break;
        }
      case "bam":
        {
          format = "bam";
          callback(format)
          break;
        }
      case "bai":
        {
          //Also format as "bam" because the two files are only one track
          format = "bai";
          callback(format)
          break;
        }
      default:
        {

          var reader = new FileReader();
          var firstLine;
          reader.onload = function(e) {

            var text = reader.result; // the entire file
            firstLine = text.split('\n').shift(); // first line



            var S1 = ">";
            var S2 = "##gff";
            var S3 = "gene_id";
            var S4 = "TPM ";
            var S5 = "mRNA:";
            var S6 = "##fileformat=VCF";
            var S7 = "PPEE"


            if (firstLine.charAt(0) === ">") {

              format = "fasta";
              callback(format)
            }


            if (firstLine.includes(S2) == true) {
              format = "annotation";
              callback(format)

            }
            if (firstLine.includes(S6) == true) {
              format = "vcf";
              callback(format)
            }
            if (firstLine.includes(S3) == true) {
              format = "diffExp";
              callback(format)
            }
            if (firstLine.includes(S4) == true) {
              format = "results";
              callback(format)
            }
            if (firstLine.includes(S5) == true) {
              format = "bedcov";
              callback(format)
            }
            if (firstLine.includes(S7) == true) {
              format = "de";
              callback(format)
            } else {
              Error_file('Error');
            }
          }
          reader.readAsText(file, 'UTF-8');

        }
    }


  }

  /**
   * Read up to and including |maxlines| lines from |file|.
   *
   * @param {Blob} file - The file to be read.
   * @param {integer} maxlines - The maximum number of lines to read.
   * @param {function(string)} forEachLine - Called for each line.
   * @param {function(error)} onComplete - Called when the end of the file
   *     is reached or when |maxlines| lines have been read.
   */
  function readParseByChunk(file, maxChunk, forEachChunk, onComplete) {
    var CHUNK_SIZE = 1000000; // 50kb, arbitrarily chosen.
    if (file.name.includes("bedcov") || file.name.includes("results"))
      CHUNK_SIZE = 50000;
    var decoder = new TextDecoder();
    var offset = 0;
    var chunkcount = 0;
    var results = '';
    var fr = new FileReader();
    var lastLine = '';
    fr.onload = function() {


      // Use stream:true in case we cut the file
      // in the middle of a multi-byte character
      results = decoder.decode(fr.result, {
        stream: false
      });

      var lengthLastLine = results.length - 1 - results.lastIndexOf("\n");

      lastLine = results.slice(results.lastIndexOf("\n"));

      results = results.slice(0, -(lengthLastLine + 1));

      chunkcount += 1;

      forEachChunk(results, (results.length - lengthLastLine), false);
      offset += (CHUNK_SIZE - (lengthLastLine + 1));
      results = lastLine;

      checkIfCanRead();

    };

    fr.onerror = function() {
      console.log("ERROR " + fr.error);
      onComplete(fr.error);
    };

    seek();

    function seek() {

      if (offset !== 0 && offset >= file.size) {
        forEachChunk(results, results.length, true); //true to say that this is the last chunk

        return;
      }

      var slice = file.slice(offset, offset + CHUNK_SIZE);
      fr.readAsArrayBuffer(slice);
    }

    //check if the next chunk can be read (if the worker's stack is not full), otherwise try again 300ms latter
    function checkIfCanRead() {
      if (parsers.canReadNext) {
        seek();
      } else {
        setTimeout(function() {
          checkIfCanRead();
        }, 300);
      }
    }
  }



  //Return length of a chromosome, substraying the title
  parsers.parse_fasta = function(chromosomeName, chromosomeLength, lineLength, onError, chromosomeSignature) {

    // catch empty string
    if (!chromosomeLength || !chromosomeName) {
      console.log("Empty String !");
      return [];
    }
    //Split by line if the text is not an array already
    var label = chromosomeName;
    var length = chromosomeLength - label.length;



    var retrieve = 0;
    if (label.slice(-1) === '\r') {
      retrieve = 2 * (Math.round(length / lineLength) - 1) - 1;

    } else {
      retrieve = (Math.round(length / lineLength) - 1) - 1;

    }

    if (chromosomeSignature.use) {
      var expression = chromosomeSignature.begins + "([A-Za-z0-9])*(?=" + chromosomeSignature.ends + ")";
      var rx = new RegExp(expression, 'i');

      if (label.match(rx)) {
        label = label.match(rx)[0];
        label = label.replace(chromosomeSignature.begins, '');
        label = this.numberInChromosome(label);

      } else {
        console.log("Ignored Fasta Sequence, doesn't match given signature")
        return [];
      }



    } else {
      label = this.numberInChromosome(label.slice(1));
    }

    //Add last entry to list_chromosome_length

    length = length - retrieve;
    var chromosome_length;
    if (length < 2) {
      var Error_Chromosome = label;
      chromosome_length = [label, 0];
      onError({
        message: Error_Chromosome,
        severity: 'warn'
      });

    } else {
      chromosome_length = [label, length];
    }

    return chromosome_length;
  }


  // Find the ">" in the .fasta file and divide it in chunks
  //@param forEachChunk : callback
  function readParseByChunkFASTA(file, maxChunk, chromosomeSignature, forEachChunk, onComplete) {

    var _this = this;
    var CHUNK_SIZE = 1048576; // 50kb, arbitrarily chosen.
    var decoder = new TextDecoder();
    var offset = 0;
    var chunkcount = 0;
    var lineLength = 60;
    var fr = new FileReader();
    var linecount = 0;
    var firstChrom = true;
    var newResults = "";
    var lengthAfterNewChrom = 0;
    var chromosomeName = "";
    var newChromosomeName = "";
    fr.onload = function() {

      // Use stream:true in case we cut the file
      // in the middle of a multi-byte character

      newResults = decoder.decode(fr.result, {
        stream: true
      });
      //console.log(newResults);
      if (newResults.split("\n")[0] && newResults.split("\n")[1]) {
        if (newResults.split("\n")[0].charAt(0) !== ">") {
          lineLength = newResults.split("\n")[0].length;
        } else {
          lineLength = newResults.split("\n")[1].length;
        }
      }
      var lengthLastLine = newResults.length - newResults.lastIndexOf("\n");

      //If it is not the last chunk we don't cut the last line
      if (offset + (CHUNK_SIZE - (lengthLastLine - 1)) < file.size) {
        // if not the last chunk remove the last line so that the chunk finishes at EOL

        newResults = newResults.slice(0, -(lengthLastLine - 1));
      }

      if (!parsers.lengthChromosome) {
        parsers.lengthChromosome = 0;
      }
      parsers.lengthChromosome += newResults.length;
      var lines = newResults.split("\n");
      chunkcount += 1;

      for (var i = 0; i < lines.length; ++i) {
        if (lines[i].startsWith(">")) {

          newChromosomeName = lines[i];
          if (firstChrom) {
            chromosomeName = newChromosomeName;
          }
          //If it is not the first chromosome => parse previous chunk until ">"
          // and add the rest to results
          if (firstChrom === false) {

            lengthAfterNewChrom = newResults.length - newResults.slice(1).indexOf(">") - 1;
            newResults = newResults.slice(-(lengthAfterNewChrom));

            parsers.lengthChromosome = parsers.lengthChromosome - lengthAfterNewChrom;

            forEachChunk(chromosomeName, parsers.lengthChromosome, lineLength, false, chromosomeSignature);

            lines = newResults.split('\n');
            chromosomeName = newChromosomeName;
            i = 0;
            parsers.lengthChromosome = lengthAfterNewChrom;

          } else {
            //Not the first chromosome anymore
            firstChrom = false;
          }
        } else {
          //No new chromosome found
          lengthAfterNewChrom = 1;
        }
      }
      offset += (CHUNK_SIZE - (lengthLastLine - 1));

      checkIfCanRead();
    };
    fr.onerror = function() {
      onComplete(fr.error);
    };
    seek();

    function seek() {

      if (offset !== 0 && offset >= file.size) {

        forEachChunk(chromosomeName, parsers.lengthChromosome, lineLength, true, chromosomeSignature);

        return;
      } else {
        var slice = file.slice(offset, offset + CHUNK_SIZE);
        fr.readAsArrayBuffer(slice);
      }

    }

    function checkIfCanRead() {
      //console.log("Can read next ? "+ parsers.canReadNext);
      if (parsers.canReadNext) {
        seek();
      } else {
        setTimeout(function() {
          parsers.checkIfCanRead();
        }, 300);
      }
    }
  }

  function readByChunkBamBai(bamFile, baiFile, forEachChunk) {
    console.log(bamFile);
    console.log(baiFile);
    var _this = this;
    var bam = new Bam(bamFile, {
      bai: baiFile
    });
    console.log(bam)
    bam.estimateBaiReadDepth(function(a, b, c, d) {

      console.log("aaaaaaa")
      console.log(a)
      console.log(b)
      console.log(c)
      console.log(d)

      forEachChunk(a, b, (100 / d), c);


    }, parsers);


    return;
  }
  
  //Parsing VCF files
  parsers.parse_vcf = function(text, columnIndex, onError) {
    var list_VCF_File = [];
    var line


    // catch empty string
    if (!text || (text.length === 0)) {
      return [];
    }
    var textSplit = [];
    //Split by line if the text is not an array already
    if (Object.prototype.toString.call(text) !== '[object Array]') {
      textSplit = text.split("\n");
    }

    for (let i = 0; i < textSplit.length; i++) {
      countline++;
      line = textSplit[i];

      if (line.charAt(0) !== "#" && line.length - 1 > 0) {
        line = line.split('\t');

        var temp = line[columnIndex.ref] + '->' + line[columnIndex.alt];
        var color = "black";
        var index;
        if (line[columnIndex.format] && line[columnIndex.format + 1]) {
          if (line[columnIndex.format].indexOf('AD') !== -1) {
            var tab = line[8].split(":");
            for (let i = 0; i < tab.length; i++) {
              if (tab[i] === 'AD') {
                index = i;
                break;
              }
            }
            var ad = line[columnIndex.format + 1].split(":")[index].split(",");
            var num = parseInt(ad[0]) / (parseInt(ad[0]) + parseInt(ad[1]));
            var homozygousity = Math.pow(num - 0.5, 2) / 0.25;

          }


        }
        var information = {
          chr: this.numberInChromosome(line[columnIndex.chrom]),
          pos: parseInt(line[columnIndex.pos]),
          value: line[columnIndex.qual],
          des: temp,
          //color: color
          homo: homozygousity
        };

        if (line[columnIndex.chrom] == "" || line[columnIndex.pos] == "" || line[columnIndex.qual] == "") {
          onError({
            message: "Error on line " + countline + ", line ignored",
            severity: "warn"
          });
        } else {
          list_VCF_File.push(information);
        }
      }
    }

    return list_VCF_File;
  };


  //bedcov parser
  parsers.parse_bed = function(text, onError) {
    console.log("Parsing  a bedcov file.");
    console.log(text.length);
    var list_Bed_File = [];
    var textArray;
    // catch empty string
    if (!text || (text.length < 10)) {
      return [];
    }
    //Split by line if the text is not an array already
    if (Object.prototype.toString.call(text) !== '[object Array]') {
      if (text.indexOf("\r") != -1) {
        console.log("spliiting with r")
        textArray = text.split("\r\n");
      } else {
        console.log("splitting with n")
        textArray = text.split("\n");
      }
    }


    textArray.forEach(function(item) {
      var line = item;
      line = line.split('\t');
      if (line[0]) {
        if (line[0].split(":")[1]) {
          var des = line[0].split(":")[1]
          if (line[0].split(":")[1].split(".")[2])
            des = line[0].split(":")[1].split(".")[0] + "." + line[0].split(":")[1].split(".")[1]
        } else {
          var des = line[0]
        }
      }


      var information = {
        chr: des,
        value: line[3]
      }
      //console.log(information);
      list_Bed_File.push(information);
    });

    return list_Bed_File;

  };


  //Parser GTF and GFF



  parsers.parse_GFF_GTF = function(text, onError) {
    var list_annotation = [];
    var textArray = [];

    // catch empty string
    if (!text || (text.length === 0)) {
      console.log("File is empty");
      return [];
    }
    //Split by line if the text is not an array already
    if (Object.prototype.toString.call(text) !== '[object Array]') {
      textArray = text.split("\n");
    }

    for (let i = 0; i < textArray.length; i++) {
      var desName = "",
        parent = "",
        des = "";
      countline++;
      var line = textArray[i];
      //Check if the line is a header
      if ((line[0] === "#") || (line[0] === ";") || (line[0] === "\n") || (line[0] === undefined)) {

      } else {
        line = line.split("\t");
        if (line[2] == "mRNA" || line[2] == "exon" || line[2] == "EST_match") {

          // var idPattern = /ID=[^:]*([^;]*)/gi;
          var idPattern = /ID=([^;]*)/gi;
          // id = idPattern.exec(line[8])[1];
          id = idPattern.exec(line[8]);
          // var idSplit = id.split(':');
          // id = idSplit.length > 0 ? idSplit[1] : idSplit[0];



          var parentPattern = /Parent=[^:]*([^;]*)/gi;
          parent = parentPattern.exec(line[8])[1];
          if (parent != null) {
            var parentSplit = parent.split(':');
            parent = parentSplit.length > 0 ? parentSplit[1] : parentSplit[0];
          }

          var notePattern = /Note=([^;]*);*/gi;
          note = notePattern.exec(line[8]);

          if (note != null)
            note = note[1];

          if (line[2] != "chromosome") {
            //var row = new AnnotationLine(this.numberInChromosome(line[0]), parseInt(line[3]), parseInt(line[4]), colour, desName[0].split("=")[1]);
            var row = new AnnotationLine(this.numberInChromosome(line[0]), parseInt(line[3]), parseInt(line[4]), line[2], id, parent, note);
            //console.log(row.chr)

            if (line[0] == "" || line[3] == "" || line[4] == "") {
              onError({
                message: "Error on line " + countline + ", line ignored",
                severity: "warn"
              });
            } else {
              if (row.color != "") {
                list_annotation.push(row);
              }
            }

          }
        }
      }

    };


    return list_annotation;
  };

  //Parser for Differential Gene Expression (Cuffdiff .diff)
  parsers.parse_DIFF = function(text, min_pvalue, onError) {
    console.log("Parsing  a diff file.");
    var list_diff = [];
    var textArray;

    // catch empty string
    if (!text || (text.length === 0)) {
      console.log("File is empty");
      return [];
    }
    //Split by line if the text is not an array already
    if (Object.prototype.toString.call(text) !== '[object Array]') {
      textArray = text.split("\n");
    }

    for (let i = 1; i < textArray.length; i++) {
      countline++;
      var line = textArray[i];
      //Check if the line is a header
      line = line.split("\t");
      if (line[line.length - 3] > min_pvalue) {

        if (line[3]) {
          var locus = line[3].split(":");
          var chromosome = locus[0];
          var value = line[9];
          if (isNaN(value)) {
            if (value == "-inf")
              value = -10;
            if (value == "inf")
              value = 10;
            else
              value = 0;
          }
          var row = new DiffLine(this.numberInChromosome(locus[0]), locus[1].split("-")[0], locus[1].split("-")[1], line[2], value);
          if (locus[0] == "" || locus[1] == "" || line[2] == "") {
            onError({
              message: "Error on line " + countline + ", line ignored",
              severity: "warn"
            })
          } else {
            list_diff.push(row);
          }

        }
      }
    }

    return list_diff;
  };

  parsers.parse_RESULTS = function(text, TPMorFPKM, onError) {

    var list_diff = [];
    var textArray;

    switch (TPMorFPKM) {
      case "TPM":
        {
          var valueIndx = 5;
          break;
        }
      default:
        {
          var valueIndx = 6;
        }
    }
    // catch empty string
    if (!text || (text.length === 0)) {
      console.log("File is empty");
      return [];
    }
    //Split by line if the text is not an array already
    if (Object.prototype.toString.call(text) !== '[object Array]') {
      textArray = text.split("\n");
    }

    for (let i = 1; i < textArray.length; i++) {
      countline++;
      var line = textArray[i];
      //Check if the line is a header
      line = line.split("\t");
      value = line[valueIndx];
      if (line[0]) {
        if (line[0].split(":")[1]) {

          var des = line[0].split(":")[1]

        } else {
          var des = line[0];
        }

        var row = {
          chr: des,
          value: line[3]
        }
        if (des == "" || value == "") {

          onError({
            message: "Error on line " + countline + ", line ignored",
            severity: "warn"
          })
        } else {
          list_diff.push(row);
        }
      }
    }
    return list_diff;
  }

  parsers.parse_GeneMat = function(text, PostOrReal, onError) {
    var list_diff = [];
    var textArray;

    switch (PostOrReal) {
      case "Post":
        {
          var valueIndx = 3;
          break;
        }
      default:
        {
          var valueIndx = 4;
        }
    }
    // catch empty string
    if (!text || (text.length === 0)) {
      console.log("File is empty");
      return [];
    }
    //Split by line if the text is not an array already
    if (Object.prototype.toString.call(text) !== '[object Array]') {
      textArray = text.split("\n");
    }

    for (let i = 1; i < textArray.length; i++) {
      countline++;
      var line = textArray[i];
      //Check if the line is a header
      line = line.split("\t");
      value = line[valueIndx];
      if (line[0]) {
        if (line[0].split(":")[1]) {

          var des = line[0].split(":")[1]

        } else {
          var des = line[0];
        }
        des = des.replace(/\"/g, '')
        var row = {
          chr: des,
          value: Math.log2(line[3])
        }
        if (des == "" || value == "") {
          onError({
            message: "Error on line " + countline + ", line ignored",
            severity: "warn"
          })
        } else {
          list_diff.push(row);
        }
      }
    }
    return list_diff;
  }


  parsers.numberInChromosome = function(chromosome) {

    var pattern = /[\dA-Z]*[^.]$/m;
    chromosome = chromosome.replace(" ", "")

    var chromosomeNumber = chromosome.match(pattern);

    if (chromosomeNumber) {

      chromosomeNumber = chromosomeNumber[0];

      if (chromosomeNumber.charAt(0) === "0" && chromosomeNumber.length > 1) {
        chromosomeNumber = chromosomeNumber.charAt(1)
      }

      return chromosomeNumber;
    } else {
      return "undefined";
    }
  };


  parsers.getVCFHeader = function(file, format, e, selectedFasta, callback, onError) {
    var CHUNK_SIZE = 1000000; // 50kb, arbitrarily chosen.


    var decoder = new TextDecoder();
    var results = '';
    var fr = new FileReader();
    var lastLine = '';
    fr.onload = function() {


      // Use stream:true in case we cut the file
      // in the middle of a multi-byte character
      results = decoder.decode(fr.result, {
        stream: false
      });
      //console.log(results);

      //console.log(results.lastIndexOf("\n"));
      var lengthLastLine = results.length - 1 - results.lastIndexOf("\n");
      //console.log("Length of Last line : "+lengthLastLine);
      lastLine = results.slice(results.lastIndexOf("\n"));
      //console.log("Last line : " + lastLine);
      results = results.slice(0, -(lengthLastLine + 1));

      lines = results.split("\n")

      columnIndex = {};

      var line;
      for (var i = 0; i < lines.length; i++) {
        line = lines[i];
        if (line.includes("#CHROM")) {

          header = line.substring(1).split("\t");

          columnIndex.ref = header.indexOf("REF")
          columnIndex.alt = header.indexOf("ALT")
          columnIndex.pos = header.indexOf("POS")
          columnIndex.chrom = header.indexOf("CHROM")
          columnIndex.qual = header.indexOf("QUAL")
          columnIndex.format = header.indexOf("FORMAT")

          //this looks like a bug, Format isn't a mandatory field in VCFs
          // if (header.length > columnIndex.format + 2) { //if there are more than one genome in the vcf, stop the upload
          //   onError({
          //     message: "Please upload a VCF file with only one genome",
          //     severity: "error"
          //   })
          // } else {
            callback(file, format, e, selectedFasta, columnIndex)
          // }

        }
      }


      
    };

    fr.onerror = function() {
      console.log("ERROR " + fr.error);
      onComplete(fr.error);
    };


    var slice = file.slice(0, CHUNK_SIZE);
    fr.readAsArrayBuffer(slice);

  }


  function BAMread(chr, pos, depth) {
    this.chr = chr;
    this.pos = pos;
    this.value = depth;
  };

  function Bed_line(chr, start, end, value) {
    this.chr = chr;
    this.start = start;
    this.end = end;
    this.value = value;
  };

  function DiffLine(chr, start, end, name, value) {
    this.chr = chr;
    this.start = start;
    this.end = end;
    this.name = name;
    this.value = value;
  };
  //BAM Object
  function BAMread(chr, pos, value) {
    this.chr = chr;
    this.pos = pos;
    this.value = value;
  };
  //Annotation Object
  function AnnotationLine(chr, start, end, type, id, parent, des) {
    this.chr = chr;
    this.start = start;
    this.end = end;
    this.type = type;
    this.id = id;
    this.parent = parent;
    this.des = des;
  };



  return parsers;
}();
