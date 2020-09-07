/*var mongoUtil = require('../modules/mongoUtil');
const bcrypt = require('bcrypt');


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.get('/', function(req, res) {
    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
      dbo.collection("users").findOne({
        username: req.query.username
      }, function(err, result) {
        if (err) throw err;



        if (result != null) {

          // if (req.query.password) {
            bcrypt.compare(req.query.password, result.password, function(err, resComp) {
              if (resComp) {
                //postIdentification(result, res, req.query, db, dbo);
                res.send({
                  message: "Success",
                  data: result
                });

              } else {
                res.send({
                  message: "Incorrect password"
                });
                db.close();
              }
            });
          // } else {

          //   if (req.query.token == result.token) {
          //     postIdentification(result, res, req.query, db, dbo);
          //   } else {
          //     res.send({
          //       message: "Invalid token"
          //     });
          //     db.close();
          //   }
          // }

        } else {
          res.send({
            message: "Username not Found "
          });
          db.close();
        }
      });
    })
  });
  return externalRoutes;
})();

// function postIdentification(result, res, query, db, dbo) {//give token
//   require('crypto').randomBytes(48, function(err, buffer) {
//     var token = buffer.toString('hex');
//     result.token = token;

//     // res.send({
//     //   message: "Success",
//     //   data: result
//     // });

//     dbo.collection("users").update({
//       username: query.username
//     }, {
//       $set: {
//         token: token
//       }
//     }, function(err, result) {
//       if (err) throw err;
//       db.close();
//     })
//   });
// }
*/


var mongoUtil = require('../modules/mongoUtil');
const bcrypt = require('bcryptjs');


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

  externalRoutes.get('/', function(req, res) {
    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
      dbo.collection("users").findOne({
        username: req.query.username
      }, function(err, result) {
        if (err) throw err;


        if (result != null) {

          if (req.query.password) {
            bcrypt.compare(req.query.password, result.password, function(err, resComp) {
              if (resComp) {
                postIdentification(result, res, req.query, db, dbo);
              } else {
                res.send({
                  message: "Incorrect password"
                });
                db.close();
              }
            });
          } else {

            if (req.query.token == result.token) {
              postIdentification(result, res, req.query, db, dbo);
            } else {
              res.send({
                message: "Invalid token"
              });
              db.close();
            }
          }

        } else {
          res.send({
            message: "Username not Found "
          });
          db.close();
        }
      });
    })
  });
  return externalRoutes;
})();

function postIdentification(result, res, query, db, dbo) {
  require('crypto').randomBytes(48, function(err, buffer) {
    var token = buffer.toString('hex');
    result.token = token;

    res.send({
      message: "Success",
      data: result
    });

    dbo.collection("users").update({
      username: query.username
    }, {
      $set: {
        token: token
      }
    }, function(err, result) {
      if (err) throw err;
      db.close();
    })
  });
}



// var mongoUtil = require('../modules/mongoUtil');
// const bcrypt = require('bcrypt');


// module.exports = (function() {
//   'use strict';
//   var externalRoutes = require('express').Router();

//   externalRoutes.get('/', function(req, res) {
//     mongoUtil.connectToServer(function(err) {
//       if (err) throw err;
//       var db = mongoUtil.getDb();
//       var dbo = db.db("webcircos");
//       dbo.collection("users").findOne({
//         email: req.query.email
//       }, function(err, result) {
//         if (err) throw err;


//         if (result != null) {

//           if (req.query.password) {
//             bcrypt.compare(req.query.password, result.password, function(err, resComp) {
//               if (resComp) {
//                 postIdentification(result, res, req.query, db, dbo);

//               } else {
//                 res.send({
//                   message: "Incorrect password"
//                 });
//                 db.close();
//               }
//             });
//           } else {

//             if (req.query.token == result.token) {
//               postIdentification(result, res, req.query, db, dbo);
//             } else {
//               res.send({
//                 message: "Invalid token"
//               });
//               db.close();
//             }
//           }

//         } else {
//           res.send({
//             message: "Email not found"
//           });
//           db.close();
//         }
//       });
//     })
//   });
//   return externalRoutes;
// })();

// function postIdentification(result, res, query, db, dbo) {
//   require('crypto').randomBytes(48, function(err, buffer) {
//     var token = buffer.toString('hex');
//     result.token = token;

//     res.send({
//       message: "Success",
//       data: result
//     });

//     dbo.collection("users").update({
//       email: query.email
//     }, {
//       $set: {
//         token: token
//       }
//     }, function(err, result) {
//       if (err) throw err;
//       db.close();
//     })
//   });
// }
