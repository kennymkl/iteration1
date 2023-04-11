const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true, min: 3, max: 16 },
    user_type: {type: Number, required: true, default: 0}, // 0 - default user | 1 - admin | 2 - super user 
    email: {type: String, lowercase: true, unique: true},
    password: { type: String, required: true, min: 3 },
    contact_no: {type: String, default: ""},
    address: {type: String, default: ""}
}); 

const users = mongoose.model('users', userSchema);

module.exports = users;