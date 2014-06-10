var Firebase = require('firebase');
var settings = require('./config');
var md5 = require('MD5');

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
                  email           : "ktalwar@uwaterloo.ca",
                  student_status  : "undergraduate",
                  is_hardware     : "true",
                  travel          : "false",
                  portfolio       : "http://github.com/kartiktalwar"}

var sanitizeData = function(obj) {
  obj.is_hardware = obj.is_hardware === 'true';
  obj.travel = obj.travel === 'true';

  return obj;
}


// TODO: Make these functions a class
var makeUserAccount = function(obj) {
  var user = {};
  var salt = settings.salt;

  var sanitized = sanitizeData(obj);
  //console.log(salt);
  user[md5(obj.email+salt)] = sanitized;

  return user;
}


// at this point its the same as makeUserAccount
// will get better in teh future
var createUser = function(userObj) {
  var hash = Object.keys(userObj)[0]
  var users = fb.child('users').child(hash);
  var map = fb.child('map').child('users').child(hash);

  users.set(userObj[hash]);
  map.set(userObj[hash].email);


  doMath(userObj);
}


var doMath = function(obj) {
  var hash = Object.keys(obj)[0];
  var data = obj[hash];

  var stats = fb.child('stats');

  stats.child('signups').transaction(function(current) {
    return current + 1;
  });


  stats.child('schools').transaction(function(current) {
    if(current === null) {
      return [data.school];
    } else {
      current.push(data.school);
      return current.reduce(function(p, c) {
                              if(p.indexOf(c) < 0) {
                                p.push(c);
                              }
                              return p;
                           }, []);
    }
  });

}


var data = makeUserAccount(testObject);

console.log(createUser(data));
