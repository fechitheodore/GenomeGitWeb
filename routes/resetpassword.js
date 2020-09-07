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
        if (result != null) {//username not found
            bcrypt.compare(req.query.password, result.password, function(err, resComp) {
              if (resComp) {//if the password same

                bcrypt.hash(req.query.newpassword, 10, function(err, hash) {

                    req.query.newpassword = hash;
                    dbo.collection("users").update({username: req.query.username}, {$set: {password: req.query.newpassword
                        }
                      }, function(err, result) {
                        if (err) throw err;
                        res.send({
                            message: "Success"
                          });
                        db.close();
                      })
                  });

              } else {
                res.send({
                  message: "Incorrect password"
                });
                db.close();
                
              }
            });

        } else {
          res.send({
            message: "Username not Found"
          });
          db.close();
        }
      });
    })
  });
  return externalRoutes;
})();