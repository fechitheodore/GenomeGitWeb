///<reference path="../../node_modules/@types/node/index.d.ts"/>
import { LinksParser } from "./parse_links";
import {CommitInfo, FileInfo, LinksDataPoint, FastaLink} from "./parser_types";
import { environment } from '../../src/environments/environment';

const path = require('path');
var execProcess = require("./exec_process.js");
var mongodb = require("mongodb");
var linkParser: LinksParser = new LinksParser;
var MongoClient = mongodb.MongoClient;
const DATA_DIRECTORY = environment.gitDirectory;
const MONGO_URL = 'mongodb://localhost:27017/';
var that: RepoParser;

export class RepoParser {
	user: string;
	project: string;
	hashes: Array<any> = [];
	commits: Array<CommitInfo> = [];
	files: Array<FileInfo> = [];
	processedCommits: number;
	restartParser: any;
	fileCounter: number;
	userToken: string;
	userID: string;
	projectID: string;
	currentFile: FileInfo;
	fastaHash: string;
	newCommits: Array<CommitInfo> = [];
	linksCounter: number;
	linksData: Array<FastaLink> = []

	fileTest() {
		console.log("tested")
	}

	run(user: string, project: string, appJSCallBack) {
		that = this;

		this.user = user;
		this.project = project;
		this.hashes = [];
		this.processedCommits = 0;
		this.restartParser = appJSCallBack;

		//get usertoken and project id, both are required
		MongoClient.connect(MONGO_URL, function (err, db) {
			if (err) throw err;
			var dbo = db.db("webcircos");

			dbo.collection("users").find({ username: that.user }).toArray(function (err, result) {
				if (err) throw err;
				that.userToken = result[0].token;
				that.userID = result[0]._id;
				dbo.collection("projects").find({ users: that.userID, title: that.project }).toArray(function (err, result) {
					if (err) throw err;
					that.projectID = result[0]._id;
					db.close();
					//start process of processing commits for current user
					execProcess.result("bash ./public/repositoryParser/listcommits.sh " + DATA_DIRECTORY.concat(that.user).concat("/").concat(that.project), that.identifyNewCommits);
				});
			});
		})

		//get list of git commits in the current project


	}

	identifyNewCommits(err, response): void {
		if (response === "") {
			//no commits in folder
			that.finishedProject();
		} else {
			if (!err) {
				//store commit hashes, user and project in database. Boolean field "processed" will tell if commit has already been processed
				response = response.split('\n');
				//every line contains a tab separated values of commithash, commitdate, commitmessage
				//the git list of commits is \n separated string with trailing \n at the end, hense last item of array should be removed
				//actual commits collection insertion
				//response.splice(response.length - 1, 1);
				that.commits = [];
				let commitHashes = [];
				for (let i = 0; i < response.length; i++) {
					//commits are recorded in log in reverse order with latest on top
					let temp=response[i].split("\t")
					let newCommitInfo = new CommitInfo;
					newCommitInfo.commitHash = temp[0];
					newCommitInfo.created=new Date(temp[1]);
					newCommitInfo.message=temp[2];
					newCommitInfo.processed = false;
					newCommitInfo.project = that.project;
					newCommitInfo.user = that.user;
					that.commits.push(newCommitInfo);
					commitHashes.push(temp[0])
				}

				MongoClient.connect(MONGO_URL, function (err, db) {
					if (err) throw err;
					var dbo = db.db("webcircos");
					dbo.collection("commits").find({ commitHash: { $in: commitHashes } }).toArray(function (err, res) {
						if (err) throw err;
						db.close();
						//get the genomeGit content of git archives
						for (let i = 0; i < res.length; i++) {
							for (let k = 0; k < that.commits.length; k++) {
								if (that.commits[k].commitHash === res[i].commitHash) {
									that.commits[k].processed = res[i].processed;
									break;
								}
							}
						}
						that.insertNewCommits();
					});
				});

			} else {
				console.log(err);
			}
		}

	}

	insertNewCommits(): void {
		that.newCommits = [];
		for (let commit of that.commits) {
			if (!commit.processed) {
				that.newCommits.push(commit);
			}
		}
		if (that.newCommits.length === 0) {
			that.finishedProject();
		} else {
			//add newly commited data to database.
			MongoClient.connect(MONGO_URL, function (err, db) {
				if (err) throw err;
				var dbo = db.db("webcircos");
				dbo.collection("commits").insertMany(that.newCommits, function (err, res) {
					if (err) throw err;
					console.log(that.newCommits.length + " new commits inserted");
					db.close();
					//get the genomeGit content of git archives
					that.getCommitsFilesList();
				});
			});
		}
	}

	getCommitsFilesList(): void {
		if (that.processedCommits < that.commits.length && that.commits[that.processedCommits].processed) {
			//indicates that commit was processed at some previous point, so skip it
			// console.log("Commit already processed: " + that.commits[that.processedCommits].commitHash)
			that.processedCommits++;
			that.getCommitsFilesList();
		} else if (that.processedCommits < that.commits.length) {
			// console.log("processing commit: ".concat(that.processedCommits.toString()));
			//process commit files excluding links
			execProcess.result("bash  ./public/repositoryParser/fileslist.sh " + DATA_DIRECTORY.concat(that.user).concat("/").
				concat(that.project) + " " + that.commits[that.processedCommits].commitHash + " " + __dirname, that.getFileHashes);
		} else {
			//that.finishedProject();
			that.processedCommits = 0;
			// console.log(that.newCommits);
			that.processCommitLinks(that.newCommits[that.processedCommits]);
		}
	}

	finishedProject() {
		console.log("DONE !!!")
		that.restartParser();
	}

	getFileHashes(err, response): void {
		if (!err) {
			response = JSON.parse(response)
			that.files = [];
			for (let i = 0; i < response.length; i++) {
				let newFile = new FileInfo;
				newFile.commitHash = response[i].commitHash;
				newFile.fileHash = response[i].fileHash;
				newFile.fileName = response[i].name;
				newFile.dataset = response[i].dataset;
				newFile.projectID = that.projectID;
				newFile.userName = that.user;
				that.files.push(newFile);
			}
			MongoClient.connect(MONGO_URL, function (err, db) {
				if (err) throw err;
				var dbo = db.db("webcircos");
				//this collection can be used to trace the files back to where they are stored on VM
				//this specific call doesn't spawn anything, so callback is unnecessary
				dbo.collection("gitFiles").insertMany(that.files, function (err, res) {
					if (err) throw err;
					db.close();
				});


				//insert first Genome file, this loop never actually runs through all items because only first fasta will be insertd
				//after which non-fasta files will be inserted via recursive insertNonGenome()
				for (let i = 0; i < that.files.length; i++) {
					if (that.files[i].dataset === "Genome") {
						that.currentFile = that.files[i];
						that.currentFile.userToken = that.userToken;
						that.currentFile.selectedFasta = undefined;
						that.currentFile.nextLoad = null;

						that.checkFileExists(that.currentFile, "fasta");
						break; //important to avoid changing current file in case there are multiple genome files.
					}
				}

			});
		} else {
			console.log(err);
		}
	}

	checkFileExists(fileInfo: FileInfo, collectionName: string): void {
		that.currentFile = fileInfo;
		MongoClient.connect(MONGO_URL, function (err, db) {
			var dbo = db.db("webcircos");
			var query = { hash: fileInfo.fileHash };
			dbo.collection(collectionName).find(query).toArray(function (err, result) {
				if (err) throw err;
				db.close();
				if (collectionName === "fasta" && result.length === 0) {
					//new genome file, insert it
					that.insertGenome(fileInfo);
					that.fileCounter = 0;
				} else if (collectionName === "fasta" && result.length !== 0) {
					//fasta file already exists, add it to projects and move to next file
					that.fastaHash = result[0]._id;
					//addFileToProject() doesn't need to be run sequentially
					that.addFileToProject(that.projectID, that.fastaHash, true);

					that.updateSelectedFasta(result[0]._id);
					//0 is arbitrary, after processing fasta we need to iterate over the entire collection of files
					//to catch all non-fasta files
					that.fileCounter = 0;
					that.checkFileExists(that.files[that.fileCounter], "files");
				} else if (collectionName === "files" && result.length !== 0 && fileInfo.dataset !== "Genome") {
					//non-fasta file already exists, add it to projects and move to next file
					that.addFileToProject(that.projectID, result[0]._id, false);
					//that.fileExists(that.files[that.fileCounter],"files");
					that.processNextNonFasta();
				} else if (collectionName === "files" && result.length === 0 && fileInfo.dataset !== "Genome") {
					that.insertNonGenome();
				} else if (collectionName === "files" && fileInfo.dataset === "Genome") {
					//covers case after genome has been added, but same or another genome file is encountered
					that.processNextNonFasta();
					//that.fileExists(that.files[that.fileCounter],"files");
				}


			});
		});
	}

	insertGenome(fileInfo: FileInfo): void {
		var parserWorkerClass = require("./parser_worker_node");
		var parser_worker = new parserWorkerClass();
		that.currentFile.fileName = DATA_DIRECTORY.concat(that.user).concat("/").concat(that.project).concat("/")
			.concat(fileInfo.commitHash).concat("/").concat(fileInfo.fileName);

		//this starts the actual parsing process of the file. The file is opened by parser_worker
		parser_worker.onmessage(that.currentFile, function (processedFileName) {

			//call back after fasta file has been inserted. This proceeds to insert non-fasta files 
			//via recursive insertNonGenome function
			//i.e. it calls itthat to iterate over all the files sequentially.
			console.log("processed ".concat(path.posix.basename(processedFileName)));

			that.getFasta(fileInfo.fileHash);

		});
	}

	getFasta(fileHash: string) {
		MongoClient.connect(MONGO_URL, function (err, db) {
			if (err) throw err;
			var dbo = db.db("webcircos");
			dbo.collection("fasta").findOne({ hash: fileHash }, function (err, result) {
				if (err) throw err;
				db.close();
				that.updateSelectedFasta(result._id);
				//0 is arbitrary, we need to iterate over the entire collection
				that.checkFileExists(that.files[0], "files");
			})
		});
	}

	insertNonGenome(): void {
		console.log("file counter " + that.fileCounter.toString());

		if (that.fileCounter < that.files.length && that.files[that.fileCounter].dataset != "Genome") {
			that.currentFile.fileName = DATA_DIRECTORY.concat(that.user).concat("/").concat(that.project).concat("/")
				.concat(that.files[that.fileCounter].commitHash).concat("/").concat(that.files[that.fileCounter].fileName);

			var parserWorkerLocalClass = require("./parser_worker_node.js");
			var parserWorkerLocal = new parserWorkerLocalClass();
			console.log("Starting subfile ".concat(path.posix.basename(that.currentFile.fileName)));
			parserWorkerLocal.onmessage(that.currentFile, function (processedFileName) {
				console.log("processed subfile ".concat(path.posix.basename(processedFileName)));
				that.processNextNonFasta();
			});
		} else if (that.fileCounter < that.files.length && that.files[that.fileCounter].dataset === "Genome") {
			//it's possible to have more than one genome file. At this stage only first is used, the second is dismissed. 
			//the most common case of this is when chromosomes are split between multiple files. 
			that.processNextNonFasta();
		} else if (that.fileCounter >= that.files.length) {
			//in theory, process should never arrive here
			that.processNextNonFasta();
		}
	}

	processNextNonFasta(): void {
		that.fileCounter++;
		if (that.fileCounter >= that.files.length) {
			that.setCommitProcessed(that.commits[that.processedCommits]);
			that.processedCommits++;
			that.getCommitsFilesList();
		} else {
			that.checkFileExists(that.files[that.fileCounter], "files");
		}
	}

	updateSelectedFasta(fastaID): void {
		for (let k = 0; k < that.files.length; k++) {
			that.files[k].selectedFasta = fastaID;
		}
	}

	addFileToProject(projectID: string, fileID: string, isFasta: boolean): void {
		//add file to the project files list if the file was already added to database in the past
		if (isFasta) {
			//in the original project, there is duplication - fasta collection has projects array and projects collection has files array
			//both may need to be updated, so that what I'll do to be on safe side
			MongoClient.connect(MONGO_URL, function (err, db) {
				let dbo = db.db("webcircos");
				let f_id = mongodb.ObjectID(fileID);
				let p_id = mongodb.ObjectID(projectID);
				dbo.collection("fasta").updateOne({ _id: f_id }, { $addToSet: { projects: p_id } }, function (err, result) { db.close(); })
			})
		}
		MongoClient.connect(MONGO_URL, function (err, db) {
			let dbo = db.db("webcircos");
			let f_id = mongodb.ObjectID(fileID);
			let p_id = mongodb.ObjectID(projectID);
			dbo.collection("projects").updateOne({ _id: p_id }, { $addToSet: { files: f_id } }, function (err, result) { db.close(); })
		})
	}

	setCommitProcessed(commit: CommitInfo): void {
		//sets "processed" field in commits to true to avoid repeatedly processing same commit.
		MongoClient.connect(MONGO_URL, function (err, db) {
			if (err) throw err;
			var dbo = db.db("webcircos");
			// console.log("finished with commit " + commit.commitHash)
			dbo.collection("commits").updateOne({ commitHash: commit.commitHash }, { $set: { processed: true } }, function (err, res) {
				if (err) throw err;
				db.close();
			});
		});
	}

	processCommitLinks(commit: CommitInfo): void {
		if (that.processedCommits < that.newCommits.length) {
			let dataDir = DATA_DIRECTORY.concat(that.user).concat("/").concat(that.project).concat("/").concat(commit.commitHash).concat("/.gnmgit/")
			let hashDirectories: string[] = linkParser.getDeltaDirectories(dataDir);

			that.linksData = []
			if (hashDirectories.length !== 0) {
				//get old fasta and few fasta objectIDs, bash script returns their hashes, which is very inconvenient further down the line.
				for (let i = 0; i < hashDirectories.length; i++) {
					let ggHashes = hashDirectories[i].split("_")

					let snplink = new FastaLink;
					snplink.format="InDelSNP";
					snplink.data = linkParser.readFilteredSNP(dataDir.concat("Delta/").concat(hashDirectories[i]));
					snplink.NewFasta=ggHashes[0];
					snplink.OldFasta=ggHashes[1];
					if (snplink.data.length>0) {that.linksData.push(snplink);}

					let rearlink = new FastaLink;
					rearlink.format="rearrangment";
					rearlink.data=linkParser.readFilteredDelta(dataDir.concat("Delta/").concat(hashDirectories[i]));
					rearlink.NewFasta=ggHashes[0];
					rearlink.OldFasta=ggHashes[1];

					if (rearlink.data.length>0) { that.linksData.push(rearlink); }
				}
				that.linksCounter = 0;
				if (that.linksData.length != 0 && that.linksData[that.linksCounter].data.length!=0) {
					that.insertLinkFile(that.linksData[that.linksCounter]);
				} else {
					that.processedCommits++;
					that.processCommitLinks(that.newCommits[that.processedCommits]);
				}
			} else {
				that.processedCommits++;
				that.processCommitLinks(that.newCommits[that.processedCommits]);
			}

		} else {
			that.finishedProject();
		}

	}

	insertLinkFile(linkObject: FastaLink) {
		let fastaHashes = [linkObject.NewFasta, linkObject.OldFasta]
		MongoClient.connect(MONGO_URL, function (err, db) {
			if (err) throw err;
			var dbo = db.db("webcircos");
			dbo.collection("fasta").find({ hash: { $in: fastaHashes } }).toArray(function (err, res) {
				if (err) throw err;
				db.close();
				//replace linkObject fasta hashes with fasta objectIDs
				for (let i = 0; i < res.length; i++) {
					if (linkObject.NewFasta === res[i].hash) {
						linkObject.NewFasta = res[i]._id.toString();
					} else if (linkObject.OldFasta === res[i].hash) {
						linkObject.OldFasta = res[i]._id.toString();
					}
				}
				//add the linkObject to database
				MongoClient.connect(MONGO_URL, function (err, db) {
					if (err) throw err;
					var dbo = db.db("webcircos");
					//because Mongo has document size limit of 16mb (though there is a way of bypassing this via GridFS)
					//two collection are used one "linkFiles" for storing link file description
					//another "linksData" for storing data as individual documents
					let linkFile = {OldFasta: linkObject.OldFasta, NewFasta: linkObject.NewFasta, format: linkObject.format }
					dbo.collection("linkFiles").insertOne(linkFile, function (err, res) {
						if (err) throw err;
						db.close();
						for (let datapoint of that.linksData[that.linksCounter].data){
							datapoint.linkFileID=res["ops"][0]["_id"];
						}
						that.insertLinkData(that.linksData[that.linksCounter].data);
						that.linksCounter++;
						if (that.linksCounter < that.linksData.length) {
							that.insertLinkFile(that.linksData[that.linksCounter]);
						} else {
							that.processedCommits++;
							that.processCommitLinks(that.newCommits[that.processedCommits]);
						}
					});
				});
			});
		});
	}

	insertLinkData(linkData: Array<LinksDataPoint>): void {
		//insert changed (links) data into linksData collection
		MongoClient.connect(MONGO_URL, function (err, db) {
			if (err) throw err;
			var dbo = db.db("webcircos");
			dbo.collection("linksData").insertMany(linkData, function (err, res) {
				if (err) throw err;
				db.close();
			});
		});
	}

}


