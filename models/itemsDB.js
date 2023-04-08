const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    collection_type: { type: String, default: ""},
    item_name: { type: String, required: true},
    description: { type: String, required: true},
    availability: [{
        size: {type: String, required: true, default: ""},
        stock: {type: Number, required: true, default: 0}
    }],
    price: {type: Number, required: true},
    item_photo: {type: String}
}); 

const items = mongoose.model('items', itemSchema);

module.exports = items;