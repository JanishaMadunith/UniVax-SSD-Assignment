const express = require("express");
const router = express.Router();
const AppointmentController = require("../../Controllers/Appointment/AppointmentControllers");
const authMiddleware = require("../../middlewares/auth.middleware");


router.get("/test/all", AppointmentController.getAllAppointments);
router.post("/create",authMiddleware(['Patient']), AppointmentController.createAppointment);
router.get("/",authMiddleware(['Admin', 'Doctor']), AppointmentController.getAllAppointments);
router.get("/user/:email",authMiddleware(['Patient', 'Doctor', 'Admin']), AppointmentController.getAppointmentsByEmail);
router.get("/:id",authMiddleware(['Patient', 'Doctor', 'Admin']), AppointmentController.getAppointmentById);
router.put("/:id",authMiddleware(['Patient', 'Admin', 'Doctor']), AppointmentController.updateAppointment);
router.patch("/:id",authMiddleware(['Doctor', 'Admin']), AppointmentController.patchAppointment);
router.delete("/:id",authMiddleware(['Patient', 'Admin', 'Doctor']), AppointmentController.deleteAppointment);

module.exports = router;
