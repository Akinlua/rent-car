const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const CarSchema = new Schema({

    name: {
        type: String,
        required: [true, 'Please provide a name for the car'],
        maxlength: 500,
    },
    company: {
        type: String,
        required: [true, 'Please provide the company name for the car'],
        maxlength: 500,
    },
    price_per_hour: {
        type: Number,
    },
    price_per_day:{
        type: Number,
    },
    price_per_lease:{
        type: Number,
    },
    transmission: {
        type: String,
        maxlength: 500,
    },
    seats: {
        type: String,
        maxlength: 500,
    },
    mileage: {
        type: String,
        maxlength: 500,
    },
    fuel: {
        type: String,
        maxlength: 500,
    },
    features: [{type: String, maxlength: 500}],
    description: {
        type: String,
        maxlength: 2500,
    },
    pic_originalname: {
        type: String,
        required: [true, 'Please provide a picture'],
    },
    pic_path:{
        type: String,
        required: [true, 'Please provide a picture']
    },

}, {timestamps: true});

module.exports = mongoose.model('Car', CarSchema);