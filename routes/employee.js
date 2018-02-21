var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');

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
    res.send('respond with a resource');
});

router.post('/save', function(req, res, next) {
    console.log("employee save");
    console.log(req.body);
    var emp = req.body;
    emp.isActive = true;
    collection.insert(emp, function(err, emp) {
        console.log("insert done");
        console.log(emp);
        if (err) throw err

        console.log('The solution is: ', emp);

        return res.json({ success: true });
    });
});

router.get('/emplist', function(req, res, next) {
    console.log(" employee list");

    var columns = ["name", "email", "contact"];
    var iDisplayStart = parseInt(req.query.iDisplayStart);
    var iDisplayLength = parseInt(req.query.iDisplayLength);

    var sSearch = req.query.sSearch;

    console.log(iDisplayStart + "-----" + iDisplayLength);

    if (sSearch != "") {
        var conditionalObj = {
            'isActive': true,
            $or: [{
                'name': { '$regex': sSearch, '$options': 'i' }
            }, {
                'email': { '$regex': sSearch, '$options': 'i' }
            }, {
                'contact': { '$regex': sSearch, '$options': 'i' }
            }]
        };

        collection.count(conditionalObj, function(err, nos) {
            if (err) throw err;
            var cursor = collection.find(conditionalObj).skip(iDisplayStart).limit(iDisplayLength);

            cursor.toArray(function(err, users) {

                if (err) throw err;

                res.send({
                    "aaData": users,
                    "iTotalRecords": nos,
                    "iTotalDisplayRecords": nos
                });
            });
        });
    } else {
        console.log("sSearch null");
        var conditionalObj = {
            'isActive': true
        };

        collection.count(conditionalObj, function(err, nos) {
            console.log(nos);
            if (err) throw err;

            if (iDisplayLength == -1) {
                iDisplayLength = nos;
            }

            var cursor = collection.find(conditionalObj).skip(iDisplayStart).limit(iDisplayLength);
            cursor.toArray(function(err, users) {
                if (err) throw err;

                res.send({ "aaData": users, "iTotalRecords": nos, "iTotalDisplayRecords": nos });
            });
        });
    }
});

router.get('/home', function(req, res, next) {
    res.render('employeeList', { title: 'Test' });
});

router.get('/profile', function(req, res, next) {
    res.render('profile', { title: 'Test' });
});

router.use(function(req, res, next) {

    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    console.log("token====" + token);
    if (token) {
        jwt.verify(token, 'jaypastagia', function(err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});

router.get('/getProfile', function(req, res, next) {
    collection.findOne({ isActive: true, _id: new ObjectId(req.session.user._id) }, function(err, emp) {

        if (err) throw err;

        return res.json({ success: true, profile: emp });
    });
});

router.delete('/deleteAccount', function(req, res, next) {
    collection.updateOne({ isActive: true, _id: new ObjectId(req.session.user._id) }, { $set: { isActive: false } }, function(err, emp) {

        if (err) throw err;

        req.session.user = null;
        return res.json({ success: true });
    });
});

router.put('/update', function(req, res, next) {
    var cursor = collection.updateOne({ isActive: true, _id: new ObjectId(req.session.user._id) }, { $set: req.body },
        function(err, updatedEmp) {

            if (err) throw err;

            console.log("emp update---");
            console.log(updatedEmp);

            return res.json({ success: true, emp: updatedEmp });
        });
});


module.exports = router;