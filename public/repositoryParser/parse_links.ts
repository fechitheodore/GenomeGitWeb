///<reference path="../../node_modules/@types/node/index.d.ts"/>
import { LinksDataPoint } from "./parser_types";

export class LinksParser {

    getDeltaDirectories(baseDirectory: string): Array<string> {
        //get the list of fastahash1_fastahash2 directories in which Filtered.snp is located
        let fs = require("fs");

        let dirs = fs.readdirSync(baseDirectory)

        let result: Array<string> = []

        if (dirs.length===0){return result}

        for (let dir of dirs){
            if (dir==="Delta"){
                //Delta folder contains the difference files
                dirs = fs.readdirSync(baseDirectory+"/Delta/")
                if (dirs.length===0){return result}
                for (let commitDir of dirs){
                    if (commitDir.indexOf('_') !== -1){
                        result.push(commitDir)
                    }
                }
            }
        }
        return result;
    }

    readFilteredSNP(directory: string): Array<LinksDataPoint> {
        let fs = require("fs");
        let CHUNK_SIZE: number = 1048576; // 50kb, arbitrarily chosen.
        let file="Filtered.snp"
        if (!fs.existsSync(directory+"/"+file)) {
            return [];
        }
        let fd = fs.openSync(directory+"/"+file)
        let fileSize = fs.statSync(directory+"/"+file).size;
        let readsize: number = 0;
        let buffer: Buffer = new Buffer(CHUNK_SIZE);
        let text;
        let line: string = "";
        let dataPoints: Array<LinksDataPoint> = [];
        let currentDataPoint: LinksDataPoint = new LinksDataPoint;
        let isFirsLine: boolean = true;
        let newFragment: boolean = true;
        while (fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) {
            readsize += CHUNK_SIZE;
            text = buffer.toString('utf8');
            //thi cane done via string.split instead of looping over characters, but i don't think there is any 
            //speed to be gained.
            for (var i = 0; i < text.length; i++) {
                if (text[i] !== '\n') {
                    line += text[i];
                } else if (text[i] === '\r') {
                    //this is precautionary, in case of windows style line endings
                } else {
                    let splitLine = line.split("\t");
                    line = "";

                    newFragment = !isFirsLine ? this.endOfFragment(splitLine, currentDataPoint) : false
                    if (newFragment || isFirsLine) {
                        if (!isFirsLine) { dataPoints.push(currentDataPoint); }
                        currentDataPoint = new LinksDataPoint;
                        currentDataPoint.g1start = parseInt(splitLine[0]);
                        currentDataPoint.g2start = parseInt(splitLine[3]);
                        currentDataPoint.g1inverted = (splitLine[8] === "-1") ? true : false
                        currentDataPoint.g2inverted = (splitLine[9] === "-1") ? true : false
                        isFirsLine = false;
                    }

                    currentDataPoint._g1chr = splitLine[10];
                    currentDataPoint._g2chr = splitLine[11];
                    if (splitLine[1] === ".") {
                        currentDataPoint.g1value = ".";
                        currentDataPoint.g2value = currentDataPoint.g2value + splitLine[2];
                        currentDataPoint.isInDel = true;
                    } else if (splitLine[2] === ".") {
                        currentDataPoint.g1value = currentDataPoint.g1value + splitLine[1];
                        currentDataPoint.g2value = ".";
                        currentDataPoint.isInDel = true;
                    } else {
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
            } else if (fileSize < readsize + CHUNK_SIZE) {
                CHUNK_SIZE = fileSize - readsize
                buffer = new Buffer(CHUNK_SIZE);
            }
        }
        if (!isFirsLine) {dataPoints.push(currentDataPoint)}
        return dataPoints;
    }

    readFilteredDelta(directory: string): Array<LinksDataPoint> {
        let fs = require("fs");
        let CHUNK_SIZE: number = 1048576; // 50kb, arbitrarily chosen.
        let file="Filtered.delta"
        let fd = fs.openSync(directory+"/"+file)
        let fileSize = fs.statSync(directory+"/"+file).size;
        let readsize: number = 0;
        let buffer: Buffer = new Buffer(CHUNK_SIZE);
        let text: string;
        let lastReadLeftover: string = ""
        let lastReadCycle: boolean = false;
        let dataPoints: Array<LinksDataPoint> = [];
        let currentDataPoint: LinksDataPoint;
        let ReadFirstLine: boolean = false;
        let currentChromosomes: Array<string>;
        while (fs.readSync(fd, buffer, 0, CHUNK_SIZE, null)) {
            readsize += CHUNK_SIZE;
            text = lastReadLeftover+buffer.toString('utf8');
            let lines = text.split("\n");

            //the last line of current read cycle (unless it's last read cycle) is likely to be split between current and next read cycle
            //thus don't parse it, but prepend to the next read cycle. 
            let linesCount = (lastReadCycle) ? lines.length : lines.length-1  

            for (let i=0; i<linesCount; i++){
                if (!ReadFirstLine && lines[0]===">"){
                    //Filtered.delta has a header line (or possibly more than one) with meta data
                    //the useful data start with the first ">"" which ide
                    ReadFirstLine=true;
                }
                let values = lines[i].split(" ");
                if (values[0][0]===">") {
                    //this is header line for two alligned sequences. See Mummer manual "The "delta" file format" section
                    currentChromosomes=[values[0].slice(1), values[1]]
                }
                if (values.length==7){
                    //mummer documentation states that individual alignment information rows have 7 values
                    currentDataPoint= new LinksDataPoint;
                    currentDataPoint.isDelta = true;
                    currentDataPoint.g1start=parseInt(values[0]);
                    currentDataPoint.g1end=parseInt(values[1]);
                    currentDataPoint.g2start=parseInt(values[2]);
                    currentDataPoint.g2end=parseInt(values[3]);
                    currentDataPoint.g1chr=currentChromosomes[0];
                    currentDataPoint.g2chr=currentChromosomes[1];
                    currentDataPoint.g1inverted=false;
                    currentDataPoint.g1inverted = (currentDataPoint.g2start > currentDataPoint.g2end) ? true : false
                    dataPoints.push(currentDataPoint);
                }
            }

            lastReadLeftover=lines[lines.length-1];

            if (fileSize <= readsize) {
                break;
            } else if (fileSize < readsize + CHUNK_SIZE) {
                CHUNK_SIZE = fileSize - readsize
                buffer = new Buffer(CHUNK_SIZE);
                lastReadCycle = true;
            }
        }
        return dataPoints;
    }


    endOfFragment(line: Array<string>, DataPoint: LinksDataPoint): boolean {
        //determine is fragment has been fully processed
        if (DataPoint.g1value === "." && DataPoint.g1end !== (parseInt(line[0]))) {
            //deletion on original genome
            return true;
        } else if (DataPoint.g2value === "." && DataPoint.g2end !== (parseInt(line[3]))) {
            //deletion on new genome
            return true;
        } else if (DataPoint.isSNP && (DataPoint.g1end !== (parseInt(line[0]) - 1) || DataPoint.g2end !== (parseInt(line[3]) - 1))) {
            //either SNP or translocation fragment has ended.
            return true;
        } else {
            return false;
        }
    }
}

