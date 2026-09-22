const doseService = require('../../Services/vaccineCatalog/DoseService');

// @desc    CREATE dose requirement
// @route   POST /api/doses/vaccine/:vaccineId
const createDose = async (req, res) => {
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
// @route   GET /api/doses/vaccine/:vaccineId
const getVaccineDoses = async (req, res) => {
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

// @desc    GET single dose by ID
// @route   GET /api/doses/:id
const getDoseById = async (req, res) => {
  try {
    const result = await doseService.getDoseById(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    UPDATE a dose requirement
// @route   PUT /api/doses/:id
const updateDose = async (req, res) => {
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
const deleteDose = async (req, res) => {
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

// @desc    Calculate next due date
// @route   POST /api/doses/calculate
const calculateDueDate = async (req, res) => {
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

module.exports = {
  createDose,
  getVaccineDoses,
  getDoseById,
  updateDose,
  deleteDose,
  calculateDueDate
};