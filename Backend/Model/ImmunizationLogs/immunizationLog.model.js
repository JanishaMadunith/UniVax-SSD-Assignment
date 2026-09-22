const mongoose = require('mongoose');

const immunizationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel',  // Reference to User model (matches UserModel.js export)
    required: true,
  },
  vaccineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VaccineProduct',  // Reference to Vaccine model
    required: true,
  },
  dateAdministered: {
    type: Date,
    required: true,
  },
  doseNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  nextDueDate: {
    type: Date,
  },
  clinic: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true,
  },
  notes: {
    type: String,
  },
  digitalCertificate: {
    type: String,  // URL or base64 for certificate
  },
}, { timestamps: true });

module.exports = mongoose.model('ImmunizationLog', immunizationLogSchema);
