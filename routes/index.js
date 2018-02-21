var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var app = express();

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017';
const dbName = 'bacancyTest';
var collection;

MongoClient.connect(url, function(err, client) {
    assert.equal(null, err);
    db = client.db(dbName);
    collection = db.collection('employee');
});


router.get('/', function(req, res, next) {

    //const collection = db.collection('employee');
    var cursor = collection.find({});
    cursor.toArray(function(err, empList) {
        console.log("Connection successfull with mongodb server.");
        console.log(empList);
    });

    res.render('index', { title: 'Test' });
});

router.get('/login', function(req, res, next) {
    res.render('login', { title: 'Test' });
});

router.post('/authenticate', function(req, res, next) {

    var usr = req.body;
    var cursor = collection.find({ email: usr.email, isActive: true });
    cursor.toArray(function(err, empList) {

        if (err) throw err;

        if (empList.length == 0) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (empList.length > 0) {
            var user = empList[0];
            // check if password matches
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {

                var emp = {
                    id: user.id
                };
                var token = jwt.sign(emp, 'jaypastagia', {
                    expiresIn: 60 * 60
                });

                req.session.user = user;

                return res.json({
                    success: true,
                    message: 'Authenticated Successfully.',
                    token: token
                });
            }
        }
    });
});

router.post('/checkEmail', function(req, res, next) {

    var cursor = collection.find({ isActive: true, email: req.body.email });
    cursor.toArray(function(err, users) {

        if (err) throw err;

        if (users.length > 0) {
            return res.json({
                success: true
            });
        } else {
            return res.json({
                success: false
            });
        }
    });

});

module.exports = router;