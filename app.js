var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var session = require('express-session');

// mysql database connection
var mysql = require('mysql');
var app = express();
var orm = require("orm");

// orm stuff
app.use(orm.express("mysql://neumont:sugarc0deit@mysql.hlaingfahim.com/donutsprinkles", {
    define: function (db, models, next) {
        // user model
        models.user = db.define("Users", {
            id: Number,
            username: String,
            password: String,
        });
        next();
    }
}));

// route action handlers
var index = require('./routes/index');
var users = require('./routes/users');
var login = require('./routes/login');
var profile = require('./routes/profile');
var challenge = require('./routes/challenge');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// url mapping to actions
app.use('/', index);
app.use('/users', users);
app.use('/login', login);
app.use('/challenge', challenge);
//app.use('/profile', profile);

app.use(session({
    secret: 'super-duper-secret-string',
    resave: true,
    saveUninitialized: true
}));

// checks to make sure we have an active session
var auth = function (req, res, next) {
    if (req.session && req.session.user != null) {
        return next();
    }
    else {
        res.render("authenticationFailure");
    }
};

// login
app.post('/login', function (req, res) {
    // check to make sure user entered in values
    if (validateLoginForm(req, res)) {
        var username = req.body.username;
        var password = req.body.password;

        req.models.user.find({username: username, password: password}, function (err, user) {
            if (err) {
                res.status(err.status);
                res.render('error');
                return;
            }

            if (user.length == 1) {
                req.session.user = user[0];
                res.render("profile", {user: user.username});
            } else {
                res.render("loginFailure");
            }
        });
    }
});

app.get('/logout', function (req, res) {
    if (req.session.user) {
        req.session.destroy();
        res.render("logout");
    } else {
        // already signed out, go back to login screen
        res.redirect("login");
    }
});

app.get('/profile', auth, function (req, res) {
    res.render("profile");
});

// validates a login form by ensuring that both username
// and password fields are not empty
function validateLoginForm(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    // validate
    req.checkBody("username", "Username cannot be blank!").notEmpty();
    req.checkBody("password", "Password cannot be blank!").notEmpty();

    // echo back form with errors displayed
    var errors = req.validationErrors();
    if (errors) {
        res.render("login", {username: username, password: password, errors: errors});
        return false;
    }
    return true;
}

// creates a connection to our mysql database
function createDBConnection() {

    // connection settings
    var connection = mysql.createConnection({
        host: 'mysql.hlaingfahim.com',
        user: 'neumont',
        password: 'sugarc0deit',
        database: 'donutsprinkles'
    });

    // connect to database
    connection.connect(function (err) {
        if (err) {
            return null;
        }
    });
    return connection;
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
