const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../../server');
const ImmunizationLog = require('../../Model/ImmunizationLogs/immunizationLog.model');
const User = require('../../Model/users/UserModel');
const VaccineProduct = require('../../Model/vaccineCatalog/VaccineModel');

const USER_API = '/api/V1/users';
const LOG_API  = '/api/V1/logs';
const VAX_API  = '/api/V1/vaccines';

// ============================================================
// INTEGRATION TESTS — Immunization Log HTTP Endpoints
// Tests full request → controller → service → MongoDB pipeline
// ============================================================
describe('Immunization Log — Integration Testing', () => {
    let adminToken, doctorToken, patientToken, officialToken;
    let patientUserId;
    let testVaccineId;
    let testLogId;
    const ts = Date.now();

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test');
        }
        // Pre-clean any leftover test data
        await User.deleteMany({ email: /^intlog/ });
        await VaccineProduct.deleteMany({ name: /^IntLogVaccine_/ });
        await ImmunizationLog.deleteMany({ batchNumber: /^INTLOG/ });

        // Register Admin
        const a = await request(server).post(`${USER_API}/register`).send({
            name: `IntLogAdmin_${ts}`, email: 'intlogadmin@test.com',
            phone: '0770022222', password: 'password123',
            confirmPassword: 'password123', agreeToTerms: true, role: 'Admin',
            address: { city: 'Colombo', district: 'Western' }
        });
        adminToken = a.body.token;

        // Register Doctor
        const d = await request(server).post(`${USER_API}/register`).send({
            name: `IntLogDoc_${ts}`, email: 'intlogdoc@test.com',
            phone: '0770033333', password: 'password123',
            confirmPassword: 'password123', agreeToTerms: true, role: 'Doctor',
            address: { city: 'Colombo', district: 'Western' }
        });
        doctorToken = d.body.token;

        // Register Patient
        const p = await request(server).post(`${USER_API}/register`).send({
            name: `IntLogPatient_${ts}`, email: 'intlogpatient@test.com',
            phone: '0770044444', password: 'password123',
            confirmPassword: 'password123', agreeToTerms: true,
            address: { city: 'Colombo', district: 'Western' }
        });
        if (!p.body.user) throw new Error(`Patient registration failed: ${JSON.stringify(p.body)}`);
        patientToken  = p.body.token;
        patientUserId = p.body.user.id;

        // Register Official (no POST log permission)
        const o = await request(server).post(`${USER_API}/register`).send({
            name: `IntLogOfficial_${ts}`, email: 'intlogoff@test.com',
            phone: '0770055555', password: 'password123',
            confirmPassword: 'password123', agreeToTerms: true, role: 'Official',
            address: { city: 'Colombo', district: 'Western' }
        });
        officialToken = o.body.token;

        // Create a vaccine for log tests
        const v = await request(server)
            .post(VAX_API)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: `IntLogVaccine_${ts}`,
                genericName: 'Integration Generic',
                manufacturer: 'Int Mfr',
                cvxCode: String(ts).slice(-8),
                presentation: 'vial',
                volume: { value: 0.5, unit: 'mL' },
                totalDoses: 3
            });
        testVaccineId = v.body.data._id;
    }, 60000);

    afterAll(async () => {
        await ImmunizationLog.deleteMany({ batchNumber: /^INTLOG/ });
        await VaccineProduct.deleteMany({ name: /^IntLogVaccine_/ });
        await User.deleteMany({ email: /^intlog/ });
    });

    const makeLog = (overrides = {}) => ({
        userId: patientUserId,
        vaccineId: testVaccineId,
        dateAdministered: new Date().toISOString(),
        doseNumber: 1,
        clinic: 'Integration Clinic',
        brand: 'IntBrand',
        batchNumber: `INTLOG_${Date.now()}`,
        ...overrides
    });

    // --- POST /logs ---
    describe(`POST ${LOG_API}`, () => {
        it('Should create a log with Doctor token and return 201', async () => {
            const res = await request(server)
                .post(LOG_API)
                .set('Authorization', `Bearer ${doctorToken}`)
                .send(makeLog({ batchNumber: 'INTLOG_CREATE' }));
            expect(res.statusCode).toBe(201);
            expect(res.body._id).toBeDefined();
            testLogId = res.body._id;
        });

        it('Should return 401 when no token is provided', async () => {
            const res = await request(server).post(LOG_API).send(makeLog());
            expect(res.statusCode).toBe(401);
        });

        it('Should return 403 when Official attempts to create a log', async () => {
            const res = await request(server)
                .post(LOG_API)
                .set('Authorization', `Bearer ${officialToken}`)
                .send(makeLog());
            expect(res.statusCode).toBe(403);
        });

        it('Should return 400 when required fields are missing', async () => {
            const res = await request(server)
                .post(LOG_API)
                .set('Authorization', `Bearer ${doctorToken}`)
                .send({ userId: patientUserId }); // severely incomplete
            expect(res.statusCode).toBe(400);
        });
    });

    // --- GET /logs ---
    describe(`GET ${LOG_API}`, () => {
        it('Should return 200 and an array of logs for Admin', async () => {
            const res = await request(server)
                .get(LOG_API)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('Should return 401 without authentication token', async () => {
            const res = await request(server).get(LOG_API);
            expect(res.statusCode).toBe(401);
        });

        it('Should allow Doctor to retrieve all logs', async () => {
            const res = await request(server)
                .get(LOG_API)
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('Should allow Doctor to filter logs by userId query param', async () => {
            const res = await request(server)
                .get(`${LOG_API}?userId=${patientUserId}`)
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    // --- GET /logs/:id ---
    describe(`GET ${LOG_API}/:id`, () => {
        it('Should return 200 and the log document for a valid ID', async () => {
            expect(testLogId).toBeDefined();
            const res = await request(server)
                .get(`${LOG_API}/${testLogId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body._id).toBe(testLogId);
        });

        it('Should return 404 for a valid but non-existent ObjectId', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(server)
                .get(`${LOG_API}/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(404);
        });

        it('Should return 4xx or 5xx for an invalid ID format', async () => {
            const res = await request(server)
                .get(`${LOG_API}/not-a-valid-id`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });

    // --- PUT /logs/:id ---
    describe(`PUT ${LOG_API}/:id`, () => {
        it('Should update log notes with Doctor token and return 200', async () => {
            const res = await request(server)
                .put(`${LOG_API}/${testLogId}`)
                .set('Authorization', `Bearer ${doctorToken}`)
                .send({ notes: 'Integration updated note' });
            expect(res.statusCode).toBe(200);
            expect(res.body.notes).toBe('Integration updated note');
        });

        it('Should return 403 when Patient attempts to update a log', async () => {
            const res = await request(server)
                .put(`${LOG_API}/${testLogId}`)
                .set('Authorization', `Bearer ${patientToken}`)
                .send({ notes: 'Patient attempt' });
            expect(res.statusCode).toBe(403);
        });

        it('Should return 404 when updating a non-existent log', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(server)
                .put(`${LOG_API}/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ notes: 'ghost log' });
            expect(res.statusCode).toBe(404);
        });
    });

    // --- DELETE /logs/:id ---
    describe(`DELETE ${LOG_API}/:id`, () => {
        it('Should delete log with Admin token and return 200', async () => {
            // Create a throwaway log
            const tmp = await request(server)
                .post(LOG_API)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(makeLog({ batchNumber: 'INTLOG_FOR_DELETE' }));
            const delId = tmp.body._id;

            const res = await request(server)
                .delete(`${LOG_API}/${delId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
        });

        it('Should return 403 when Doctor attempts to delete a log', async () => {
            const res = await request(server)
                .delete(`${LOG_API}/${testLogId}`)
                .set('Authorization', `Bearer ${doctorToken}`);
            expect(res.statusCode).toBe(403);
        });

        it('Should return 404 when deleting a non-existent log', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(server)
                .delete(`${LOG_API}/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(404);
        });
    });
});
