const express = require('express');
const router = express.Router();
const doseController = require('../../Controllers/vaccineCatalog/DoseController');
const authMiddleware = require("../../middlewares/auth.middleware"); 

// Validation middleware for creating doses (strict - all fields required)
const validateDose = (req, res, next) => {
  const { doseNumber, minAge } = req.body;
  const errors = [];

  if (!doseNumber || doseNumber < 1) {
    errors.push('Dose number must be a positive integer');
  }

  if (!minAge || !minAge.value || minAge.value < 0) {
    errors.push('Min age with value is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

// Validation middleware for updating doses (lenient - only validate provided fields)
const validateDoseUpdate = (req, res, next) => {
  const { doseNumber, minAge } = req.body;
  const errors = [];

  // Only validate if the field is being updated
  if (doseNumber !== undefined && doseNumber < 1) {
    errors.push('Dose number must be a positive integer');
  }

  if (minAge && minAge.value !== undefined && minAge.value < 0) {
    errors.push('Min age value must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  next();
};

// Dose routes
router.post('/vaccine/:vaccineId',authMiddleware(['Doctor', 'Admin']),validateDose, doseController.createDose);
router.get('/vaccine/:vaccineId',authMiddleware(['Patient', 'Doctor', 'Admin']), doseController.getVaccineDoses);
router.get('/:id', authMiddleware(['Patient', 'Doctor', 'Admin']), doseController.getDoseById);
router.put('/:id', authMiddleware(['Doctor', 'Admin']), validateDoseUpdate, doseController.updateDose);
router.delete('/:id', authMiddleware(['Doctor', 'Admin']), doseController.deleteDose);
router.post('/calculate', authMiddleware(['Doctor', 'Admin']),doseController.calculateDueDate);

module.exports = router;