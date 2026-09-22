const vaccineService = require('../../Services/vaccineCatalog/VaccineService');
const doseService = require('../../Services/vaccineCatalog/DoseService');
const { sendNewVaccineNotification } = require('../../Services/emailService');
const User = require('../../Model/users/UserModel');

// @desc    CREATE a new vaccine
// @route   POST /api/vaccines
exports.createVaccine = async (req, res) => {
  try {
    const result = await vaccineService.createVaccine(req.body, req.user?.id);

    // Send email notification to the creator (non-blocking)
    if (req.user && result.data) {
      let email = req.user.email;
      if (!email) {
        const user = await User.findById(req.user.id).select('email');
        email = user?.email;
      }
      if (email) {
        sendNewVaccineNotification(result.data, email).catch(err =>
          console.error('New vaccine email error:', err.message)
        );
      }
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    READ all vaccines (with filtering)
// @route   GET /api/vaccines
exports.getAllVaccines = async (req, res) => {
  try {
    const result = await vaccineService.getAllVaccines(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      data: error.data || []
    });
  }
};

// @desc    READ single vaccine by ID
// @route   GET /api/vaccines/:id
exports.getVaccineById = async (req, res) => {
  try {
    const result = await vaccineService.getVaccineById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    UPDATE a vaccine (with versioning)
// @route   PUT /api/vaccines/:id
exports.updateVaccine = async (req, res) => {
  try {
    const result = await vaccineService.updateVaccine(req.params.id, req.body, req.user?.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    DELETE (soft delete) a vaccine
// @route   DELETE /api/vaccines/:id
exports.deleteVaccine = async (req, res) => {
  try {
    const reason = req.body?.reason;
    const result = await vaccineService.deleteVaccine(req.params.id, reason);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    GET vaccine history/versions
// @route   GET /api/vaccines/:id/history
exports.getVaccineHistory = async (req, res) => {
  try {
    const result = await vaccineService.getVaccineHistory(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    CREATE dose requirement for a vaccine
// @route   POST /api/vaccines/:vaccineId/doses
exports.createDose = async (req, res) => {
  try {
    const result = await doseService.createDose(req.params.vaccineId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    GET all doses for a vaccine
// @route   GET /api/vaccines/:vaccineId/doses
exports.getVaccineDoses = async (req, res) => {
  try {
    const result = await doseService.getVaccineDoses(req.params.vaccineId);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message,
      data: error.data || []
    });
  }
};

// @desc    UPDATE a dose requirement
// @route   PUT /api/doses/:id
exports.updateDose = async (req, res) => {
  try {
    const result = await doseService.updateDose(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    DELETE a dose requirement
// @route   DELETE /api/doses/:id
exports.deleteDose = async (req, res) => {
  try {
    const result = await doseService.deleteDose(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Calculate next due date based on patient age
// @route   POST /api/doses/calculate
exports.calculateDueDate = async (req, res) => {
  try {
    const { vaccineId, patientAgeMonths, lastDoseDate, doseNumber } = req.body;
    const result = await doseService.calculateDueDate(vaccineId, patientAgeMonths, lastDoseDate, doseNumber);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
};

