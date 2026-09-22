const AppointmentService = require('../../Services/Appointment/AppointmentService');
const Appointment = require('../../Model/Appointment/AppointmentModel');
const mongoose = require('mongoose');

jest.mock('../../Model/Appointment/AppointmentModel');

describe('AppointmentService - Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createAppointment', () => {
        it('should successfully create appointment with valid data', async () => {
            const appointmentData = {
                clinicId: new mongoose.Types.ObjectId(),
                fullName: 'John Doe',
                email: 'john@test.com',
                phone: '0712345678',
                vaccineType: 'COVID-19',
                ageGroup: 'Adult (18-60)',
                appointmentDate: '2024-05-15',
                appointmentTime: '10:00'
            };

            const mockAppointment = {
                _id: new mongoose.Types.ObjectId(),
                ...appointmentData,
                save: jest.fn().mockResolvedValue(true)
            };

            Appointment.mockImplementation(() => mockAppointment);

            const result = await AppointmentService.createAppointment(appointmentData);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Appointment created successfully');
        });

        it('should handle creation errors', async () => {
            const mockAppointment = {
                save: jest.fn().mockRejectedValue(new Error('DB Error'))
            };

            Appointment.mockImplementation(() => mockAppointment);

            try {
                await AppointmentService.createAppointment({});
                fail('Should have thrown error');
            } catch (error) {
                expect(error.status).toBe(500);
                expect(error.message).toBe('Server error during appointment creation');
                expect(error.error).toBe('DB Error');
            }
        });
    });

    describe('getAllAppointments', () => {
        it('should return all appointments', async () => {
            const mockAppointments = [
                { _id: new mongoose.Types.ObjectId(), fullName: 'Patient 1', email: 'p1@test.com' },
                { _id: new mongoose.Types.ObjectId(), fullName: 'Patient 2', email: 'p2@test.com' }
            ];

            Appointment.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockAppointments)
            });

            const result = await AppointmentService.getAllAppointments();

            expect(result.success).toBe(true);
            expect(result.count).toBe(2);
        });

        it('should handle empty appointments list', async () => {
            Appointment.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([])
            });

            try {
                await AppointmentService.getAllAppointments();
                fail('Should have thrown error');
            } catch (error) {
                expect(error.status).toBe(404);
            }
        });
    });

    describe('getAppointmentById', () => {
        it('should return appointment by valid ID', async () => {
            const appointmentId = new mongoose.Types.ObjectId();
            const mockAppointment = { _id: appointmentId, fullName: 'John', email: 'john@test.com' };

            Appointment.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockAppointment)
            });

            const result = await AppointmentService.getAppointmentById(appointmentId);

            expect(result.success).toBe(true);
            expect(result.appointment._id).toEqual(appointmentId);
        });

        it('should handle non-existent appointment', async () => {
            Appointment.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            try {
                await AppointmentService.getAppointmentById(new mongoose.Types.ObjectId());
                fail('Should have thrown error');
            } catch (error) {
                expect(error.status).toBe(404);
            }
        });
    });

    describe('getAppointmentsByEmail', () => {
        it('should return appointments for valid email', async () => {
            const mockAppointments = [{ _id: new mongoose.Types.ObjectId(), email: 'test@test.com' }];

            Appointment.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockAppointments)
            });

            const result = await AppointmentService.getAppointmentsByEmail('test@test.com');

            expect(result.success).toBe(true);
            expect(result.data.length).toBe(1);
        });

        it('should return empty array when no appointments found', async () => {
            Appointment.find = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue([])
            });

            const result = await AppointmentService.getAppointmentsByEmail('noone@test.com');

            expect(result.data.length).toBe(0);
        });
    });

    describe('updateAppointment', () => {
        it('should successfully update appointment', async () => {
            const appointmentId = new mongoose.Types.ObjectId();
            const mockUpdated = { _id: appointmentId, fullName: 'Updated', email: 'test@test.com' };

            Appointment.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdated);

            const result = await AppointmentService.updateAppointment(appointmentId, { fullName: 'Updated' });

            expect(result.success).toBe(true);
            expect(result.message).toBe('Appointment updated successfully');
        });

        it('should handle error when appointment not found', async () => {
            Appointment.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

            try {
                await AppointmentService.updateAppointment(new mongoose.Types.ObjectId(), {});
                fail('Should have thrown error');
            } catch (error) {
                expect(error.status).toBe(404);
                expect(error.message).toBe('Appointment not found');
            }
        });
    });

    describe('deleteAppointment', () => {
        it('should successfully delete appointment', async () => {
            const appointmentId = new mongoose.Types.ObjectId();

            Appointment.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: appointmentId });

            const result = await AppointmentService.deleteAppointment(appointmentId);

            expect(result.success).toBe(true);
            expect(result.message).toBe('Appointment deleted successfully');
        });

        it('should handle error when appointment not found', async () => {
            Appointment.findByIdAndDelete = jest.fn().mockResolvedValue(null);

            try {
                await AppointmentService.deleteAppointment(new mongoose.Types.ObjectId());
                fail('Should have thrown error');
            } catch (error) {
                expect(error.status).toBe(404);
                expect(error.message).toBe('Appointment not found');
            }
        });
    });
});
