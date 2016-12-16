var mongoose = require('mongoose');
var CommentSchema = new mongoose.Schema({
    body: String,
    author: String,
    score: Number,
    changedBy: String,
    lastModified: Date,
    wine: {type: mongoose.Schema.Types.ObjectId, ref: 'Wine'}
});


mongoose.model('Comment', CommentSchema);