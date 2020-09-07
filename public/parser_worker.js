onmessage = function(e) {

  if (e.data[6]) { //if in production
    importScripts('http://138.250.31.98:3000/parsers.js', 'http://138.250.31.98:3000/socket.io.js', 'http://138.250.31.98:3000/bam.iobio2.js')
  } else {
    importScripts('http://localhost:3000/parsers.js', 'http://localhost:3000/socket.io.js', 'http://localhost:3000/bam.iobio2.js');
  }

  var socket = io();

  var file = e.data[0];
  var header;
  var project = e.data[1];
  var selectedFasta = e.data[3];
  var fileSize = file.size;
  parsers.recognise_file(file, function(format) {
    var fasta = [];
    var stack = []
    var processing = [null, null, null, null, null]; //store the chunks being currently uploaded
    var nbInProcess = 0;
    var fileID;
    var nextLoad = e.data[4];
    sizeUploaded = 0;
    if (format == "fasta") {

      var chromosomes = [];
      var chromosomeSignature = e.data[5];



      postMessage({
        name: file.name,
        init: true,
      });
      parsers.parseFile(file, nextLoad, format, null, function(e) {

        var chr = Object.assign({}, e);
        if (chr.data.length > 0)
          chromosomes.push(chr.data);
        sizeUploaded += e.sizeUploaded;
        postMessage({
          name: file.name,
          value: 100 * (sizeUploaded / fileSize)
        });
        if (chr.lastChunk) {
          socket.emit("new fasta", {
            name: file.name,
            project: project,
            data: chromosomes
          });
        }
      }, function(err) {
        postMessage({
          error: err
        });
      }, chromosomeSignature)
    } else if (format == "bam" && !(nextLoad.list.get(nextLoad.file) == "bai")) {

      postMessage({
        name: file.name,
        file: file,
        format: format,
        IsBam: true
      });
    } else if (format == "bai" && !(nextLoad.list.get(nextLoad.file) == "bam")) {

      postMessage({
        name: file.name,
        file: file,
        format: format,
        IsBai: true
      });
    } else {
      //sends a request to the server to initialize the file in the database


      startUpload = function(file, format, e, selectedFasta, m_header) {
        header = m_header;
        socket.emit('new file', {
          name: file.name,
          format: format,
          project: e.data[1],
          token: e.data[2],
          fasta: selectedFasta,
		      isManual: true
        });
      }

      if (format == "vcf") {
        parsers.getVCFHeader(file, format, e, selectedFasta, startUpload, function(err) { //checks if the header for the vcf is okay (only one genome)
          postMessage({
            error:err
          });
        })
      } else {
        startUpload(file, format, e, selectedFasta)
      }

    }

    socket.on('error', (error) => {
      console.log("SOCKET ERROR");
      console.log(error);
    });

    //once the server has created the file
    socket.on('file inserted', function(msg) {

      if (msg.project) { //if a new temporary project has been created
        postMessage({
          name: file.name,
          init: true,
          project: msg.project,
          fasta: selectedFasta,
          projectTitle: msg.projectTitle
        }); //send a message to the project-manel to add the file to the upload list and display the progress bar
      } else {
        postMessage({
          name: file.name,
          fasta: selectedFasta,
          init: true,
        });
      }


      fileID = msg.fileID;

      var workerResult = parsers.parseFile(file, nextLoad, format, header, function(e) {

        if (format == "fasta") {
          var chr = Object.assign({}, e);
          if (e.data.length > 0) {
            fasta.push(e.data);
          }
          //console.log(e);
          sizeUploaded += e.sizeUploaded;
          postMessage({
            name: file.name,
            value: 100 * (sizeUploaded / fileSize)
          });
          if (chr.lastChunk) {

            socket.emit("new chunck", {
              data: {
                chr: fasta,
                file: fileID
              },
              fileID: fileID,
              pos: 0,
              format: format,
              lastChunk: true
            });
          }
        } else if ((format == "bam" || format == "bai") && (!(nextLoad.list.get(nextLoad.file) == "bai") && !(nextLoad.list.get(nextLoad.file) == "bam"))) {
          //Don't add anything if bam / bai file is alone
          console.log("BAM or BAI alone, waiting for next file")
        } else {
          //console.log("sending chunks")
          if (nbInProcess < 5) {

            for (var i = 0; i < processing.length; i++) {
              if (processing[i] == null) {

                processing[i] = Object.assign({}, e);
                if (e.lastChunk) {
                  console.log("last Chunk received in parsers_worker.js, Emmiting last chunk")
                  socket.emit("new chunck", {
                    data: e.data,
                    fileID: fileID,
                    pos: i,
                    format: format,
                    lastChunk: true,
                    annotationFile: nextLoad.file
                  });
                } else {
                  socket.emit("new chunck", {
                    data: e.data,
                    fileID: fileID,
                    pos: i,
                    format: format,
                    annotationFile: nextLoad.file
                  });
                }

                nbInProcess++;
                break;
              }
            }
          } else {
            stack.push(Object.assign({}, e));
          }
          if (stack.length > 10) {

            parsers.canReadNext = false;
          }
        }



      }, function(err, fatal) {
        postMessage({
          error: err,
          fatal: fatal
        });
      });
    })

    socket.on('upload complete', function(msg) {
      var id;
      if (msg)
        id = msg.fileID;
      else
        id = fileID;

      postMessage({
        name: file.name,
        value: 100,
        format: format,
        id: id
      });

    });

    socket.on('chunck inserted', function(msg) {


      sizeUploaded += processing[msg.pos].sizeUploaded;

      if ((format == "bam" || format == "bai")) {
        //sizeUploaded is directly the process percentage
        postMessage({
          name: file.name,
          value: sizeUploaded
        });
      } else {

        postMessage({
          name: file.name,
          value: 100 * (sizeUploaded / fileSize)
        });
      }
      if (stack.length > 0) {
        processing[msg.pos] = stack.shift();

        if (processing[msg.pos].lastChunk) {
          console.log("Last Chunk sent to db" + file.name);
          socket.emit("new chunck", {
            data: processing[msg.pos].data,
            pos: msg.pos,
            lastChunk: true,
            fileID: fileID,
            format: format,
            annotationFile: nextLoad.file
          });
        } else {

          socket.emit("new chunck", {
            data: processing[msg.pos].data,
            fileID: fileID,
            pos: msg.pos,
            format: format,
            annotationFile: nextLoad.file
          });
        }


        if (stack.length < 10) {

          parsers.canReadNext = true;
        }
      } else {
        nbInProcess--;
        processing[msg.pos] = null;
        if (nbInProcess == 0) {

        }
      }

    })
  }, function(err) {
    postMessage({
      error_file: err
    });



  });
}
