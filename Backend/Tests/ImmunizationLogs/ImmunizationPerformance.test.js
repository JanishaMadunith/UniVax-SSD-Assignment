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
// PERFORMANCE TESTS — Immunization Log API
// Evaluates throughput, concurrency, and response latency
// ============================================================
describe('Immunization Log — Performance Testing', () => {
    let adminToken;
    let patientUserId;
    let testVaccineId;
    let testLogId;
    const ts = Date.now();

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test');
        }
        await User.deleteMany({ email: /^perflog/ });
        await VaccineProduct.deleteMany({ name: /^PerfLogVaccine_/ });

        // Register Admin
        const a = await request(server).post(`${USER_API}/register`).send({
            name: `PerfLogAdmin_${ts}`, email: 'perflogadmin@test.com',
            phone: '0770066666', password: 'password123',
            confirmPassword: 'password123', agreeToTerms: true, role: 'Admin',
            address: { city: 'Colombo', district: 'Western' }
        });
        adminToken = a.body.token;

        // Register Patient
        const p = await request(server).post(`${USER_API}/register`).send({
            name: `PerfLogPatient_${ts}`, email: 'perflogpatient@test.com',
            phone: '0770077777', password: 'password123',
            confirmPassword: 'password123', agreeToTerms: true,
            address: { city: 'Colombo', district: 'Western' }
        });
        patientUserId = p.body.user.id;

        // Create vaccine
        const v = await request(server)
            .post(VAX_API)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: `PerfLogVaccine_${ts}`,
                genericName: 'Perf Generic',
                manufacturer: 'Perf Mfr',
                cvxCode: String(ts + 1).slice(-8),
                presentation: 'vial',
                volume: { value: 1.0, unit: 'mL' },
                totalDoses: 2
            });
        testVaccineId = v.body.data._id;

        // Create an initial log for read/update tests
        const l = await request(server)
            .post(LOG_API)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                userId: patientUserId,
                vaccineId: testVaccineId,
                dateAdministered: new Date().toISOString(),
                doseNumber: 1,
                clinic: 'Perf Clinic',
                brand: 'PerfBrand',
                batchNumber: 'PERFBASE001'
            });
        testLogId = l.body._id;
    }, 60000);

    afterAll(async () => {
        await ImmunizationLog.deleteMany({ brand: 'PerfBrand' });
        await VaccineProduct.deleteMany({ name: /^PerfLogVaccine_/ });
        await User.deleteMany({ email: /^perflog/ });
    });

    const makeLog = (idx = 0) => ({
        userId: patientUserId,
        vaccineId: testVaccineId,
        dateAdministered: new Date().toISOString(),
        doseNumber: 1,
        clinic: 'Perf Clinic',
        brand: 'PerfBrand',
        batchNumber: `PERF_CONC_${idx}_${Date.now()}`
    });

    it('Should handle 5 concurrent log creation requests within 8s', async () => {
        const reqs = Array.from({ length: 5 }, (_, i) =>
            request(server).post(LOG_API)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(makeLog(i))
        );
        const start = Date.now();
        const results = await Promise.all(reqs);
        expect(Date.now() - start).toBeLessThan(8000);
        results.forEach(r => expect(r.statusCode).toBe(201));
    });

    it('Response time for GET all logs should be under 3000ms', async () => {
        const start = Date.now();
        const res = await request(server)
            .get(LOG_API)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(Date.now() - start).toBeLessThan(3000);
        expect(res.statusCode).toBe(200);
    });

    it('Response time for POST a single log should be under 3000ms', async () => {
        const start = Date.now();
        const res = await request(server)
            .post(LOG_API)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(makeLog(99));
        expect(Date.now() - start).toBeLessThan(3000);
        expect(res.statusCode).toBe(201);
    });

    it('Should handle 10 concurrent GET /logs requests within 5s', async () => {
        const reqs = Array.from({ length: 10 }, () =>
            request(server).get(LOG_API).set('Authorization', `Bearer ${adminToken}`)
        );
        const start = Date.now();
        const results = await Promise.all(reqs);
        expect(Date.now() - start).toBeLessThan(5000);
        results.forEach(r => expect(r.statusCode).toBe(200));
    });

    it('Should handle 5 concurrent GET /logs/:id requests', async () => {
        const reqs = Array.from({ length: 5 }, () =>
            request(server).get(`${LOG_API}/${testLogId}`)
                .set('Authorization', `Bearer ${adminToken}`)
        );
        const results = await Promise.all(reqs);
        results.forEach(r => {
            expect(r.statusCode).toBe(200);
            expect(r.body._id).toBe(testLogId);
        });
    });

    it('Response time for GET log by ID should be under 2000ms', async () => {
        const start = Date.now();
        const res = await request(server)
            .get(`${LOG_API}/${testLogId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(Date.now() - start).toBeLessThan(2000);
        expect(res.statusCode).toBe(200);
    });

    it('Should handle 5 concurrent PUT update requests on same log', async () => {
        const reqs = Array.from({ length: 5 }, (_, i) =>
            request(server).put(`${LOG_API}/${testLogId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ notes: `Concurrent update ${i}` })
        );
        const results = await Promise.all(reqs);
        results.forEach(r => expect(r.statusCode).toBe(200));
    });

    it('Should handle 5 rapid sequential log creates', async () => {
        const results = [];
        for (let i = 0; i < 5; i++) {
            const res = await request(server)
                .post(LOG_API)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(makeLog(200 + i));
            results.push(res);
        }
        results.forEach(r => expect(r.statusCode).toBe(201));
    });
});
