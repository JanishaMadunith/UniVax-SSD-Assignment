const immunizationLogService = require("../../Services/ImmunizationLogs/immunizationLog.service.js");
const { sendVaccinationRecordNotification } = require("../../Services/emailService");
const User = require("../../Model/users/UserModel");

const createLog = async (req, res) => {
  try {
    const log = await immunizationLogService.createLog(req.body);

    // Send email notification to the patient (non-blocking)
    if (log && log.userId) {
      const patient = await User.findById(log.userId).select('email name');
      if (patient && patient.email) {
        sendVaccinationRecordNotification(log, patient.email, patient.name).catch(err =>
          console.error('Vaccination email error:', err.message)
        );
      }
    }

    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getLogs = async (req, res) => {
  try {
    // Allow filtering by userId through query parameter (for doctors viewing patient logs)
    const userId = req.query.userId;
    let logs;
    
    if (userId) {
      // Doctor is requesting logs for a specific patient
      logs = await immunizationLogService.getLogsByUserId(userId);
    } else {
      // Get logs based on user's role
      logs = await immunizationLogService.getLogs(req.user.id, req.user.role);
    }
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLogById = async (req, res) => {
  try {
    const log = await immunizationLogService.getLogById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLog = async (req, res) => {
  try {
    const log = await immunizationLogService.updateLog(req.params.id, req.body);
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteLog = async (req, res) => {
  try {
    const log = await immunizationLogService.deleteLog(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json({ message: 'Log deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createLog, getLogs, getLogById, updateLog, deleteLog };