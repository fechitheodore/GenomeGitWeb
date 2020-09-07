const MongoClient = require("mongodb").MongoClient;
const assert = require("assert");
const url = "mongodb://localhost/webcircos";
var ObjectID = require("mongodb").ObjectID;

var mongoUtil = require('./modules/mongoUtil');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');


class MongoService {
  constructor(req, res) {
    this.req = req;
    this.res = res;
  }

  functionName(userName, projectName) { 

  }

  getGenomes() {
    let self = this;
    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        let collection = db
          .db("webcircos")
          .collection("projects")
          .find({ public: true });

        let genomeList = [];

        collection.each(function (err, doc) {
          assert.equal(err, null);
          if (doc != null) {
            genomeList.push(doc);
          } else {
            return self.res
              .status(200)
              .json({ status: "actual success", data: genomeList });
          }
        });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  getUsers() {
    let self = this;
    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        let collection = db
          .db("webcircos")
          .collection("users")
          .find({});

        let userList = [];

        collection.each(function (err, doc) {
          assert.equal(err, null);
          if (doc != null) {
            userList.push(doc);
          } else {
            return self.res
              .status(200)
              .json({ status: "success", data: userList });
          }
        });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  getGenome(id) {
    let oid = new ObjectID(id);
    let self = this;
    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.db("webcircos")
          .collection("projects")
          .findOne({ _id: oid }, function (err, result) {
            if (err) {
              console.log(err);
            } else {
              self.res.json(result);
            }
          });
        let genomeList = [];
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  updateProject(a, b, c) {
    let self = this;
    var isPublic = c == "true";
    var userId = new ObjectID(b);
    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        var newValues = { $set: { public: isPublic } };
        db.db("webcircos")
          .collection("projects")
          .updateOne(
            { title: a, users: { $in: [userId] } },
            newValues,
            function (err, result) {
              if (err) {
                throw err;
              } else {
                return self.res.status(200).json({status: "Success at updateProject"});
              }
            }
          );
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  updateIssue(a, b, c) {
    let self = this;
    var isSolved = a;
    var ID = new ObjectID(b);
    var issueID = new ObjectID(c);    
    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        var newValues = { $set: { issues: issueID[{ 2: isSolved }] } };
        db.db("webcircos")
          .collection("projects")
          .updateOne({ _id: ID }, newValues, function (err, result) {
            if (err) throw (err);
          });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  issueSolved(projectId, issueId, solved, index){
    console.log(projectId, issueId, solved, index);
    var x = index;
    var setter = "{$set: {\"issues." + x + ".solved\": \"true\"}}";
    var issuesSolved = `issues.${x}.solved`;
    issuesSolved = issuesSolved.toString();
    var query = { [issuesSolved]: true};
    console.log(query);
    let self = this;
    var projectID = new ObjectID(projectId);
    var issueID = new ObjectID(issueId);
    try{
      MongoClient.connect(url, function(err, db){
        assert.equal(null, err);
        var isSolved = {$set: {solved: solved}};
        db.db("webcircos").collection("projects").update({_id: projectID}, {$set: query}, {upsert: true}, function(err, result){
          if (err) throw err;
          if (result) {
            console.log(result);
            return self.res.status(200).json({status: "Success at issueSolved"});
          }
        });        
        db.close();
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  updateDescription(a, b){
    var ID = new ObjectID(b);
    let self = this;
    try{
      MongoClient.connect(url, function(err, db){
        assert.equal(null, err);
        db.db("webcircos").collection("projects").updateOne({_id: ID}, {$set: {description: a}}, function(err, result){
          if (err) throw err;
          if (result) self.res.status(200).json({status: "Update description success"});
        });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  getIssues(projectId) {
    var ID = new ObjectID(projectId);
    let self = this;
    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.db("webcircos")
          .collection("projects")
          .findOne({ _id: ID }, function (err, result) {
            if (err) {
              console.log(err);
            } else {
              self.res.json(result);
            }
          });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  getProjects() {
    let self = this;
    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        let collection = db
          .db("webcircos")
          .collection("projects")
          .find({ public: true });

        let projectList = [];

        collection.each(function (err, doc) {
          assert.equal(err, null);
          if (doc != null) {
            projectList.push(doc);
          } else {
            return self.res
              .status(200)
              .json({ status: "actual success", data: projectList });
          }
        });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  getProject(projectid){
    let ID = new ObjectID(projectid);
    console.log(ID);
    let self = this;
    try{
      MongoClient.connect(url, function (err, db){
        assert.equal(null, err);
        db.db("webcircos").collection("projects").findOne({_id: ID}, function(err, result){
          if (err) throw err;
          if (result) {
            return self.res.status(200).json({status: "Success: project found", data: result});
          }
        });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  submitIssue(title, comment, id, userName) {
    var issueID = new ObjectID();
    var isSolved = false;
    var newDate = new Date();
    var newValues = {
      $push: {"issues": {_id: issueID, title: title, comment: comment, solved: isSolved, date: newDate, user: userName}}
    };
    var ID = new ObjectID(id);
    let self = this;
    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.db("webcircos")
          .collection("projects")
          .updateOne({ _id: ID }, newValues, function (err, result) {
            if (err) throw (err);
          });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  addCollaborator(projectId, userId, username) {
    let self = this;
    var ID = new ObjectID(projectId);
    var userID = new ObjectID(userId);
    var newUser = { $push: { users: new ObjectID(userId) } };
    var newProject = { $push: { projects: ID } };


    var transport = nodemailer.createTransport(smtpTransport({
      host: "smtp.gmail.com", //main mail use
      secure: true, // use ssl
      secureConnection: true, // use ssl
      port: 465, // SMPT port SSL required
      auth: {
        user: "genomegit@gmail.com", // account
        pass: "genomegit123456" // password
      }
    }));



    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.db("webcircos")
          .collection("projects")
          .updateOne({ _id: ID }, newUser, function (err, result) {
            if (err) throw err;
          });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.db("webcircos")
          .collection("users")
          .updateOne({ _id: userID }, newProject, function (err, result) {
            if (err) throw err;
          });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }

    try{
      mongoUtil.connectToServer(function(err){
        if(err) throw err;
        var db = mongoUtil.getDb();
        var dbo = db.db("webcircos");
        dbo.collection("users").findOne({_id: userID}, function(err, result){

          var mailOptions = {
            from: "GenomeGit<genomegit@gmail.com>", // email which uses for send the email
            to: result.email, // receive the email
            subject: "New Project", // header
            //text:"reset password ",
            html: username + " has added you to a new project."+"\n\n"
            // html content 
          }
                      // send the email
                      transport.sendMail(mailOptions, function(error, response) {
                        if (error) {
                          console.error(error);
                        } else {
                          console.log(response);
                        }
                        transport.close(); // close the linking if not using 
                      });
        })
      })

    }catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  getUserID(userName) {
    let self = this;
    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.db("webcircos")
          .collection("users")
          .findOne({ username: userName }, function (err, result) {
            return self.res
              .status(200)
              .json({ status: "Success", data: result._id });
          });
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }

  getProjectCollaborators(projectID, userIDs) {
    let self = this;
    var userids = [];

    if (userIDs.length === 24) {
      userids.push(new ObjectID(userIDs));
    } else {
      for (var i = 0; i < userIDs.length; i++) {
        userids.push(new ObjectID(userIDs[i]));
      }
    }

    try {
      MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        var users = [];

        db.db("webcircos")
          .collection("users")
          .find({ _id: { $in: userids } })
          .toArray(function (err, result) {
            if (err) throw err;
            return self.res.json({ status: "Success", data: result });
          });
        db.close();
      });
    } catch (error) {
      return self.res.status(500).json({
        status: "error",
        error: error
      });
    }
  }
}
module.exports = MongoService;
