var Firebase = require('firebase');
var md5 = require('MD5');

var fb = new Firebase('https://hackthenorth.firebaseio.com/');
var ref = fb.child('register');

var testObject = { name: 'Kartik Talwar', email: 'ktalwar@uwaterloo.ca',
                   school: 'University of Waterloo', student: 'undergraduate',
                   graduating: 2015, comments: 'Are you paying for flights?' }



// TODO: Make these functions a class

var makeUserAccount = function(obj) {
  var user = {};
  user[md5(obj.email)] = obj;

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
    return current + ['test']
  });

}


var data = makeUserAccount(testObject);

console.log(createUser(data));
