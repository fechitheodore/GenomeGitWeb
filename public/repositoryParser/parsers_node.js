const path = require('path');
const environment = require('../../src/environments/environment');

module.exports = class Parsers {

    constructor() {
        this.fs = require("fs");
        this.version = 1.0;
        this.canReadNext = true;
        this.countline = 0;
        //this.lengthChromosome=0;
    };


    parseFile(file, nextLoad, format, header, callback, onError) {
         var mistake_found = false;
        var _this = this;
        var extension = path.posix.basename(file).split('.');
        extension = extension[extension.length - 1];

        var result = {
            format: "",
            data: {}
        };

        var maxChunk = 5000;
        switch (format) {

            case "fasta":
            case "fa":
                {
                    result.format = "fasta";
                    this.readParseByChunkFASTA(file, function (chromosomes) {
                        result.data = chromosomes; //_this.parse_fasta(name, length, lineLength, onError, chromosomeSignature);
                        result.file=path.posix.basename(file);
                        //   result.sizeUploaded = sizeUploaded;
                        if (result.data) {
                            callback(result);
                        }
                    });
                    break;
                }
            case "gff3":
                {
                    ;
                    result.format = "annotation";
                    this.readParseByChunk(file, maxChunk, function (chunk, sizeUploaded, lastChunk, pos) {
                        result.data = _this.parse_GFF_GTF(chunk, onError);
                        result.sizeUploaded = sizeUploaded;
                        result.lastChunk = lastChunk;
                        result.pos=pos
                        callback(result);
                    });
                    break;
                }
            case "gff2":
                {
                    result.format = "annotation";
                    this.readParseByChunk(file, maxChunk, function (chunk, sizeUploaded, lastChunk) {
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
                    this.readParseByChunk(file, maxChunk, function (chunk, sizeUploaded, lastChunk) {
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
                    this.readParseByChunk(file, maxChunk, function (chunk, sizeUploaded, lastChunk) {
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
                    this.readParseByChunk(file, maxChunk, function (chunk, sizeUploaded, lastChunk) {
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
                    this.readParseByChunk(file, maxChunk, function (chunk, sizeUploaded, lastChunk) {
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
                    this.readParseByChunk(file, maxChunk, function (chunk, sizeUploaded, lastChunk) {
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
                    this.readParseByChunk(file, maxChunk, function (chunk, sizeUploaded, lastChunk) {

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
                    this.readParseByChunk(file, maxChunk, function (chunk, sizeUploaded, lastChunk) {
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

                        this.readByChunkBamBai(file, nextLoad.file, function (chr, tab, sizeUploaded, lastChunk) {

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
                            formatBam(function (data) {
                                result.data = data;
                                result.sizeUploaded = sizeUploaded;
                                result.lastChunk = lastChunk;
                                callback(result);
                            })
                        });
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
                        this.readByChunkBamBai(nextLoad.file, file, function (chr, tab, sizeUploaded, lastChunk) {
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
                                formatBam(function (data) {
                                    result.data = data;
                                    result.sizeUploaded = sizeUploaded;
                                    result.lastChunk = lastChunk;
                                    callback(result);
                                })
                            }
                        });
                    }
                    break;
                }

            default:
                console.log("error no such file");
        }

    };

    recognise_file(file, callback, Error_file) {
        var extension = path.posix.basename(file).split('.');
        extension = extension[extension.length - 1];
        if (extension[extension.length - 2])
            var ext2 = extension[extension.length - 2]
        var format;
        var fileID;

        switch (extension) {

            case "fasta":
            case "fa":
                {
                    format = "fasta";
                    callback.recogniseFileCallbackfunction(format)
                    break;
                }
            case "gff3":
            case "gff2":
            case "gff":
            case "gtf":
                {
                    format = "annotation";
                    callback.recogniseFileCallbackfunction(format)

                    break;
                }
            case "diff":
                {
                    format = "diffExp";
                    callback.recogniseFileCallbackfunction(format)
                    break;
                }
            case "results":
                {
                    format = "results";
                    callback.recogniseFileCallbackfunction(format)
                    break;
                }
            case "bed":
            case "bedcov":
                {
                    format = "bedcov";
                    callback.recogniseFileCallbackfunction(format)
                    break;
                }
            case "vcf":
                {
                    format = "vcf";
                    callback.recogniseFileCallbackfunction(format)
                    break;
                }
            case "bam":
                {
                    format = "bam";
                    callback.recogniseFileCallbackfunction(format)
                    break;
                }
            case "bai":
                {
                    //Also format as "bam" because the two files are only one track
                    format = "bai";
                    callback.recogniseFileCallbackfunction(format)
                    break;
                }
            /*case "sam":
                {
                    format= "sam"
                    break;
                }*/
            default:
                {

                    //var reader = new FileReader();
                    var firstLine;
                    fs.readFile(file, 'utf8', (err, data) => {
                        if (err)
                            throw err;
                        //console.log(data);
                        var text = data; // the entire file
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
                            callback.recogniseFileCallbackfunction(format)
                        }
                        if (firstLine.includes(S2) == true) {
                            format = "annotation";
                            callback.recogniseFileCallbackfunction(format)

                        }
                        if (firstLine.includes(S6) == true) {
                            format = "vcf";
                            callback.recogniseFileCallbackfunction(format)
                        }
                        if (firstLine.includes(S3) == true) {
                            format = "diffExp";
                            callback.recogniseFileCallbackfunction(format)
                        }
                        if (firstLine.includes(S4) == true) {
                            format = "results";
                            callback.recogniseFileCallbackfunction(format)
                        }
                        if (firstLine.includes(S5) == true) {
                            format = "bedcov";
                            callback.recogniseFileCallbackfunction(format)
                        }
                        if (firstLine.includes(S7) == true) {
                            format = "de";
                            callback.recogniseFileCallbackfunction(format)
                        } else {
                            Error_file('Error');
                        }
                    });
                    //reader.readAsText(file, 'UTF-8');

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

     //function has to by async for await inside it to work
    async readParseByChunk(file, maxChunk, forEachChunk) {
        var CHUNK_SIZE = 5000000; // 50kb, arbitrarily chosen.
        if (file.includes("bedcov") || file.includes("results"))
        CHUNK_SIZE = 500000;
        let fileSize = this.fs.statSync(file).size;
        let readsize=0;
        let lastLine = '';
        let chunkCounter=0;
        let sleepCounter=0;
        var fd = this.fs.openSync(file)
        var buffer = new Buffer(CHUNK_SIZE);
        const sleep = (milliseconds) => {
            return new Promise(resolve => setTimeout(resolve, milliseconds))
          }
        let read, text;
        while ((read = this.fs.readSync(fd, buffer, 0, CHUNK_SIZE, null) !== 0)) {
            readsize=readsize+CHUNK_SIZE;
            chunkCounter++;
            text = lastLine + buffer.toString('utf8');

            var lengthLastLine = text.length - 1 - text.lastIndexOf("\n");

            lastLine = text.slice(text.lastIndexOf("\n"));

            text = text.slice(0, -(lengthLastLine + 1));


            //depending on system, large files cause Socket.io to drop connection
            //this is a easy, but unrelaiable way of resolving this issue
            if (sleepCounter===30){
                await sleep(environment.environment.parserSleep);
                sleepCounter=0
            }
            sleepCounter++

            if (fileSize<=readsize){
                //true indicates this is a the last chunk (due to downstream implmentation in original webcircos)
                forEachChunk(text, text.length, true)
                break;
            }else if (fileSize<=readsize+CHUNK_SIZE){
                CHUNK_SIZE=fileSize-readsize
                buffer=new Buffer(CHUNK_SIZE);
                forEachChunk(text, (text.length - lengthLastLine), false, chunkCounter);
            } else {
                forEachChunk(text, (text.length - lengthLastLine), false, chunkCounter);
            }

            //text = lastLine;
        
            //console.log("Non-fasta, read: "+readsize/1000000+" out of "+fileSize+ "Mb")
        }

        
    }





    //Return length of a chromosome, substraying the title
    parse_fasta(chromosomeName, chromosomeLength, lineLength, onError, chromosomeSignature) {

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


        //   }
        //remove the ">"" symbol, but keep the rest of the name
        //let user change this later
        label = label.slice(1);

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
    readParseByChunkFASTA(file, forEachChunk) {
        var CHUNK_SIZE = 1048576; // 50kb, arbitrarily chosen.
        var fd = this.fs.openSync(file)
        let fileSize = this.fs.statSync(file).size;
        let readsize=0;
        var buffer = new Buffer(CHUNK_SIZE);
        let chromosomes = [];
        let insideHeader = false;
        let isFirstArrow = true;
        let read, text;
        let chromosomeLength = 0;
        let chromosomeName = "";
        while ((read = this.fs.readSync(fd, buffer, 0, CHUNK_SIZE, null) !== 0)) {
            readsize=readsize+CHUNK_SIZE;
            text = buffer.toString('utf8');
            for (var i = 0; i < text.length; i++) {
                if (!insideHeader && text[i] === '>') {
                    //opportunistically split the header at first space in hope that this is the 
                    //consistent chromosome identifier
                    if (isFirstArrow) {
                        isFirstArrow = false;
                    } else {
                        chromosomeName=chromosomeName.split(" ")[0];
                        chromosomes.push([chromosomeName, chromosomeLength]); //commit previous contig block
                    }
                    chromosomeName = '';
                    chromosomeLength = 0;
                    insideHeader = true; //started looking through header
                } else if (insideHeader && text[i] != '\n' && text[i] != '\r') {
                    chromosomeName = chromosomeName + text[i];
                } else if (insideHeader && text[i] === '\n') { // \r can be ignored as it's always used in \r\n combination
                    insideHeader = false;
                } else if (!insideHeader && (text[i] === '\n' || text[i] === '\r')) {
                    //this should be ignored
                } else {
                    chromosomeLength++;
                }
            }
            //the buffer in reader doesn't get emptied before new data is read
            //as a result, when the last read from file is shorter then CHUNK_SIZE
            //the buffer retains some of the data from the prior read
            //thus buffer needs to be reset on the last read.
            if (fileSize<=readsize){
                break;
            }else if (fileSize<=readsize+CHUNK_SIZE){
                CHUNK_SIZE=fileSize-readsize
                buffer=new Buffer(CHUNK_SIZE);
            }
        };
        //last chromosome will not get caught unless file ends in > which is unlikely.
        chromosomeName=chromosomeName.split(" ")[0];
        chromosomes.push([chromosomeName, chromosomeLength]);
        forEachChunk(chromosomes);

    }

    readByChunkBamBai(bamFile, baiFile, forEachChunk) {
        console.log(bamFile);
        console.log(baiFile);
        var _this = this;
        var bam = new Bam(bamFile, {
            bai: baiFile
        });
        console.log(bam)
        bam.estimateBaiReadDepth(function (a, b, c, d) {

            console.log("aaaaaaa")
            console.log(a)
            console.log(b)
            console.log(c)
            console.log(d)

            forEachChunk(a, b, (100 / d), c);


        }, this);


        return;
    }

    //Parsing VCF files
    parse_vcf(text, columnIndex, onError) {
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
            this.countline++;
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
                    chr: line[columnIndex.chrom],
                    pos: parseInt(line[columnIndex.pos]),
                    value: line[columnIndex.qual],
                    des: temp,
                    //color: color
                    homo: homozygousity
                };

                if (line[columnIndex.chrom] == "" || line[columnIndex.pos] == "" || line[columnIndex.qual] == "") {
                    onError({
                        message: "Error on line " + this.countline + ", line ignored",
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
    parse_bed(text, onError) {
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


        textArray.forEach(function (item) {
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



    parse_GFF_GTF(text, onError) {
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
            this.countline++;
            var line = textArray[i];
            //Check if the line is a header
            if ((line[0] === "#") || (line[0] === ";") || (line[0] === "\n") || (line[0] === undefined)) {

            } else {
                line = line.split("\t");
                if (line[2] == "mRNA" || line[2] == "exon" || line[2] == "EST_match" /*|| line[2]== "gene"*/) {

                    // var idPattern = /ID=[^:]*([^;]*)/gi;
                    let idPattern = /ID=([^;]*)/gi;
                    // id = idPattern.exec(line[8])[1];
                    let id = idPattern.exec(line[8]);
                    // var idSplit = id.split(':');
                    // id = idSplit.length > 0 ? idSplit[1] : idSplit[0];



                    var parentPattern = /Parent=[^:]*([^;]*)/gi;
                    
                    parent = parentPattern.exec(line[8]);
                    if (parent != null && parent.length>1){
                        parent = parent[1];
                    }

                    if (parent != null) {
                        var parentSplit = parent.split(':');
                        parent = parentSplit.length > 0 ? parentSplit[1] : parentSplit[0];
                    }

                    let notePattern = /Note=([^;]*);*/gi;
                    let note = notePattern.exec(line[8]);

                    if (note != null)
                        note = note[1];

                    if (line[2] != "chromosome") {
                        var row = new AnnotationLine(line[0], parseInt(line[3]), parseInt(line[4]), line[2], id, parent, note);

                        if (line[0] == "" || line[3] == "" || line[4] == "") {
                            onError({
                                message: "Error on line " + this.countline + ", line ignored",
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
    parse_DIFF(text, min_pvalue, onError) {
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
            this.countline++;
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
                            message: "Error on line " + this.countline + ", line ignored",
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

    parse_RESULTS(text, TPMorFPKM, onError) {

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
            this.countline++;
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
                        message: "Error on line " + this.countline + ", line ignored",
                        severity: "warn"
                    })
                } else {
                    list_diff.push(row);
                }
            }
        }
        return list_diff;
    }

    parse_GeneMat(text, PostOrReal, onError) {
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
            this.countline++;
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
                        message: "Error on line " + this.countline + ", line ignored",
                        severity: "warn"
                    })
                } else {
                    list_diff.push(row);
                }
            }
        }
        return list_diff;
    }


    numberInChromosome(chromosome) {

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


    getVCFHeader(file, format, e, selectedFasta, callback, onError) {
        var CHUNK_SIZE = 1000000; // 50kb, arbitrarily chosen.


        let lastLine = '';
        let chunkCounter=0;

        var fd = this.fs.openSync(file)
        var buffer = new Buffer(CHUNK_SIZE);
        let read, text;
        while ((read = this.fs.readSync(fd, buffer, 0, CHUNK_SIZE, null) !== 0)) {
            chunkCounter++;
            text = buffer.toString('utf8');

            var lengthLastLine = text.length - 1 - text.lastIndexOf("\n");
            lastLine = text.slice(text.lastIndexOf("\n"));
            text = text.slice(0, -(lengthLastLine + 1));

            let lines = text.split("\n")

            let columnIndex = {};

            var line;
            //console.log(text);
            for (var i = 0; i < lines.length; i++) {
                line = lines[i];
                if (line.includes("#CHROM")) {

                    let header = line.substring(1).split("\t");

                    columnIndex.ref = header.indexOf("REF")
                    columnIndex.alt = header.indexOf("ALT")
                    columnIndex.pos = header.indexOf("POS")
                    columnIndex.chrom = header.indexOf("CHROM")
                    columnIndex.qual = header.indexOf("QUAL")
                    columnIndex.format = header.indexOf("FORMAT")

                    callback.startUpload(file, format, e, selectedFasta, columnIndex)
                    // }

                }
            }
        
        
        }

    }


    BAMread(chr, pos, depth) {
        this.chr = chr;
        this.pos = pos;
        this.value = depth;
    };

    Bed_line(chr, start, end, value) {
        this.chr = chr;
        this.start = start;
        this.end = end;
        this.value = value;
    };

    DiffLine(chr, start, end, name, value) {
        this.chr = chr;
        this.start = start;
        this.end = end;
        this.name = name;
        this.value = value;
    };
    //BAM Object
    BAMread(chr, pos, value) {
        this.chr = chr;
        this.pos = pos;
        this.value = value;
    };

}

class AnnotationLine {
    constructor(chr, start, end, type, id, parent, des) {
        this.chr = chr;
        this.start = start;
        this.end = end;
        this.type = type;
        this.id = id;
        this.parent = parent;
        this.des = des;
    };
}
