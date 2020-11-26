var express = require('express');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var mqtt = require('mqtt')
var client = mqtt.connect('ws://localhost:9001')


var urlencodedParser = bodyParser.urlencoded({ extended: false })

var app = express();
app.set('port', process.env.PORT || 1234);

app.use(cookieParser());


app.use(session({
    name: 'beeUserSession',
    secret: 'we all love coe457',
    resave: true, // have to do with saving session under various conditions
    saveUninitialized: true, // just leave them as is
    cookie: {
        maxAge: (1000 * 60 * 60 * 24 * 30)
    }
}));


app.use(express.static(__dirname + '/public'));



// add the database 
mongoose.connect('mongodb://localhost:27017/beeline_users', { useNewUrlParser: true, useUnifiedTopology: true });
// we create a scheme first 
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const locationSchema = new mongoose.Schema({
    email: String,
    current: { lat: Number, lng: Number },
    destination: { lat: Number, lng: Number },
});
// we create a collection called WifiQ with the wifiSchema
const BeeUser = mongoose.model("BeeUser", userSchema);
const BeeLocation = mongoose.model("BeeLocation", locationSchema);


app.post('/register_user', urlencodedParser, function (req, res) {
    var response = {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
    };

    var userToSave = new BeeUser(response);
    userToSave.save();

    res.redirect('/login.html');
});

app.post('/login_user', urlencodedParser, function (req, res) {

    console.log("Has consent: "+req.body.consent);
    req.body.consent = req.body.consent == 'true';
    var response = {
        email: req.body.email,
        password: req.body.password,
        remember: req.body.remember == 'true',
    };

    BeeUser.findOne({ email: response.email, password: response.password }, function (err, foundUser) {
        if (err) {
            console.log(err);
        }
        //no such user
        else if (!foundUser){
            res.send("login_error");
        }
        else {
            console.log("logged in " + foundUser.username);
            //if not the first time
            if (req.session.email && req.body.consent) {
                req.session.firstLogin = false;
            }
            //if first time with cookie consent
            else if (req.body.consent) {

                req.session.firstLogin = true;
                req.session.username = foundUser.username;
                req.session.remember = response.remember;
                req.session.email = foundUser.email;
            }
            //if first tiem without cookie consent, only save email
            else{
                req.session.email = foundUser.email;
            }
            res.send("login_success");
        }
    });

});

app.get('/get_session_info', function (req, res) {

    var userInfoToSend = {
        email: req.session.email,
        username: req.session.username,
        visitTime: req.session.visitTime,
        firstLogin: req.session.firstLogin,
        remember: req.session.remember,
    };
    //Will be null without cookie consent
    if (req.session.username != null){
        req.session.visitTime = new Date().toLocaleString();
    }
    //After first tiem sending, then reflect that its not their first time (ignore if cookie consent not given)
    if (req.session.email) {
        req.session.firstLogin = false;
    }
    res.json(userInfoToSend);
});


app.get('/logout_user', function (req, res) {
    res.clearCookie('beeUserSession');
    req.session.destroy();
    res.redirect('/login.html');
});

app.get('/user_closed', function (req, res) {
    res.clearCookie('beeUserSession');
    req.session.destroy();
});

// custom 404 page 
app.use(function (req, res) {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
});

// custom 500 page 
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.send('500 - Server Error');
});

app.listen(app.get('port'), function () {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});

//MQTT

client.on('connect', function () {
    client.subscribe('iothw3/coords', function (err) {
        if (err) {
            console.log(err);
        }
    })
})

client.on('message', function (topic, message) {
    if (topic == 'iothw3/coords') {
        console.log(message.toString())
        currentCoords = JSON.parse(message.toString());

        const newLocation = {
            email: currentCoords.email,
            current: currentCoords.coords_starting,
            destination: currentCoords.coords_destination,
        };
        
        var locationToSave = new BeeLocation(newLocation);
        locationToSave.save();
    }
})