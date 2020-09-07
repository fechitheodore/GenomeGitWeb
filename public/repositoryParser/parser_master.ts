///<reference path="../../node_modules/@types/node/index.d.ts"/>
var parseGitRepository = require("./repo_parser");
var that: ParserMaster;
const MONGO_URL = 'mongodb://localhost:27017/';
var mongodb = require("mongodb");
var MongoClient = mongodb.MongoClient;

export class ParserMaster {

    parser = new parseGitRepository.RepoParser
    gitSpinner: any;
    userCounter: number;
    projectCounter: number;
    usersList: any[];
    projectsList: any[];

    //Git parsing function
    startMonitor(): void {
        that = this;
        that.gitSpinner = setInterval(function () {
            that.timer();
        }, 1000);
    }

    timer(): void {
        clearInterval(that.gitSpinner);
        //get list of users and their projects
        console.log("Starting git repository processing");
        //that.parser.run("dd", "arabidopsis", that.restartAutoUpdate);
        that.getUsers();
    }

    restartAutoUpdate(): void {
        that.gitSpinner = setInterval(function () {
            that.timer();
        }, 120000);
    }


    getUsers(): void {
        MongoClient.connect(MONGO_URL, function (err, db) {
            if (err) throw err;
            var dbo = db.db("webcircos");
            that.userCounter = 0
            dbo.collection("users").find().toArray(function (err, res) {
                if (err) throw err;
                db.close();
                that.usersList = res;
                if (that.usersList.length > 0) {
                    that.getUserProjects(that.usersList[that.userCounter].projects)
                }
            });
        });

    }

    getUserProjects(projectIDs): void {
        MongoClient.connect(MONGO_URL, function (err, db) {
            if (err) throw err;
            var dbo = db.db("webcircos");
            dbo.collection("projects").find({ _id: { $in: projectIDs } }).toArray(function (err, res) {
                if (err) throw err;
                db.close();
                that.projectsList = res;
                that.projectCounter = 0;
                that.processUserProject()
            });
        });
    }

    processUserProject() {
        if (that.projectCounter < that.projectsList.length) {
            that.parser.run(that.usersList[that.userCounter].username, that.projectsList[that.projectCounter].title, that.processUserProject);
            console.log(that.usersList[that.userCounter].username);
            console.log(that.projectsList[that.projectCounter].title);
            that.projectCounter++;
            //that.processUserProject();
        } else {
            that.userCounter++
            if (that.userCounter < that.usersList.length) {
                that.getUserProjects(that.usersList[that.userCounter].projects)
            } else {
                that.restartAutoUpdate();
            }
            
        }

    }

}

