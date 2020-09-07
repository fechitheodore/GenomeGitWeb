"use strict";
exports.__esModule = true;
var MONGO_URL = 'mongodb://localhost:27017/';
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;
var execProcess = require("../public/repositoryParser/exec_process");
var environment_1 = require("../src/environments/environment");
var that;
var ProjectEraser = /** @class */ (function () {
    function ProjectEraser() {
    }
    ProjectEraser.prototype.collectProjectData = function (projectId, userName) {
        that = this;
        that.eraserData = new ProjectEraserData;
        that.eraserData.projectID = projectId;
        that.eraserData.userName = userName;
        //get all fileIDs in the project
        MongoClient.connect(MONGO_URL, function (err, db) {
            if (err)
                throw err;
            var dbo = db.db("webcircos");
            dbo.collection("projects").findOne({ _id: mongodb.ObjectId(that.eraserData.projectID) }, function (err, result) {
                if (err)
                    throw err;
                if (result === null) {
                    that.deleteProject(that.eraserData);
                    db.close;
                    return false;
                }
                that.eraserData.fileIDs = result.files;
                that.eraserData.projectName = result.title;
                //get files in other projects
                dbo.collection("projects").aggregate([{ $match: { _id: { $ne: mongodb.ObjectId(that.eraserData.projectID) } } },
                    { $project: { a: '$files' } }, { $unwind: '$a' }, { $group: { _id: 'a', res: { $addToSet: '$a' } } }]).toArray(function (err, result) {
                    if (err)
                        throw err;
                    if (result === null) {
                        that.deleteProject(that.eraserData);
                        db.close;
                        return false;
                    }
                    var allFiles = that.eraserData.fileIDs;
                    that.eraserData.fileIDs = [];
                    for (var _i = 0, allFiles_1 = allFiles; _i < allFiles_1.length; _i++) {
                        var id = allFiles_1[_i];
                        if (result[0].res && !result[0].res.includes(id)) {
                            //only delete files unique to the project
                            that.eraserData.fileIDs.push(id);
                        }
                    }
                    dbo.collection("commits").find({ $and: [{ project: that.eraserData.projectName }, { user: that.eraserData.userName }] }).toArray(function (err, res) {
                        if (err)
                            throw err;
                        if (res === null) {
                            that.deleteProject(that.eraserData);
                            db.close;
                            return false;
                        }
                        that.eraserData.commitIDs = [];
                        for (var i = 0; i < res.length; i++) {
                            that.eraserData.commitIDs.push(res[i]._id);
                        }
                        dbo.collection("linkFiles").find({ $and: [{ OldFasta: { $in: allFiles } }, { NewFasta: { $in: allFiles } }] }).toArray(function (err, res) {
                            if (err)
                                throw err;
                            if (res === null) {
                                that.deleteProject(that.eraserData);
                                db.close;
                                return false;
                            }
                            for (var i = 0; i < res.length; i++) {
                                that.eraserData.linkFileIDs.push(res[i]._id);
                            }
                            //console.log(that.eraserData);
                            that.deleteProject(that.eraserData);
                        });
                    });
                });
            });
        });
        return true;
    };
    ProjectEraser.prototype.deleteProject = function (eraserData) {
        MongoClient.connect(MONGO_URL, function (err, db) {
            if (err)
                throw err;
            var dbo = db.db("webcircos");
            dbo.collection("projects").deleteMany({ _id: mongodb.ObjectId(that.eraserData.projectID) }, function (err, result) { });
            dbo.collection("users").update({}, { $pull: { projects: mongodb.ObjectId(that.eraserData.projectID) } }, { multi: true });
            dbo.collection("gitFiles").deleteMany({ projectID: mongodb.ObjectId(that.eraserData.projectID) }, function (err, result) { });
            if (that.eraserData.commitIDs && that.eraserData.commitIDs.length > 0) {
                dbo.collection("commits").deleteMany({ _id: { $in: that.eraserData.commitIDs } }, function (err, result) { });
            }
            console.log("fileIDs");
            console.log(that.eraserData.fileIDs);
            if (that.eraserData.fileIDs && that.eraserData.fileIDs.length > 0) {
                dbo.collection("fasta").deleteMany({ _id: { $in: that.eraserData.fileIDs } }, function (err, result) { });
                dbo.collection("files").deleteMany({ _id: { $in: that.eraserData.fileIDs } }, function (err, result) { });
                dbo.collection("bins").deleteMany({ file: { $in: that.eraserData.fileIDs } }, function (err, result) { });
                dbo.collection("rows").deleteMany({ file: { $in: that.eraserData.fileIDs } }, function (err, result) { });
                dbo.collection("linkFiles").deleteMany({
                    $and: [{ OldFasta: { $in: that.eraserData.fileIDsAsString } },
                        { NewFasta: { $in: that.eraserData.fileIDsAsString } }]
                }, function (err, result) { });
            }
            if (that.eraserData.linkFileIDs && that.eraserData.linkFileIDs.length > 0) {
                dbo.collection("linksData").deleteMany({ linkFileID: { $in: that.eraserData.linkFileIDs } }, function (err, result) { });
            }
            db.close();
        });
        var fs = require("fs");
        var projDir = environment_1.environment.gitDirectory + that.eraserData.userName + "/" + that.eraserData.projectName;
        console.log(projDir);
        if (fs.existsSync(projDir)) {
            execProcess.result("bash ./routes/rmdir.sh " + projDir, function () { });
        }
        console.log("Project Deleted");
        return true;
    };
    return ProjectEraser;
}());
exports.ProjectEraser = ProjectEraser;
var ProjectEraserData = /** @class */ (function () {
    function ProjectEraserData() {
    }
    Object.defineProperty(ProjectEraserData.prototype, "fileIDsAsString", {
        get: function () {
            var result = [];
            for (var _i = 0, _a = this.fileIDs; _i < _a.length; _i++) {
                var file = _a[_i];
                result.push(file.toString());
            }
            return result;
        },
        enumerable: true,
        configurable: true
    });
    return ProjectEraserData;
}());
