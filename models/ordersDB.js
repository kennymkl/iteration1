const mongoose = require('mongoose');


// BASICALLY THE SAME AS
const orderSchema = new mongoose.Schema({ 
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users'}, // Connected to a user by reference
    username: {type: String, required: true}, 
    items: [{
        item_photo:{type: String, required:true},
        item_name: {type: String, required: true},
        price: {type: Number, required: true},
        size: {type: String, required: true},
        quantity: {type: Number, required: true},
        total_price: {type: Number, required: true}
    }],
}); 

const orders = mongoose.model('orders', orderSchema);

module.exports = orders;