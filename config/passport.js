var passport = require('passport');
var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;
var User = mongoose.model('User');

passport.use(new LocalStrategy(
    function (username, passport, done) {
        User.findOne({username: username}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false, {message: 'Incorrect username or password.'});
            }
            if (!user.validPassword(password)) {
                return done(null, false, {message: 'Incorrect username or password'});
            }
            return done(null, user);
        });
    }
));