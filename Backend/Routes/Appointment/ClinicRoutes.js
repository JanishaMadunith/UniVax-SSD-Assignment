const express = require("express");
const router = express.Router();
const ClinicController = require("../../Controllers/Appointment/ClinicControllers");
const authMiddleware = require("../../middlewares/auth.middleware");

router.post("/create",authMiddleware(['Admin']), ClinicController.createClinic);
router.get("/",authMiddleware(['Patient', 'Doctor', 'Admin']), ClinicController.getAllClinics);
router.get("/:id",authMiddleware(['Patient', 'Doctor', 'Admin']), ClinicController.getClinicById);
router.put("/:id",authMiddleware(['Admin']), ClinicController.updateClinic);
router.delete("/:id",authMiddleware(['Admin']), ClinicController.deleteClinic);

module.exports = router;