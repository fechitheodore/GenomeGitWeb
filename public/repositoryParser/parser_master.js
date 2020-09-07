"use strict";
exports.__esModule = true;
///<reference path="../../node_modules/@types/node/index.d.ts"/>
var parseGitRepository = require("./repo_parser");
var that;
var MONGO_URL = 'mongodb://localhost:27017/';
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var ParserMaster = /** @class */ (function () {
    function ParserMaster() {
        this.parser = new parseGitRepository.RepoParser;
    }
    //Git parsing function
    ParserMaster.prototype.startMonitor = function () {
        that = this;
        that.gitSpinner = setInterval(function () {
            that.timer();
        }, 1000);
    };
    ParserMaster.prototype.timer = function () {
        clearInterval(that.gitSpinner);
        //get list of users and their projects
        console.log("Starting git depository processing");
        //that.parser.run("dd", "arabidopsis", that.restartAutoUpdate);
        that.getUsers();
    };
    ParserMaster.prototype.restartAutoUpdate = function () {
        that.gitSpinner = setInterval(function () {
            that.timer();
        }, 120000);
    };
    ParserMaster.prototype.getUsers = function () {
        MongoClient.connect(MONGO_URL, function (err, db) {
            if (err)
                throw err;
            var dbo = db.db("webcircos");
            that.userCounter = 0;
            dbo.collection("users").find().toArray(function (err, res) {
                if (err)
                    throw err;
                db.close();
                that.usersList = res;
                if (that.usersList.length > 0) {
                    that.getUserProjects(that.usersList[that.userCounter].projects);
                }
            });
        });
    };
    ParserMaster.prototype.getUserProjects = function (projectIDs) {
        MongoClient.connect(MONGO_URL, function (err, db) {
            if (err)
                throw err;
            var dbo = db.db("webcircos");
            dbo.collection("projects").find({ _id: { $in: projectIDs } }).toArray(function (err, res) {
                if (err)
                    throw err;
                db.close();
                that.projectsList = res;
                that.projectCounter = 0;
                that.processUserProject();
            });
        });
    };
    ParserMaster.prototype.processUserProject = function () {
        if (that.projectCounter < that.projectsList.length) {
            that.parser.run(that.usersList[that.userCounter].username, that.projectsList[that.projectCounter].title, that.processUserProject);
            console.log(that.usersList[that.userCounter].username);
            console.log(that.projectsList[that.projectCounter].title);
            that.projectCounter++;
            //that.processUserProject();
        }
        else {
            that.userCounter++;
            if (that.userCounter < that.usersList.length) {
                that.getUserProjects(that.usersList[that.userCounter].projects);
            }
            else {
                that.restartAutoUpdate();
            }
        }
    };
    return ParserMaster;
}());
exports.ParserMaster = ParserMaster;
