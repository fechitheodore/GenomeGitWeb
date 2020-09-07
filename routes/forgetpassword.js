var mongoUtil = require('../modules/mongoUtil');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
const bcrypt = require('bcryptjs');


module.exports = (function() {
  'use strict';
  var externalRoutes = require('express').Router();

/*  var transport = nodemailer.createTransport(smtpTransport({
    host: "smtp.qq.com", //main mail use
    secure: true, // use ssl
    secureConnection: true, // use ssl
    port: 465, // SMPT port
    auth: {
      user: "389617054@qq.com", // account
      pass: "jvyolobupgqzcaab" // password
    }
  }));*/
  
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
  

  externalRoutes.get('/', function(req, res) {
    mongoUtil.connectToServer(function(err) {
      if (err) throw err;
      var db = mongoUtil.getDb();
      var dbo = db.db("webcircos");
      dbo.collection("users").findOne({
        email: req.query.email
      }, function(err, result) {

        if (result != null) {//email exist 
            var newpassword = randomPassword(10);
            console.log(newpassword);
            
            bcrypt.hash(newpassword, 10, function(err, hash) {

              newpassword = hash;
              dbo.collection("users").update({email: req.query.email}, {$set: {password: newpassword
                  }
                }, function(err, result) {
                  if (err) throw err;
                  res.send({
                      message: "Success"
                    });
                  db.close();
                })//end of update function
            });//end of hash function

            var mailOptions = {
              from: "GenomeGit<genomegit@gmail.com>", // email which uses for send the email
              to: req.query.email, // receive the email
              subject: "Your user name and your temporaly password", // header
              text:"reset password ",
              html: "Please use your new password to login and reset your password as soon as possible."+"\n\n"
              +"username:"+result.username+"\n\n"
              +"password:"+newpassword+"\n\n" // html content 
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


            console.log(result.password);
            console.log(result.username);
      } else {
        res.send({
          message: "Email not Found"
        });
        db.close();
      }
      });
    })
  });
  return externalRoutes;
})();

function randomPassword(size)
{
  var seed = new Array('A','B','C','D','E','F','G','H','I','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z',
  'a','b','c','d','e','f','g','h','i','j','k','m','n','p','Q','r','s','t','u','v','w','x','y','z',
  '2','3','4','5','6','7','8','9'
  );//array
  seedlength = seed.length;//length of array
  var createPassword = '';
  for (i=0;i<size;i++) {
    j = Math.floor(Math.random()*seedlength);
    createPassword += seed[j];
  }
  return createPassword;
}