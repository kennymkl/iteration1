const mongoose = require('mongoose');


// BASICALLY THE SAME AS USERCART EXCEPT IT HAS AN ORDER STATUS
const orderSchema = new mongoose.Schema({ 
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users'}, // Connected to a user by reference
    username: {type: String, required: true},
    address: {type: String, default: ""},
    contact_no: {type: String, default: ""},
    status: {type: String, required: true, default: "Waiting for Payment Confirmation."}, // EX. Has Not Been Paid, Payment Confirmed, Items Packed, Ready for Shipping 
    items: [{
        item_photo:{type: String, required:true},
        item_name: {type: String, required: true},
        price: {type: Number, required: true},
        size: {type: String, required: true},
        quantity: {type: Number, required: true}
    }],
    total_price: {type: Number, required: true}
}); 

const orders = mongoose.model('orders', orderSchema);

module.exports = orders;