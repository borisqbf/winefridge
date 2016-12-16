var mongoose = require('mongoose');

var WineSchema = new mongoose.Schema({
    name: String,
    varietal: [String],
    winery: String,
    year: Number,
    bestFrom: Number,
    bestTo: Number,
    price: {type: Number, default: 0},
    shelf: Number,
    column: Number,
    isConsumed: Boolean,
    image: String,
    category: String,
    changedBy: String,
    lastModified: Date,
    comments: [{type:mongoose.Schema.ObjectId, ref: 'Comment'}]
});

WineSchema.pre('save', function (next) {
    this.setCategory();
    next();
});

WineSchema.pre('update', function () {
    var v = this.getUpdate();
    v.$set.category = this.schema.methods.updateCategory(v.$set.varietal);
});


WineSchema.methods.setCategory = function () {
    this.category = this.updateCategory(this.varietal);
};

WineSchema.methods.updateCategory = function (varietal) {
    var whitePattern = new RegExp("chardonnay|pinot grigio|pinot gris|riesling|sauvignon blanc", "i");
    if (!varietal || varietal.length === 0)
        return null;
    for (var i = 0; i < varietal.length; i++) {
        if (whitePattern.test(varietal[i]))
            return "white";
    }
    return "red";
};

mongoose.model('Wine', WineSchema);