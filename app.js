const express = require("express");
const app = express();
const path = require("path");
const mongo = require("mongodb");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const moment = require("moment");
const mongoUtil = require("./modules/mongoUtil");
const http = require("http").Server(app);
const io = require("socket.io")(http);
const cors = require("cors");

const SNPbinning = require("./modules/SNPbinning");
const annotationBinning = require("./modules/annotationBinning");
const transcriptomicCovBinning = require("./modules/transcriptomicCovBinning");
const expressionBinning = require("./modules/expressionBinning");
const diffBinning = require("./modules/diffBinning");
const BAMbinning = require("./modules/BAMbinning");
const fasta = require("./modules/fasta");

var signin = require("./routes/signin");
var signup = require("./routes/signup");
var resetpassword = require("./routes/resetpassword")
var forgetpassword = require ("./routes/forgetpassword")
var getProjects = require("./routes/getProjects");
var addProject = require("./routes/addProject");
var updateProject = require("./routes/updateProject");
var getProjectData = require("./routes/getProjectData");
var uploadFile = require("./routes/uploadFile");
var deleteFile = require("./routes/deleteFile");
var deleteProject = require("./routes/deleteProject");
var getFilesNames = require("./routes/getFilesNames");
var getProjectUsers = require("./routes/getProjectUsers");
var getMatchingUsers = require("./routes/getMatchingUsers");
var inviteUsers = require("./routes/inviteUsers");
var removeUsersFromProject = require("./routes/removeUsersFromProject");
var importFiles = require("./routes/importFiles");
var getBins = require("./routes/getBins");
var getAnnotations = require("./routes/getAnnotations");
var getAnnotationsUnzoomed = require("./routes/getAnnotationsUnzoomed");
var getChromosomes = require("./routes/getChromosomes");
var getCoverage = require("./routes/getCoverage");
var getSNPLinks = require("./routes/getSNPLinks");
var addUsersToProject = require("./routes/addUsersToProject");
var getSNPs = require("./routes/getSNPs");
var addLinkFile = require("./routes/addLinkFile");
var getLinks = require("./routes/getLinks");
var deleteLinkFile = require("./routes/deleteLinkFile");
var getCommitInfo = require("./routes/getCommitInfo");
var ParserMasterClass = require("./public/repositoryParser/parser_master");

/*
//------------https testing---------------
//const express = require('express')
//const path = require('path')
const fs = require('fs')
const https = require('https')

// key
const privateKey = fs.readFileSync(path.join(__dirname, './private.key'), 'utf8')
const certificate = fs.readFileSync(path.join(__dirname, './mydomain.crt'), 'utf8')
const credentials = {
  key: privateKey,
  cert: certificate,
}

// 
//const app = express()

// 

//app.get('/', async (req, res) => {
 // res.status(200).send('Hello World!')
//})

// create https server
const httpsServer = https.createServer(credentials, app)

// ports
const SSLPORT = 443

// listen to porst
httpsServer.listen(SSLPORT, () => {
  console.log(`HTTPS Server is running on: https://localhost:${SSLPORT}`)
})

*/

//---------------------------------

// Import assemblyService
const assemblyService = require("./assemblyService");
app.get("/api/getGenomes", function(req, res) {
  let mongoServiceObj = new assemblyService(req, res);
  mongoServiceObj.getGenomes();
});

// Get single assembly for app page
app.get("/api/getGenome", function(req, res) {
  let mongoServiceObj2 = new assemblyService(req, res);
  mongoServiceObj2.getGenome(req.query.s);
});

// Get single assembly for app page
app.get("/api/getUsers", function(req, res) {
  let mongoServiceObj = new assemblyService(req, res);
  mongoServiceObj.getUsers();
});

app.get("/api/getIssues", function(req, res){
  let mongoServiceObj = new assemblyService(req, res);
  mongoServiceObj.getIssues(req.query.projectID);
})

app.get("/api/functionName", function(req, res){
  let service = new assemblyService(req, res);
  service.functionName(req.query.uName, req.query.pName);
})

app.get("/api/updateProject", function(req, res){
  let service2 = new assemblyService(req,res);
  service2.updateProject(req.query.a, req.query.b, req.query.c);
})

app.get("/api/updateIssue", function(req, res){
  let service = new assemblyService(req, res);
  service.updateIssue(req.query.a, req.query.b, req.query.c);
})

app.get("/api/issueSolved", function(req, res){
  console.log("triggered in app js");
  let service = new assemblyService(req, res);
  service.issueSolved(req.query.projectID, req.query.issueID, req.query.solved, req.query.issue);
})

app.get("/api/updateDescription", function(req,res){
  let service = new assemblyService(req, res);
  service.updateDescription(req.query.a, req.query.b);
})

app.get("/api/getProjects", function(req, res){
  let service3 = new assemblyService(req, res);
  service3.getProjects();
})

app.get("/api/getProject", function(req, res){
  console.log("getProject triggered in app js");
  let service = new assemblyService(req, res);
  service.getProject(req.query.projectID);
})

app.get("/api/submitIssue", function(req, res){
  let service = new assemblyService(req, res);
  service.submitIssue(req.query.a, req.query.b, req.query.c, req.query.d);
})

app.get("/api/getProjectCollaborators", function(req, res){
  let service = new assemblyService(req, res);
  service.getProjectCollaborators(req.query.projectID, req.query.userIDs);
})

app.get("/api/getUserID", function(req,res){
  let service = new assemblyService(req, res);
  service.getUserID(req.query.userName);
})

app.get("/api/addCollaborator", function(req, res){
  let service = new assemblyService(req, res);
  service.addCollaborator(req.query.projectID, req.query.userID, req.query.username);
})

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.resolve("./public")));
app.use(express.static("./image"));

app.use("/signin", signin);
app.use("/signup", signup);
app.use("/resetpassword", resetpassword);
app.use("/forgetpassword", forgetpassword);
app.use("/getProjects", getProjects);
app.use("/addProject", addProject);
app.use("/updateProject", updateProject);
app.use("/getProjectData", getProjectData);
app.use("/uploadFile", uploadFile);
app.use("/deleteFile", deleteFile);
app.use("/deleteProject", deleteProject);
app.use("/getFilesNames", getFilesNames);
app.use("/getProjectUsers", getProjectUsers);
app.use("/getMatchingUsers", getMatchingUsers);
app.use("/inviteUsers", inviteUsers);
app.use("/removeUsersFromProject", removeUsersFromProject);
app.use("/importFiles", importFiles);
app.use("/getBins", getBins);
app.use("/getAnnotations", getAnnotations);
app.use("/getAnnotationsUnzoomed", getAnnotationsUnzoomed);
app.use("/getChromosomes", getChromosomes);
app.use("/getCoverage", getCoverage);
app.use("/getSNPLinks", getSNPLinks);
app.use("/addUsersToProject", addUsersToProject);
app.use("/getSNPs", getSNPs);
app.use("/addLinkFile", addLinkFile);
app.use("/getLinks", getLinks);
app.use("/deleteLinkFile", deleteLinkFile);
app.use("/getCommitInfo", getCommitInfo);

app.use(express.static(path.join(__dirname, "dist")));

// app.get("/", function(req, res) {
//   res.sendFile(path.join(__dirname, "dist/index.html"));
// });

app.get("/*", function(req, res) {
  res.sendFile(path.join(__dirname, "dist/index.html"));
});

http.listen(3000, function() {
  console.log("App listening on port 3000!");
});

let pm = new ParserMasterClass.ParserMaster
pm.startMonitor()

cron.schedule("* */1 * * *", function() {
  var files = [];

  mongoUtil.connectToServer(function(err) {
    if (err) throw err;
    var db = mongoUtil.getDb();
    var dbo = db.db("webcircos");

    dbo.collection("projects").find(
      {
        expire: {
          $lt: moment().unix()
        }
      },
      function(err, cursor) {
        cursor.each(function(err, project) {
          if (project != null) {
            files = files.concat(project.files);
          } else {
            if (files.length > 0) {
              dbo.collection("projects").remove(
                {
                  expire: {
                    $lt: moment().unix()
                  }
                },
                function(err) {
                  if (err) throw err;
                  dbo.collection("files").remove(
                    {
                      _id: {
                        $in: files
                      }
                    },
                    function(err) {
                      dbo.collection("rows").remove(
                        {
                          file: {
                            $in: files
                          }
                        },
                        function(err) {
                          if (err) throw err;

                          dbo.collection("bins").remove(
                            {
                              file: {
                                $in: files
                              }
                            },
                            function(err) {
                              if (err) throw err;
                              db.close();
                            }
                          );

                          db.close();
                        }
                      );
                    }
                  );
                }
              );
            } else {
              db.close();
            }
          }
        });
      }
    );
  });
});

io.on("connection", function(socket) {
  socket.on("new file", function(msg) {
    if (msg.project == "") {
      createTemporaryProject(function(projectID, projectTitle) {
        msg.project = projectID;
        insertNewFile(msg, function(fileID) {
          initBins(msg.format, fileID, msg.fasta, function(id) {
            socket.emit("file inserted", {
              fileID: fileID,
              projectID: projectID,
              projectTitle: projectTitle
            });
          });
        })
      });
    } else {
      insertNewFile(msg, function(fileID) {

        initBins(msg.format, fileID, msg.fasta, function(id){
          socket.emit("file inserted", {
          fileID: fileID
        });});


      })
    }

  });

var lastChunk;
  socket.on("new chunk", function(msg) {
    this.lastChunk= msg.lastChunk;
    var _this=this;
    if(msg.format=="bedcov" || msg.format =="results" || msg.format == "de"){

      updateBins(msg.format, msg.fileID, msg.data, msg.lastChunk, msg.annotationFile,function(data){

        if (msg.data.chr) {
          data.file = mongo.ObjectID(msg.data.file)
        } else {

          for (var i = 0; i <data.length; i++) {
            data[i].file = mongo.ObjectID(msg.fileID);
          }
        }
        mongoUtil.connectToServer(function(err) {
          if (err) throw err;
          var db = mongoUtil.getDb();
          var dbo = db.db("webcircos");

          if (data.length > 0 || msg.data.chr) {
            dbo.collection("rows").insertMany(data, function(err, result) {

              if (err) throw err;

              if (_this.lastChunk) {
                socket.emit("upload complete");
              } else {
                socket.emit("chunk inserted", {
                  pos: msg.pos
                });
              }
              db.close();

            });
          } else {
            socket.emit("upload complete");
          }
        });
      });
    }
    else {


      //console.log("Data send to update bin, " + msg.data.length)
      updateBins(msg.format, msg.fileID, msg.data, msg.lastChunk)


    if (msg.data.chr) {

      msg.data.file = mongo.ObjectID(msg.data.file)
    } else {
      for (var i = 0; i < msg.data.length; i++) {
        msg.data[i].file = mongo.ObjectID(msg.fileID);
      }
    }

    mongoUtil.connectToServer(function(err) {
      if (err) throw err;

      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");


      if (msg.data.length > 0 || msg.data.chr) {
        dbo.collection("rows").insertMany(msg.data, function(err, result) {
          if (err) throw err;
          if (msg.lastChunk) {
            socket.emit("upload complete");
          } else {
            socket.emit("chunk inserted", {
              pos: msg.pos
            });
          }
          db.close();

        });
      } else {
        socket.emit("upload complete");
      }


    });
  }
  });

  socket.on("new fasta", function(msg) {

    //console.log("last chunk received");


    if (msg.project == "") {
      createTemporaryProject(function(projectID, projectTitle) {
        msg.project = projectID;

        fasta.insertNewFasta(msg, function(fileID) {

          socket.emit("upload complete", {fileID: fileID});
        });
      });
    } else {

      fasta.insertNewFasta(msg, function(fileID) {
        socket.emit("upload complete", {fileID: fileID});
      });
    }

  });

});

function initBins(format, file, fasta, callback) {

  switch (format) {
    case "vcf":
      SNPbinning.setSNPbins(file, fasta, filesUploading,function(){callback()});
      break;
    case "annotation":
      annotationBinning.setAnnotationBins(file, fasta, filesUploading,function(){callback()});
      break;
    case "diffExp":
      diffBinning.setDiffBins(file, fasta, filesUploading,function(){callback()});
      break;
      case "de":
        diffBinning.setDiffBins(file, fasta, filesUploading,function(){callback()});
        break;
    case "results":
      expressionBinning.setExpressionbins(file, fasta, filesUploading,function(){callback()});
    break;
    case "bam":
        BAMbinning.setBAMbins(file, fasta, filesUploading,function(){callback()});
    break;
    case "bai":
        BAMbinning.setBAMbins(file, fasta, filesUploading,function(){callback()});
    break;
    case "bedcov":
        transcriptomicCovBinning.setTranscriptomicCovbins(file, fasta, filesUploading,function(){callback()});
    break;
  }
}

function updateBins(format, file, data, lastChunk, annotationFile, callback) {
  switch (format) {
    case "vcf":
      SNPbinning.updateSNPbins(file, data, lastChunk, filesUploading);
      break;
    case "annotation":
      annotationBinning.updateAnnotationBins(file, data, lastChunk, filesUploading);
      break;
    case "diffExp":
      diffBinning.updateDiffBins(file, data, lastChunk, filesUploading);
      break;
      case "bam":
          BAMbinning.updateBAMbins(file, data,lastChunk, filesUploading);
          console.log('updating bam ')
      break;
      case "bai":
          BAMbinning.updateBAMbins(file, data,lastChunk, filesUploading);
          console.log('updating bam ')
      break;
      default:
        //Retrieve the positions from Annotation File
        var _this=this;
        var time =0;
        var lasty=lastChunk;
        if (lastChunk){
          time = 5000;
          if(format=="de")
          time =5000
          console.log(time);
        }

        //Array containing the BioCircos formated lines (chr,pos,value)
        var rows =[];
        //Constructing a list of genes Id from the bedcov file
        var listGeneId = [];
        data.forEach(function(item){
          if (item.chr)
            listGeneId.push(item.chr);
        })
        //console.log(listGeneId)
        //Fetch matching ids in the annotation file in DB
        setTimeout(   makeTimeOut(lasty,callback), time, 'funky');
        function makeTimeOut (last,callbacky){
          return function(){
            fetchGenes (last, callbacky)
          }
        }
          function fetchGenes (last, callbacky) {


        mongoUtil.connectToServer(function(err) {
          if (err) throw err;
          var db = mongoUtil.getDb();
          var dbo = db.db("webcircos");

          dbo.collection("rows").find({
            file: mongo.ObjectID(annotationFile),
            des: { $in: listGeneId }
          },function(err, cursor){
              if(err) throw  err;
              cursor.toArray(function(err, document){
               console.log("New document " +document.length);
                //Looking for the match in listGeneId :
              //  console.log("Document "+document.length)
                document.forEach(function(row,index){
                // console.log("Row "+ index)

                  if(row!==null){
                  for(let i=0;i<data.length;i++){
                    var item=data[i];
                      if (row.des === item.chr){
                        if(format=="de"){
                          rows.push({chr: row.chr, start: Math.floor(row.start), end: Math.floor(row.end), name:row.des, value: item.value});
                        //  console.log({chr: row.chr, start: Math.floor(row.start), end: Math.floor(row.end), name:row.des, value: item.value})
                        }else{
                        rows.push({chr: row.chr, pos: Math.floor((row.start+ row.end)/2), value: item.value});
                        }
                        data.splice(i,1);
                        break;
                      }
                    };
                  }
                  if (index == document.length-1){
                    console.log("updating 1")
                    console.log(last)
                    //console.log(filesUploading)
                    //console.log(file)
                    if(format == "bedcov")
                      transcriptomicCovBinning.updateTranscriptomicCovbins(file, rows,last, filesUploading);
                    else if (format =="results"){
                      expressionBinning.updateExpressionbins(file, rows,last, filesUploading);
                    }
                    else{
                      diffBinning.updateDiffBins  (file, rows,last, filesUploading)
                    }
                    callbacky(rows);
                    return;
                  }
                });

              })

          })
        })
        if (last){
          console.log("Sending Last")
        if(format == "bedcov")
          transcriptomicCovBinning.updateTranscriptomicCovbins(file, rows,last, filesUploading);
        else if(format == "results"){
          expressionBinning.updateExpressionbins(file, rows,last, filesUploading);
        } else {
          diffBinning.updateDiffBins(file,rows,last,filesUploading)
        }
      }
      }

            //Sending the actualized array "rows" containing position and chromosome instead of "data"

      break;
  }
}



var filesUploading = {};

function insertNewFile(data, callback) {

  mongoUtil.connectToServer(function(err) {
    if (err) throw err;
    var db = mongoUtil.getDb();
    var dbo = db.db("webcircos");

    //console.log(data);
    dbo.collection("files").insertOne({
        name: data.name,
        format: data.format,
        fasta: data.fasta,
        projects: [mongo.ObjectID(data.project)],
  		  isManual: data.isManual
      },
      function(err, result) {
        if (err) throw err;
        dbo.collection("projects").update({
          _id: mongo.ObjectID(data.project)
        }, {
          $addToSet: {
            files: result.insertedId
          }
        }, function(err, resultUpdate) {
          if (err) throw err;
          callback(result.insertedId)

          db.close();

        });

      });
  })

}

function createTemporaryProject(callback) {
  mongoUtil.connectToServer(function(err) {
    if (err) throw err;
    var db = mongoUtil.getDb();
    var dbo = db.db("webcircos");
    dbo.collection("meta").findAndModify({}, [], {
      $inc: {
        projectCount: 1
      },
    }, {
      upsert: true,
      new: true
    }, function(err, resultUpdate) {
      var title = "Project " + resultUpdate.value.projectCount
      dbo.collection("projects").insertOne({
        title: title,
        description: "",
        files: [],
        expire: moment().add(7, 'days').unix()
      }, function(err, result) {
        callback(result.insertedId, title);
      });
    });
  });
}
