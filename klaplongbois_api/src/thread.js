const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ThreadSchema = new Schema({
    title: String,
    content: String,
    upvotes: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],
    downvotes: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'comment'
    }]
});

ThreadSchema.pre('remove', function(next) {
    const Comment = mongoose.model('comment');
    Comment.remove({ _id: { $in: this.comments } })
        .then(() => next());
});

const Thread = mongoose.model('thread', ThreadSchema);

module.exports = Thread;