const ImmunizationLog = require("../../Model/ImmunizationLogs/immunizationLog.model.js");
const axios = require('axios');  // For third-party API

class ImmunizationLogService {
  async createLog(data) {
    // Third-party API integration: Fetch vaccine info from CDC API (example)
    try {
      // const vaccineInfo = await axios.get(`https://api.cdc.gov/vaccines/info/${data.vaccineId}`);  // Replace with real API endpoint
      // data.notes = data.notes || `Vaccine details: ${vaccineInfo.data.description}`;  // Enhance notes with API data
    } catch (apiError) {
      console.error('Third-party API error:', apiError);  // Handle gracefully, don't fail creation
    }

    const log = new ImmunizationLog(data);
    const savedLog = await log.save().then((doc) => doc.populate('userId vaccineId'));

    return savedLog;
  }

  async getLogs(userId, role) {
    // Admins and Doctors can see all logs
    // Regular users (Patients) can only see their own logs
    if (role === 'Admin' || role === 'Doctor') {
      return await ImmunizationLog.find().populate('userId vaccineId');
    }
    return await ImmunizationLog.find({ userId }).populate('userId vaccineId');
  }

  async getLogsByUserId(userId) {
    // Get logs for a specific user (patient)
    return await ImmunizationLog.find({ userId }).populate('userId vaccineId');
  }

  async getLogById(id) {
    return await ImmunizationLog.findById(id).populate('userId vaccineId');
  }

  async updateLog(id, data) {
    return await ImmunizationLog.findByIdAndUpdate(id, data, { new: true }).populate('userId vaccineId');
  }

  async deleteLog(id) {
    return await ImmunizationLog.findByIdAndDelete(id);
  }
}

module.exports = new ImmunizationLogService();