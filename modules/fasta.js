var mongo = require("mongodb");
var mongoUtil=require("./mongoUtil")


var getFasta = function(file, callback) {
  //console.log("In fasta getFasta"+file);
  mongoUtil.connectToServer(function(err) {
    if (err) throw err;
    var db = mongoUtil.getDb();
    var dbo = db.db("webcircos");


    dbo.collection("fasta").findOne({
      _id: mongo.ObjectID(file)
    }, function(err, result) {
      if (err) throw err;
      db.close();
      callback(result);
    })
  });
}

var insertNewFasta = function(data, callback) {
  mongoUtil.connectToServer(function(err) {
    if (err) throw err;
    var db = mongoUtil.getDb();
    var dbo = db.db("webcircos");
    data.format = "fasta";

    var projectID = data.project;
    data.projects = [mongo.ObjectID(data.project)];
    delete data.project;
    dbo.collection("fasta").insertOne(
      data,
      function(err, result) {
        if (err) throw err;
        dbo.collection("projects").update({
          _id: mongo.ObjectID(projectID)
        }, {
          $addToSet: {
            files: result.insertedId
          }
        }, function(err, resultUpdate) {
          if (err) throw err;
          callback(result.insertedId);

          db.close();

        });
      }
    )

  })

}

module.exports = {
  getFasta: getFasta,
  insertNewFasta: insertNewFasta
}
