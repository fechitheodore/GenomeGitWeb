"use strict";
exports.__esModule = true;
///<reference path="../../node_modules/@types/node/index.d.ts"/>
var parser_types_1 = require("./parser_types");
var LinksParser = /** @class */ (function () {
    function LinksParser() {
    }
    LinksParser.prototype.getDeltaDirectories = function (baseDirectory) {
        //get the list of fastahash1_fastahash2 directories in which Filtered.snp is located
        var fs = require("fs");
        var dirs = fs.readdirSync(baseDirectory);
        var result = [];
        if (dirs.length === 0) {
            return result;
        }
        for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
            var dir = dirs_1[_i];
            if (dir === "Delta") {
                //Delta folder contains the difference files
                dirs = fs.readdirSync(baseDirectory + "/Delta/");
                if (dirs.length === 0) {
                    return result;
                }
                for (var _a = 0, dirs_2 = dirs; _a < dirs_2.length; _a++) {
                    var commitDir = dirs_2[_a];
                    if (commitDir.indexOf('_') !== -1) {
                        result.push(commitDir);
                    }
                }
            }
        }
        return result;
    };
    LinksParser.prototype.readFilteredSNP = function (directory) {
        var fs = require("fs");
        var CHUNK_SIZE = 1048576; // 50kb, arbitrarily chosen.
        var file = "Filtered.snp";
        if (!fs.existsSync(directory + "/" + file)) {
            return [];
        }
        var fd = fs.openSync(directory + "/" + file);
        var fileSize = fs.statSync(directory + "/" + file).size;
        var readsize = 0;
        var buffer = new Buffer(CHUNK_SIZE);
        var text;
        var line = "";
        var dataPoints = [];
        var currentDataPoint = new parser_types_1.LinksDataPoint;
        var isFirsLine = true;
        var newFragment = true;
        while (fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) {
            readsize += CHUNK_SIZE;
            text = buffer.toString('utf8');
            //thi cane done via string.split instead of looping over characters, but i don't think there is any 
            //speed to be gained.
            for (var i = 0; i < text.length; i++) {
                if (text[i] !== '\n') {
                    line += text[i];
                }
                else if (text[i] === '\r') {
                    //this is precautionary, in case of windows style line endings
                }
                else {
                    var splitLine = line.split("\t");
                    line = "";
                    newFragment = !isFirsLine ? this.endOfFragment(splitLine, currentDataPoint) : false;
                    if (newFragment || isFirsLine) {
                        if (!isFirsLine) {
                            dataPoints.push(currentDataPoint);
                        }
                        currentDataPoint = new parser_types_1.LinksDataPoint;
                        currentDataPoint.g1start = parseInt(splitLine[0]);
                        currentDataPoint.g2start = parseInt(splitLine[3]);
                        currentDataPoint.g1inverted = (splitLine[8] === "-1") ? true : false;
                        currentDataPoint.g2inverted = (splitLine[9] === "-1") ? true : false;
                        isFirsLine = false;
                    }
                    currentDataPoint._g1chr = splitLine[10];
                    currentDataPoint._g2chr = splitLine[11];
                    if (splitLine[1] === ".") {
                        currentDataPoint.g1value = ".";
                        currentDataPoint.g2value = currentDataPoint.g2value + splitLine[2];
                        currentDataPoint.isInDel = true;
                    }
                    else if (splitLine[2] === ".") {
                        currentDataPoint.g1value = currentDataPoint.g1value + splitLine[1];
                        currentDataPoint.g2value = ".";
                        currentDataPoint.isInDel = true;
                    }
                    else {
                        currentDataPoint.g1value = currentDataPoint.g1value + splitLine[1];
                        currentDataPoint.g2value = currentDataPoint.g2value + splitLine[2];
                        currentDataPoint.isSNP = true;
                    }
                    currentDataPoint.g1end = parseInt(splitLine[0]);
                    currentDataPoint.g2end = parseInt(splitLine[3]);
                }
                //!process line
            }
            if (fileSize <= readsize) {
                break;
            }
            else if (fileSize < readsize + CHUNK_SIZE) {
                CHUNK_SIZE = fileSize - readsize;
                buffer = new Buffer(CHUNK_SIZE);
            }
        }
        if (!isFirsLine) {
            dataPoints.push(currentDataPoint);
        }
        return dataPoints;
    };
    LinksParser.prototype.readFilteredDelta = function (directory) {
        var fs = require("fs");
        var CHUNK_SIZE = 1048576; // 50kb, arbitrarily chosen.
        var file = "Filtered.delta";
        var fd = fs.openSync(directory + "/" + file);
        var fileSize = fs.statSync(directory + "/" + file).size;
        var readsize = 0;
        var buffer = new Buffer(CHUNK_SIZE);
        var text;
        var lastReadLeftover = "";
        var lastReadCycle = false;
        var dataPoints = [];
        var currentDataPoint;
        var ReadFirstLine = false;
        var currentChromosomes;
        while (fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) {
            readsize += CHUNK_SIZE;
            text = lastReadLeftover + buffer.toString('utf8');
            var lines = text.split("\n");
            //the last line of current read cycle (unless it's last read cycle) is likely to be split between current and next read cycle
            //thus don't parse it, but prepend to the next read cycle. 
            var linesCount = (lastReadCycle) ? lines.length : lines.length - 1;
            for (var i = 0; i < linesCount; i++) {
                if (!ReadFirstLine && lines[0] === ">") {
                    //Filtered.delta has a header line (or possibly more than one) with meta data
                    //the useful data start with the first ">"" which ide
                    ReadFirstLine = true;
                }
                var values = lines[i].split(" ");
                if (values[0][0] === ">") {
                    //this is header line for two alligned sequences. See Mummer manual "The "delta" file format" section
                    currentChromosomes = [values[0].slice(1), values[1]];
                }
                if (values.length == 7) {
                    //mummer documentation states that individual alignment information rows have 7 values
                    currentDataPoint = new parser_types_1.LinksDataPoint;
                    currentDataPoint.isDelta = true;
                    currentDataPoint.g1start = parseInt(values[0]);
                    currentDataPoint.g1end = parseInt(values[1]);
                    currentDataPoint.g2start = parseInt(values[2]);
                    currentDataPoint.g2end = parseInt(values[3]);
                    currentDataPoint.g1chr = currentChromosomes[0];
                    currentDataPoint.g2chr = currentChromosomes[1];
                    currentDataPoint.g1inverted = false;
                    currentDataPoint.g1inverted = (currentDataPoint.g2start > currentDataPoint.g2end) ? true : false;
                    dataPoints.push(currentDataPoint);
                }
            }
            lastReadLeftover = lines[lines.length - 1];
            if (fileSize <= readsize) {
                break;
            }
            else if (fileSize < readsize + CHUNK_SIZE) {
                CHUNK_SIZE = fileSize - readsize;
                buffer = new Buffer(CHUNK_SIZE);
                lastReadCycle = true;
            }
        }
        return dataPoints;
    };
    LinksParser.prototype.endOfFragment = function (line, DataPoint) {
        //determine is fragment has been fully processed
        if (DataPoint.g1value === "." && DataPoint.g1end !== (parseInt(line[0]))) {
            //deletion on original genome
            return true;
        }
        else if (DataPoint.g2value === "." && DataPoint.g2end !== (parseInt(line[3]))) {
            //deletion on new genome
            return true;
        }
        else if (DataPoint.isSNP && (DataPoint.g1end !== (parseInt(line[0]) - 1) || DataPoint.g2end !== (parseInt(line[3]) - 1))) {
            //either SNP or translocation fragment has ended.
            return true;
        }
        else {
            return false;
        }
    };
    return LinksParser;
}());
exports.LinksParser = LinksParser;
