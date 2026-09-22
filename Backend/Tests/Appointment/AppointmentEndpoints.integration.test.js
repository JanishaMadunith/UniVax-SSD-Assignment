const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../../server');
const Appointment = require('../../Model/Appointment/AppointmentModel');
const Clinic = require('../../Model/Appointment/ClinicModel');
const User = require('../../Model/users/UserModel');
const jwt = require('jsonwebtoken');

const API_PREFIX = '/api/V1/appointments';

describe('Appointment Endpoints - Integration Tests', () => {
    let appointmentId;
    let clinicId;
    let authToken;
    let adminToken;
    let testEmail = 'apttest@integration.test';

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test';
            await mongoose.connect(MONGO_URI);
        }

        // Create test clinic
        const clinic = await Clinic.create({
            clinicName: 'Test Clinic',
            address: '123 Test St',
            city: 'Test City',
            district: 'Test District',
            phone: '0712345678',
            email: 'clinic@test.com',
            clinicType: 'Private',
            openDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            openTime: '09:00',
            closeTime: '17:00'
        });

        clinicId = clinic._id;

        // Create test patient user
        const user = await User.create({
            name: 'Test User',
            email: testEmail,
            phone: '0712345678',
            password: 'hashedPassword123',
            role: 'Patient',
            address: {
                city: 'Test City',
                district: 'Test District'
            },
            agreeToTerms: true
        });

        authToken = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'testsecret',
            { expiresIn: '24h' }
        );

        // Create test admin user for endpoints requiring admin
        const admin = await User.create({
            name: 'Test Admin',
            email: 'testadmin@integration.test',
            phone: '0712345679',
            password: 'hashedPassword123',
            role: 'Admin',
            address: {
                city: 'Test City',
                district: 'Test District'
            },
            agreeToTerms: true
        });

        adminToken = jwt.sign(
            { userId: admin._id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET || 'testsecret',
            { expiresIn: '24h' }
        );
    });

    afterAll(async () => {
        await Appointment.deleteMany({ email: new RegExp(testEmail) });
        await Clinic.deleteOne({ _id: clinicId });
        await User.deleteOne({ email: testEmail });
        await User.deleteOne({ email: 'testadmin@integration.test' });

        if (mongoose.connection.readyState) {
            await mongoose.connection.close();
        }
    });

    describe(`POST ${API_PREFIX}/create`, () => {
        it('should create appointment with valid data', async () => {
            const appointmentData = {
                clinicId: clinicId.toString(),
                fullName: 'John Patient',
                email: testEmail,
                phone: '0712345678',
                vaccineType: 'COVID-19',
                ageGroup: 'Adult (18-60)',
                appointmentDate: '2024-12-20',
                appointmentTime: '10:00'
            };

            const res = await request(server)
                .post(`${API_PREFIX}/create`)
                .send(appointmentData)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.appointment.email).toBe(testEmail);

            appointmentId = res.body.appointment._id;
        });

        it('should reject appointment with missing required fields', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/create`)
                .send({ fullName: 'Test', email: testEmail })
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should reject appointment with invalid clinic', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/create`)
                .send({
                    clinicId: new mongoose.Types.ObjectId().toString(),
                    fullName: 'Test',
                    email: 'test2@test.com',
                    phone: '0712345678',
                    vaccineType: 'COVID-19',
                    ageGroup: 'Adult (18-60)',
                    appointmentDate: '2024-12-20',
                    appointmentTime: '10:00'
                })
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
        });
    });

    describe(`GET ${API_PREFIX}`, () => {
        it('should return all appointments', async () => {
            const res = await request(server)
                .get(API_PREFIX)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.appointments)).toBe(true);
        });
    });

    describe(`GET ${API_PREFIX}/:id`, () => {
        it('should return appointment by ID', async () => {
            if (!appointmentId) {
                const aptData = {
                    clinicId: clinicId.toString(),
                    fullName: 'Test',
                    email: 'gettest@test.com',
                    phone: '0712345678',
                    vaccineType: 'COVID-19',
                    ageGroup: 'Adult (18-60)',
                    appointmentDate: '2024-12-25',
                    appointmentTime: '14:00'
                };

                const createRes = await request(server)
                    .post(`${API_PREFIX}/create`)
                    .send(aptData)
                    .set('Authorization', `Bearer ${authToken}`);

                appointmentId = createRes.body.appointment._id;
            }

            const res = await request(server)
                .get(`${API_PREFIX}/${appointmentId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.appointment._id).toEqual(appointmentId);
        });

        it('should return 404 for non-existent appointment', async () => {
            const res = await request(server)
                .get(`${API_PREFIX}/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(404);
        });
    });

    describe(`GET ${API_PREFIX}/user/:email`, () => {
        it('should return appointments for valid email', async () => {
            const res = await request(server)
                .get(`${API_PREFIX}/user/${testEmail}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe(`PUT ${API_PREFIX}/:id`, () => {
        it('should update appointment successfully', async () => {
            if (!appointmentId) {
                const aptData = {
                    clinicId: clinicId.toString(),
                    fullName: 'Update Test',
                    email: 'updatetest@test.com',
                    phone: '0712345678',
                    vaccineType: 'COVID-19',
                    ageGroup: 'Adult (18-60)',
                    appointmentDate: '2024-12-26',
                    appointmentTime: '15:00'
                };

                const createRes = await request(server)
                    .post(`${API_PREFIX}/create`)
                    .send(aptData)
                    .set('Authorization', `Bearer ${authToken}`);

                appointmentId = createRes.body.appointment._id;
            }

            const res = await request(server)
                .put(`${API_PREFIX}/${appointmentId}`)
                .send({ fullName: 'Updated Name' })
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.appointment.fullName).toBe('Updated Name');
        });

        it('should return 404 when updating non-existent appointment', async () => {
            const res = await request(server)
                .put(`${API_PREFIX}/${new mongoose.Types.ObjectId()}`)
                .send({ fullName: 'Updated' })
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(404);
        });
    });

    describe(`DELETE ${API_PREFIX}/:id`, () => {
        it('should delete appointment successfully', async () => {
            // Use next Tuesday (guaranteed to be a weekday)
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + ((2 - futureDate.getDay() + 7) % 7 || 7));

            const dateString = futureDate.toISOString().split('T')[0];

            const aptData = {
                clinicId: clinicId.toString(),
                fullName: 'Delete Test',
                email: 'deletetest@test.com',
                phone: '0712345678',
                vaccineType: 'COVID-19',
                ageGroup: 'Adult (18-60)',
                appointmentDate: dateString,
                appointmentTime: '16:00'
            };

            const createRes = await request(server)
                .post(`${API_PREFIX}/create`)
                .send(aptData)
                .set('Authorization', `Bearer ${authToken}`);

            expect(createRes.statusCode).toBe(201);
            expect(createRes.body.appointment).toBeDefined();

            const res = await request(server)
                .delete(`${API_PREFIX}/${createRes.body.appointment._id}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should return 404 when deleting non-existent appointment', async () => {
            const res = await request(server)
                .delete(`${API_PREFIX}/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(404);
        });
    });

    describe('Data Validation', () => {
        it('should successfully create appointment', async () => {
            // Use next Tuesday (guaranteed to be a weekday)
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + ((2 - futureDate.getDay() + 7) % 7 || 7));
            
            const dateString = futureDate.toISOString().split('T')[0];
            const uniqueEmail = `validationtest${Date.now()}@test.com`;

            const res = await request(server)
                .post(`${API_PREFIX}/create`)
                .send({
                    clinicId: clinicId.toString(),
                    fullName: 'Validation Test',
                    email: uniqueEmail,
                    phone: '0712345678',
                    vaccineType: 'COVID-19',
                    ageGroup: 'Adult (18-60)',
                    appointmentDate: dateString,
                    appointmentTime: '10:00'
                })
                .set('Authorization', `Bearer ${authToken}`);

            if (res.statusCode !== 201) {
                console.log('Response status:', res.statusCode);
                console.log('Response body:', res.body);
            }

            expect(res.statusCode).toBe(201);
       });
    });
});
