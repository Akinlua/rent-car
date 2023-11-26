const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const FormSchema = new Schema({

    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    nameId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide a user ID'],
    },
    carId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        required: [true, 'Please provide the car rented'],
    },
    car: {
        type: String,
    },
    pickup_loc: {
        type: String,
        required: [true, 'Please provide a pick up location'],
    },
    dropoff_loc: {
        type: String,
        required: [true, 'Please provide a drop off location'],
    },
    type: {
        type: String,
        enum: ['hourly', 'daily', 'lease'],
        required: [true, 'Please provide a rate'],
    },
    type_rate: {
        type: Number,
        required: [true, 'Please provide how long'],
    },
    pickup_date: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Please provide a pick up date'],
    },
    dropoff_date: {
        type: mongoose.Schema.Types.Mixed,
    },
    pickup_time: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Please provide a pick up time'],
    },
    dropoff_time: {
        type: mongoose.Schema.Types.Mixed,
    },
    total_charge:{
        type: Number,
        default: 0
    },
    paid: {
        type: Boolean,
        default: false
    },
    chargeId: {
        type: String,
    },
    receiptUrl: {
        type: String,
    },
    date: {
        type: String,
    }


}, {timestamps: true});

module.exports = mongoose.model('Form', FormSchema);