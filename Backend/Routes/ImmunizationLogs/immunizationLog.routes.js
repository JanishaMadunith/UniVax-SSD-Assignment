const express = require('express');
const router = express.Router();
const { createLog, getLogs, getLogById, updateLog, deleteLog } = require("../../Controllers/ImmunizationLogs/immunization.controller.js");
const authMiddleware = require('../../middlewares/auth.middleware.js');  // Placeholder for JWT/role check

// Protected routes
router.post('/', authMiddleware(['Doctor','Patient', 'Admin']), createLog);  // Only doctors/admins create
router.get('/', authMiddleware(['Patient', 'Doctor', 'Admin','Official']), getLogs);
router.get('/:id', authMiddleware(['Patient', 'Doctor', 'Admin','Official']), getLogById);
router.put('/:id', authMiddleware(['Doctor', 'Admin']), updateLog);
router.delete('/:id', authMiddleware(['Admin','Official']), deleteLog);

module.exports = router;