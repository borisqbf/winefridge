var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var multer = require('multer');
var jwt = require('express-jwt');

var auth = jwt({ secret: 'SECRET', userProperty: 'payload' });

var Wine = mongoose.model('Wine');
var Comment = mongoose.model('Comment');

var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

router.get('/', function (req, res, next) {
    var excludeEmpty = req.query.excludeEmpty;

    if (!excludeEmpty) {
        Wine.find(function (err, wines) {
            if (err) {
                return next(err);
            }
            res.json(wines);
        });
    } else {
        var query = Wine.find({ isConsumed: false });
        query.exec(function (err, wines) {
            if (err) {
                return next(err);
            }
            res.json(wines);
        });
    }
});

router.get('/:id', function (req, res) {
    req.wine.populate('comments', function (err, wine) {
        if (err) {
            return next(err);
        }
        res.json(req.wine);

    });
})

router.post('/', auth, function (req, res, next) {
    var wine = new Wine(req.body);
    wine.changedBy = req.payload.username;
    wine.lastModified = new Date();
    wine.save(function (err, wine) {
        if (err) {
            return next(err);
        }
        res.json(wine);
    });
});

router.put('/:id', auth, function (req, res, next) {
    var id = req.id;
    if (req.wine) {
        req.body.changedBy = req.payload.username;
        req.body.lastModified = new Date();

        req.wine.update(req.body, function (err, wine) {
            if (err) {
                return next(err);
            }
            res.json(wine);
        });
    }
});

router.put('/:id/uploadPic', auth, upload.any(), function (req, res, next) {
    var id = req.id;
    if (req.wine) {
        req.body.changedBy = req.payload.username;
        req.body.lastModified = new Date();
        req.wine.update({ image: req.files[0].buffer.toString("base64") }, function (err, wine) {
            if (err) {
                return next(err);
            }
            res.json(wine);
        });
    }
});

router.post('/:id/comments', auth, function (req, res, next) {
    var comment = new Comment(req.body);
    comment.changedBy = req.payload.username;
    comment.lastModified = new Date();

    comment.wine = req.wine;
    comment.save(function (err, comment) {
        if (err) {
            return next(err);
        }
        req.wine.comments.push(comment);
        req.wine.save(function (err, post) {
            if (err) {
                return next(err);
            }
            res.json(comment);
        });
    });
});

// route middleware to validate :id
router.param('id', function (req, res, next, id) {
    var query = Wine.findById(id);
    query.exec(function (err, wine) {
        if (err) {
            return next(err);
        }
        if (!wine) {
            return next(new Error('can\'t find wine'));
        }
        req.wine = wine;
        return next();
    });
});


module.exports = router;