const mongoose = require('mongoose');

const postsSchema = {
    title: { type: String, required: true},
    date: { type: Date, required: true, default: Date.now },
    post_image: { type: String, required: true },
    caption: { type: String }
};

const posts = mongoose.model('posts', postsSchema);
module.exports = posts;