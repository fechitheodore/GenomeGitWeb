var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("webcircos");
  dbo.collection("bins").drop(function(err, delOK) {
    if (err) throw err;
    dbo.collection("commits").drop(function(err, delOK) {
        if (err) throw err;
        dbo.collection("fasta").drop(function(err, delOK) {
            if (err) throw err;
            dbo.collection("files").drop(function(err, delOK) {
                if (err) throw err;
                dbo.collection("gitFiles").drop(function(err, delOK) {
                    if (err) throw err;
                    dbo.collection("rows").drop(function(err, delOK) {
                        if (err) throw err;
                        if (delOK) console.log("Collection deleted");
                        db.close();
                      });
                  });
              });
          });
      });
  });
  
});