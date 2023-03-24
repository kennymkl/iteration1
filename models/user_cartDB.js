const mongoose = require('mongoose');

const usercartSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users'}, // Connected to a user by reference
    username: {type: String, required: true},
    items: [{
        // item_id: {type: mongoose.Schema.Types.ObjectId, ref:'items'},
        item_photo:{type: String, required:true},
        item_name: {type: String, required: true},
        price: {type: Number, required: true},
        size: {type: String, required: true},
        quantity: {type: Number, required: true}
    }]
}); 

const usercart = mongoose.model('usercart', usercartSchema);

module.exports = usercart;