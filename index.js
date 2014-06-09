var Firebase = require('firebase');
var nodemailer = require('nodemailer');
var myRootRef = new Firebase('https://hackthenorth.firebaseio.com');
var signup = myRootRef.child('signup');
var FIREBASE_TOKEN = 'FIREBASE_API_KEY'; //fill in actual key in prod
//Log me in
myRootRef.auth(FIREBASE_TOKEN, function(error, result) {
  if(error) {
    console.log("Login Failed!", error);
  } else {
    console.log('Authenticated successfully with payload:', result.auth);
    console.log('Auth expires at:', new Date(result.expires * 1000));
  }
});


var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Mailgun", // sets automatically host, port and connection security settings
    auth: {
        user: "postmaster@hackthenorth.com",
        pass: "password" //fill in actual SMTP password in prod
    }
});

signup.on('child_added', function(dataSnapshot) {
  console.log(dataSnapshot.val().email);
  var mailOptions = {
  headers: {
    'X-Mailgun-Campaign-Id': 'registration',
    'X-Mailgun-Track': 'yes',
    'X-Mailgun-Track-Clicks': 'yes',
    'X-Mailgun-Track-Opens': 'yes'
    },
  from: 'contact@hackthenorth.com',
  to: dataSnapshot.val().email,
  subject: 'Hello world!',
  html: '<h2><a href="http://hackthenorth.com">H2s are badass</a></h2>'
}

smtpTransport.sendMail(mailOptions, function(err, res) {
  if (err) console.log(err);
  console.log('done');
});
  // code to handle new value.
});

