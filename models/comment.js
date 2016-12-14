var mongoose = require('mongoose');
var CommentSchema = new mongoose.Schema({
    body: String,
    author: String,
    score: Number,
    wine: {type: mongoose.Schema.Types.ObjectId, ref: 'Wine'}
});


mongoose.model('Comment', CommentSchema);