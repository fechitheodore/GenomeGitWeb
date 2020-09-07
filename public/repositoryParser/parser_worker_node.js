//const io = require("socket.io");
const path = require('path');
// const express = require('express')
// const app = express()
//const http = require('http').Server("http://localhost:3000");
//var socket_client = require('socket.io-client');
//var io = socket_client.connect('http://localhost:3000', { reconnect: true });

var self = undefined;
module.exports = class ParserWorkerNode {

    constructor() {
        this.socket_client = require('socket.io-client');
        this.io = this.socket_client.connect('http://localhost:3000', { reconnect: true });
    }

    startUpload(file, format, e, selectedFasta, m_header) {
        this.header = m_header;
        this.io.emit('new file', {
            name: path.posix.basename(file),
            format: format,
            project: this.e.projectID,
            token: this.e.userToken,
            hash: self.hash,
            fasta: selectedFasta
        });
    }

    //potential problem
    parseFileCallback(e) {
        var chr = Object.assign({}, e);
        self.io.emit("new fasta", {
            name: chr.file,
            project: self.project,
            data: chr.data,
            hash: self.hash
        });
    };

    fileInsertedCallback(msg) {
        let fileID = msg.fileID;
        let workerResult = self.parser.parseFile(self.file, self.e.nextLoad, self.format, self.header, function (e) {

            if (self.format == "fasta") {
                var chr = Object.assign({}, e);
                if (e.data.length > 0) {
                    self.fasta.push(e.data);
                }
                self.sizeUploaded += e.sizeUploaded;

                if (chr.lastChunk) {
                    self.io.emit("new chunk", {
                        data: {
                            chr: self.fasta,
                            file: fileID
                        },
                        fileID: fileID,
                        pos: 0,
                        format: self.format,
                        lastChunk: true
                    });
                }
            } else if ((self.format == "bam" || self.format == "bai") && (!(self.nextLoad.list.get(self.nextLoad.file) == "bai")
                && !(self.nextLoad.list.get(self.nextLoad.file) == "bam"))) {
                //Don't add anything if bam / bai file is alone
                console.log("BAM or BAI alone, waiting for next file")
            } else {
                 self.io.emit("new chunk", {
                    data: e.data,
                    fileID: fileID,
                    pos: e.pos,
                    format: self.format,
                    lastChunk: e.lastChunk,
                    annotationFile: self.file
                });
            }

        }, function (err, fatal) {
        });
    }

    processingFinishedCallback() {
        self.io.disconnect();
        self.processnext(self.file);
    }


    getfilename() {
        return self.file.toString();
    }

    
    recogniseFileCallbackfunction(format) {
        this.fasta = [];
        this.fileID;
        var nextLoad = this.e.nextLoad;
        this.format = format;
        //sizeUploaded = 0;
        if (format == "fasta") {

            console.log("Starting " + path.posix.basename(this.file));

            this.parser.parseFile(this.file, nextLoad, format, null, this.parseFileCallback, function (err) {

            })
        } else if (format == "bam" && !(nextLoad.list.get(nextLoad.file) == "bai")) {

        } else if (format == "bai" && !(nextLoad.list.get(nextLoad.file) == "bam")) {


       } else {
            //sends a request to the server to initialize the file in the database

            //console.log("saving File");
            if (format == "vcf") {
                this.parser.getVCFHeader(this.file, format, this.e, this.selectedFasta, this, function (err) { //checks if the header for the vcf is okay (only one genome)

                })
            } else {
                this.startUpload(this.file, format, this.e, this.selectedFasta)
            }

        }

        this.io.on('error', (error) => {
            console.log("SOCKET ERROR");
            console.log(error);
        });

        //once the server has created the file
        //console.log
        this.io.on('file inserted', this.fileInsertedCallback);

        this.io.on('upload complete', this.processingFinishedCallback);

    }

    onmessage(e, processnext) {
        self = this;
        this.e = e;
        this.ParserClass = require("./parsers_node");
        this.parser = new this.ParserClass();
        //var parsers = require("../bam.iobio2");
        this.processnext = processnext;
        this.file = e.fileName;
        this.hash = e.fileHash;
        var header;
        this.project = e.projectID;
        this.selectedFasta = e.selectedFasta;
        this.parser.recognise_file(this.file, this, function (err) {
            console.log(err)

        });
    }

}

//exports.onmessage = onmessage;