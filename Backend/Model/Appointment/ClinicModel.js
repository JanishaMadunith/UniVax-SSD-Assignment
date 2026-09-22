const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clinicSchema = new Schema({
    clinicName: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    district: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    clinicType: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    openDays: {
        type: [String],  
        required: true
    },
    openTime: {
        type: String,
        required: true     
    },
    closeTime: {
        type: String,
        required: true   
    },
    availableVaccines: [{
        vaccineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VaccineProduct'
        },
        quantity: {
            type: Number,
            default: 0
        }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model("ClinicModel", clinicSchema);