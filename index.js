var Firebase = require('firebase');
var settings = require('./config');
var md5 = require('MD5');
var nodemailer = require('nodemailer');
var fs = require('fs');

var fb = new Firebase('https://hackthenorth.firebaseio.com/');
var ref = fb.child('register');

var testObject = {linkedin        : "http://linkedin.com/in/kartiktalwar",
                  grad_year       : "2015",
                  school          : "University of Waterloo",
                  first_hackathon : "false",
                  proud_project   : "I don't know about you, but I'm kind of a big deal.",
                  name            : "Kartik Talwar",
                  comments        : "When do I find out if I'm in?",
                  timestamp       : 1402269531,
                  email           : "talwar.kartik@gmail.com",
                  student_status  : "undergraduate",
                  is_hardware     : "true",
                  travel          : "false",
                  portfolio       : "http://github.com/kartiktalwar"}

var sanitizeData = function(obj) {
  obj.is_hardware = obj.is_hardware === 'true';
  obj.travel = obj.travel === 'true';
  obj.first_hackathon = obj.first_hackathon === 'true';

  return obj;
}


// TODO: Make these functions a class
var makeUserObject = function(obj) {
  var user = {};
  var salt = settings.salt;
  var sanitized = sanitizeData(obj);

  user[md5(obj.email+salt)] = sanitized;

  return user;
}


// at this point its the same as makeUserAccount
// will get better in teh future
var createUser = function(userObj) {
  var hash = Object.keys(userObj)[0]
  var users = fb.child('users').child(hash);
  var map = fb.child('map').child('users').child(hash);

  map.set(userObj[hash].email);

  if(userObj[hash].comments.trim().length > 1) {
    fb.child('questions').push(userObj[hash].comments);
  }

  users.set(userObj[hash]);
  doMath(userObj);

  var html = fs.readFileSync('./emails/applicant-submission.html').toString();
  sendMail(userObj[hash].email, 'Thanks for applying to Hack the North!', html);
}


var doMath = function(user) {
  var hash = Object.keys(user)[0];
  var data = user[hash];
  var stamp = new Date(data.timestamp*1000);
  var stats = fb.child('stats');

  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

  stats.child('total').child('signups').transaction(function(current) {
    return current + 1;
  });

  var emailKey = data.email.split('@')[1].replace(/\./g, '-'); // fb doesn't allow periods in keys
  stats.child('emails').child(emailKey).transaction(function(current) {
    return current+1;
  });

  stats.child('total').child('hardware').transaction(function(current) {
    if(data.is_hardware) {
      return current + 1;
    } else {
      stats.child('total').child('software').transaction(function(curr) {
        return curr+1;
      });
    }
  });

  stats.child('total').child('first_hackathon').transaction(function(current) {
    if(data.first_hackathon) {
      return current+1;
    } else {
      return current;
    }
  });

  stats.child('graduating').child(data.grad_year).transaction(function(current) {
      return current+1;
  });

  stats.child('total').child('travel').transaction(function(current) {
      return current+1;
  });

  stats.child('student_status').child(data.student_status).transaction(function(current) {
      return current+1;
  });

  stats.child('schools').transaction(function(current) {
    if(current === null) {
      return [data.school];
    } else {
      current.push(data.school);
      // the schools list appends the school name to the current list
      // and make the array unique yielding total registered schools
      return current.reduce(function(p, c) {
                              if(p.indexOf(c) < 0) {
                                p.push(c);
                              }
                              return p;
                           }, []);
    }
  });

  stats.child('signups').child((months[stamp.getMonth()]+'-'+stamp.getDate())).transaction(function(current) {
    return current+1;
  });

  stats.child('breakdown').child((months[stamp.getMonth()]+'-'+stamp.getDate()+'-'+stamp.getHours()+'h')).transaction(function(current) {
    return current+1;
  });

}




var sendMail = function(to, subject, body) {
  var smtpTransport = nodemailer.createTransport("SMTP",{
      service: "Mailgun", // sets automatically host, port and connection security settings
      auth: {
          user: "postmaster@hackthenorth.com",
          pass: settings.mailgunPassword //fill in actual SMTP password in prod
      }
  });

  var mailOptions = {
    headers: {
      'X-Mailgun-Campaign-Id': 'registration',
      'X-Mailgun-Track': 'yes',
      'X-Mailgun-Track-Clicks': 'yes',
      'X-Mailgun-Track-Opens': 'yes'
      },
    from: '"Hack the North" <contact@hackthenorth.com>',
    to: to,
    subject: subject,
    html: body
  }

  smtpTransport.sendMail(mailOptions, function(err, res) {
    if(!err) {
      fb.child('users').child(md5(mailOptions.to+settings.salt)).child('flags').child('registration_email').set(res.messageId);
    } else {
      fb.child('errors').child(md5(mailOptions.to+settings.salt)).child('emails').child('registration_email').set(res);
    }
  });

}



var data = makeUserObject(testObject);
createUser(data);
