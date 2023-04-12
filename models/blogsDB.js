const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    blog_name: { type: String, required: true},
    description: { type: String, required: true},
    blog_photo: {type: String}
}); 

const blogs = mongoose.model('blogs', blogSchema);

module.exports = blogs;