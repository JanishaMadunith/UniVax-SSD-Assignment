const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../../server');
const User = require('../../Model/users/UserModel');
const VaccineProduct = require('../../Model/vaccineCatalog/VaccineModel');
const DoseRequirement = require('../../Model/vaccineCatalog/DoseModel');

const USER_API = '/api/V1/users';
const VAX_API  = '/api/V1/vaccines';
const DOSE_API = '/api/V1/doses';

// ============================================================
// INTEGRATION TESTS — Vaccine & Dose Catalog HTTP Endpoints
// Tests controllers, services, and MongoDB together via HTTP
// ============================================================
describe('Vaccine Catalog — Integration Testing', () => {
    let adminToken, doctorToken, patientToken;
    let testVaccineId;
    let testDoseId;
    const ts = Date.now();

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test');
        }
        await User.deleteMany({ email: /^vaxend/ });
        await VaccineProduct.deleteMany({ name: /^VaxEndVaccine_|^VaxEndPresent_/ });

        // Register Admin
        const a = await request(server).post(`${USER_API}/register`).send({
            name: `VaxEndAdmin_${ts}`, email: 'vaxendadmin@test.com',
            phone: '0770088888', password: 'password123',
            confirmPassword: 'password123', agreeToTerms: true, role: 'Admin',
            address: { city: 'Colombo', district: 'Western' }
        });
        adminToken = a.body.token;

        // Register Doctor
        const d = await request(server).post(`${USER_API}/register`).send({
            name: `VaxEndDoc_${ts}`, email: 'vaxenddoc@test.com',
            phone: '0770099999', password: 'password123',
            confirmPassword: 'password123', agreeToTerms: true, role: 'Doctor',
            address: { city: 'Colombo', district: 'Western' }
        });
        doctorToken = d.body.token;

        // Register Patient
        const p = await request(server).post(`${USER_API}/register`).send({
            name: `VaxEndPatient_${ts}`, email: 'vaxendpatient@test.com',
            phone: '0770100000', password: 'password123',
            confirmPassword: 'password123', agreeToTerms: true,
            address: { city: 'Colombo', district: 'Western' }
        });
        patientToken = p.body.token;

        // Create a main vaccine for GET/PUT/dose tests
        const v = await request(server)
            .post(VAX_API)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: `VaxEndVaccine_${ts}`,
                genericName: 'Endpoint Generic',
                manufacturer: 'Endpoint Mfr',
                cvxCode: String(ts + 2).slice(-8),
                presentation: 'vial',
                volume: { value: 0.5, unit: 'mL' },
                totalDoses: 3
            });
        testVaccineId = v.body.data._id;
    }, 60000);

    afterAll(async () => {
        await DoseRequirement.deleteMany({ vaccineId: testVaccineId });
        await VaccineProduct.deleteMany({ name: /^VaxEndVaccine_|^VaxEndPresent_|^VaxEndDel_/ });
        await User.deleteMany({ email: /^vaxend/ });
    });

    // --- GET /vaccines ---
    describe(`GET ${VAX_API}`, () => {
        it('Should return 200 with vaccine list when authenticated', async () => {
            const res = await request(server)
                .get(VAX_API)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('Should return 401 without an authentication token', async () => {
            const res = await request(server).get(VAX_API);
            expect(res.statusCode).toBe(401);
        });

        it('Should filter and return only active vaccines', async () => {
            const res = await request(server)
                .get(`${VAX_API}?status=active`)
                .set('Authorization', `Bearer ${patientToken}`);
            // Either 200 with active vaccines or 404 if none match
            expect([200, 404]).toContain(res.statusCode);
            if (res.statusCode === 200) {
                res.body.data.forEach(v => expect(v.status).toBe('active'));
            }
        });
    });

    // --- POST /vaccines ---
    describe(`POST ${VAX_API}`, () => {
        it('Should create a vaccine with Doctor token and return 201', async () => {
            const res = await request(server)
                .post(VAX_API)
                .set('Authorization', `Bearer ${doctorToken}`)
                .send({
                    name: `VaxEndPresent_${ts}`,
                    genericName: 'Present Generic',
                    manufacturer: 'Present Mfr',
                    cvxCode: String(ts + 3).slice(-8),
                    presentation: 'prefilled syringe',
                    volume: { value: 1.0, unit: 'mL' },
                    totalDoses: 1
                });
            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
        });

        it('Should return 400 for a non-numeric CVX code', async () => {
            const res = await request(server)
                .post(VAX_API)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Bad CVX Vaccine',
                    genericName: 'Bad Generic',
                    manufacturer: 'Bad Mfr',
                    cvxCode: 'ABC',  // must be numeric
                    presentation: 'vial',
                    volume: { value: 0.5, unit: 'mL' },
                    totalDoses: 1
                });
            expect(res.statusCode).toBe(400);
        });

        it('Should return 400 for a duplicate CVX code', async () => {
            const res = await request(server)
                .post(VAX_API)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Duplicate CVX',
                    genericName: 'Dup Generic',
                    manufacturer: 'Dup Mfr',
                    cvxCode: String(ts + 2).slice(-8), // already registered
                    presentation: 'vial',
                    volume: { value: 0.5, unit: 'mL' },
                    totalDoses: 1
                });
            expect(res.statusCode).toBe(400);
        });

        it('Should return 403 when Patient attempts to create a vaccine', async () => {
            const res = await request(server)
                .post(VAX_API)
                .set('Authorization', `Bearer ${patientToken}`)
                .send({
                    name: 'Patient Vaccine',
                    genericName: 'Patient Generic',
                    manufacturer: 'Patient Mfr',
                    cvxCode: '9999998',
                    presentation: 'vial',
                    volume: { value: 0.5, unit: 'mL' },
                    totalDoses: 1
                });
            expect(res.statusCode).toBe(403);
        });
    });

    // --- GET /vaccines/:id ---
    describe(`GET ${VAX_API}/:id`, () => {
        it('Should return 200 and the vaccine document for a valid ID', async () => {
            const res = await request(server)
                .get(`${VAX_API}/${testVaccineId}`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data._id).toBe(testVaccineId);
        });

        it('Should return 4xx or 5xx for an invalid ID format', async () => {
            const res = await request(server)
                .get(`${VAX_API}/notanid`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });

    // --- PUT /vaccines/:id (minor update, no versioning) ---
    describe(`PUT ${VAX_API}/:id`, () => {
        it('Should perform a minor update (description) without version bump', async () => {
            const res = await request(server)
                .put(`${VAX_API}/${testVaccineId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Updated via integration test' });
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // --- POST /doses/vaccine/:vaccineId ---
    describe(`POST ${DOSE_API}/vaccine/:vaccineId`, () => {
        it('Should create dose 1 for the test vaccine and return 201', async () => {
            const res = await request(server)
                .post(`${DOSE_API}/vaccine/${testVaccineId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ doseNumber: 1, minAge: { value: 2, unit: 'months' } });
            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            testDoseId = res.body.data._id;
        });

        it('Should return 400 when doseNumber is missing', async () => {
            const res = await request(server)
                .post(`${DOSE_API}/vaccine/${testVaccineId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ minAge: { value: 2, unit: 'months' } });
            expect(res.statusCode).toBe(400);
        });

        it('Should return 404 for a non-existent vaccine ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(server)
                .post(`${DOSE_API}/vaccine/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ doseNumber: 1, minAge: { value: 2, unit: 'months' } });
            expect(res.statusCode).toBe(404);
        });
    });

    // --- GET /doses/vaccine/:vaccineId ---
    describe(`GET ${DOSE_API}/vaccine/:vaccineId`, () => {
        it('Should return 200 and the doses array for the vaccine', async () => {
            const res = await request(server)
                .get(`${DOSE_API}/vaccine/${testVaccineId}`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    // --- GET /doses/:id ---
    describe(`GET ${DOSE_API}/:id`, () => {
        it('Should return 200 and the dose document by ID', async () => {
            expect(testDoseId).toBeDefined();
            const res = await request(server)
                .get(`${DOSE_API}/${testDoseId}`)
                .set('Authorization', `Bearer ${patientToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data._id).toBe(testDoseId);
        });
    });

    // --- PUT /doses/:id ---
    describe(`PUT ${DOSE_API}/:id`, () => {
        it('Should update dose name and return 200', async () => {
            const res = await request(server)
                .put(`${DOSE_API}/${testDoseId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ doseName: 'Primary Dose' });
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // --- DELETE /doses/:id ---
    describe(`DELETE ${DOSE_API}/:id`, () => {
        it('Should delete a dose and return 200', async () => {
            // Create a throwaway dose to delete
            const create = await request(server)
                .post(`${DOSE_API}/vaccine/${testVaccineId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ doseNumber: 2, minAge: { value: 4, unit: 'months' } });
            const delId = create.body.data._id;

            const res = await request(server)
                .delete(`${DOSE_API}/${delId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // --- DELETE /vaccines/:id (cascade deletes doses) ---
    describe(`DELETE ${VAX_API}/:id`, () => {
        it('Should delete a vaccine and its doses and return 200', async () => {
            // Create a throwaway vaccine to delete
            const create = await request(server)
                .post(VAX_API)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: `VaxEndDel_${ts}`,
                    genericName: 'Del Generic',
                    manufacturer: 'Del Mfr',
                    cvxCode: String(ts + 4).slice(-8),
                    presentation: 'vial',
                    volume: { value: 0.5, unit: 'mL' },
                    totalDoses: 1
                });
            const delId = create.body.data._id;

            const res = await request(server)
                .delete(`${VAX_API}/${delId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    // --- GET /vaccines/:id/history ---
    describe(`GET ${VAX_API}/:id/history`, () => {
        it('Should return version history for the vaccine', async () => {
            const res = await request(server)
                .get(`${VAX_API}/${testVaccineId}/history`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.history).toBeDefined();
            expect(Array.isArray(res.body.history)).toBe(true);
        });
    });
});
