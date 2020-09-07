// var mongoUtil = require('../modules/mongoUtil');
// const bcrypt = require('bcrypt');
// var randomstring = require("randomstring");


// module.exports = (function() {
//   'use strict';
//   var externalRoutes = require('express').Router();

//   externalRoutes.get('/', function(req, res) {

//     var data = req.query;
//     mongoUtil.connectToServer(function(err) {
//       if (err) throw err;
//       var db = mongoUtil.getDb();
//       var dbo = db.db("webcircos");
//       dbo.collection("users").find({username: data.username, email: data.email},{$exists: true}).toArray(function(err, info) {
//         if (err) throw err;
//         //console.log(info.length)
//         if(info.length==0){//email and username exist
//           dbo.collection("users").findOne({
//             username: data.username
//           }, function(err, result) {
//             if (err) throw err;
    
//             if(result==null){//username not exist
//               dbo.collection("users").findOne({
//                 email: data.email
//               }, function(err, result) {
//                 if (err) throw err;
        
//                 if(result==null){//email not exist
//                   bcrypt.hash(data.password, 10, function(err, hash) {

//                     data.password = hash;
//                     data.token=randomstring.generate(48);
//                     data.projects=[];

                  
//                     dbo.collection("users").insertOne(data, function(err, resMongo) {
//                       if (err) throw err;
//                       db.close();
//                       res.send({message:'Success'});
//                     });
//                   });
                  
        
//                 }else{
//                   db.close();
//                   res.send({message:'Email already existing'});
//                 }
//               });
//             }else{
//               db.close();
//               res.send({message:'Username already existing'});
//             }
//           });

//         }else{
//           db.close();
//           res.send({message:'Both Username and Email already existing'});
//         }
//       });
//     })
//   });
//   return externalRoutes;
// })();






var mongoUtil = require('../modules/mongoUtil');
const bcrypt = require('bcryptjs');



module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.get('/', function(req, res) {

    var data = req.query;
    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
      dbo.collection("users").find({username: data.username, email: data.email},{$exists: true}).toArray(function(err, info) {
        if (err) throw err;
        //console.log(info.length)
        if(info.length==0){//email and username exist
          dbo.collection("users").findOne({
            username: data.username
          }, function(err, result) {
            if (err) throw err;
    
            if(result==null){//username not exist
              dbo.collection("users").findOne({
                username: data.username
              }, function(err, result) {
                if (err) throw err;
        
                if(result==null){//email not exist
                  bcrypt.hash(data.password, 10, function(err, hash) {

                    data.password = hash;
                    data.token="";
                    data.projects=[];
                  
                    dbo.collection("users").insertOne(data, function(err, resMongo) {
                      if (err) throw err;
                      db.close();
                      res.send({message:'Success'});
                    });
                  });
                  
        
                }else{
                  db.close();
                  res.send({message:'Email already exists'});
                }
              });
            }else{
              db.close();
              res.send({message:'Username already exists'});
            }
          });

        }else{
          db.close();
          res.send({message:'Both Username and Email already exist'});
        }
      });
    })
  });
  return externalRoutes;
})();






// var mongoUtil = require('../modules/mongoUtil');
// const bcrypt = require('bcrypt');

// module.exports = (function() {
//   'use strict';
//   var externalRoutes = require('express').Router();

//   externalRoutes.get('/', function(req, res) {

//     var data = req.query;
//     mongoUtil.connectToServer(function(err) {
//       if (err) throw err;
//       var db = mongoUtil.getDb();
//       var dbo = db.db("webcircos");
//       dbo.collection("users").findOne({
//         email: data.email
//       }, function(err, result) {
//         if (err) throw err;

//         if(result==null){

//           bcrypt.hash(data.password, 10, function(err, hash) {

//             data.password = hash;
//             data.token="";
//             data.projects=[];

//             dbo.collection("users").insertOne(data, function(err, resMongo) {
//               if (err) throw err;
//               db.close();
//               res.send({message:'Success'});
//             });
//           });
//         }else{
//           db.close();
//           res.send({message:'Email already existing'});
//         }
//       });
//     })
//   });
//   return externalRoutes;
// })();
