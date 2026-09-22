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
// PERFORMANCE TESTS — Vaccine Catalog API
// Evaluates throughput, concurrency, and response latency
// ============================================================
describe('Vaccine Catalog — Performance Testing', () => {
    let adminToken;
    let testVaccineId;
    const ts = Date.now();

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test');
        }
        await User.deleteMany({ email: /^vaxperf/ });
        await VaccineProduct.deleteMany({ name: /^VaxPerfVaccine_/ });

        // Register Admin
        const a = await request(server).post(`${USER_API}/register`).send({
            name: `VaxPerfAdmin_${ts}`, email: 'vaxperfadmin@test.com',
            phone: '0770111111', password: 'password123',
            confirmPassword: 'password123', agreeToTerms: true, role: 'Admin',
            address: { city: 'Colombo', district: 'Western' }
        });
        adminToken = a.body.token;

        // Create a main test vaccine for GET/update tests
        const v = await request(server)
            .post(VAX_API)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: `VaxPerfVaccine_${ts}`,
                genericName: 'Perf Generic',
                manufacturer: 'Perf Mfr',
                cvxCode: String(ts + 5).slice(-8),
                presentation: 'vial',
                volume: { value: 0.5, unit: 'mL' },
                totalDoses: 3
            });
        testVaccineId = v.body.data._id;
    }, 60000);

    afterAll(async () => {
        await DoseRequirement.deleteMany({ vaccineId: testVaccineId });
        await VaccineProduct.deleteMany({ name: /^VaxPerfVaccine_/ });
        await User.deleteMany({ email: /^vaxperf/ });
    });

    it('Should handle 10 concurrent GET /vaccines requests within 5s', async () => {
        const reqs = Array.from({ length: 10 }, () =>
            request(server).get(VAX_API).set('Authorization', `Bearer ${adminToken}`)
        );
        const start = Date.now();
        const results = await Promise.all(reqs);
        expect(Date.now() - start).toBeLessThan(5000);
        results.forEach(r => expect([200, 404]).toContain(r.statusCode));
    });

    it('Response time for GET all vaccines should be under 3000ms', async () => {
        const start = Date.now();
        const res = await request(server)
            .get(VAX_API)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(Date.now() - start).toBeLessThan(3000);
        expect([200, 404]).toContain(res.statusCode);
    });

    it('Should create 5 vaccines concurrently within 10s', async () => {
        const reqs = Array.from({ length: 5 }, (_, i) =>
            request(server).post(VAX_API)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: `VaxPerfVaccine_${ts}_${i}`,
                    genericName: `Perf Generic ${i}`,
                    manufacturer: 'Perf Mfr',
                    cvxCode: String(ts + 10 + i).slice(-8),
                    presentation: 'vial',
                    volume: { value: 0.5, unit: 'mL' },
                    totalDoses: 2
                })
        );
        const start = Date.now();
        const results = await Promise.all(reqs);
        expect(Date.now() - start).toBeLessThan(10000);
        results.forEach(r => expect(r.statusCode).toBe(201));
    });

    it('POST vaccine response time should be under 3000ms', async () => {
        const start = Date.now();
        const res = await request(server)
            .post(VAX_API)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: `VaxPerfVaccine_TIME_${ts}`,
                genericName: 'Time Generic',
                manufacturer: 'Time Mfr',
                cvxCode: String(ts + 20).slice(-8),
                presentation: 'oral',
                volume: { value: 5.0, unit: 'mL' },
                totalDoses: 1
            });
        expect(Date.now() - start).toBeLessThan(3000);
        expect(res.statusCode).toBe(201);
    });

    it('Should handle 10 rapid sequential GET /vaccines/:id requests within 5s', async () => {
        const start = Date.now();
        for (let i = 0; i < 10; i++) {
            const res = await request(server)
                .get(`${VAX_API}/${testVaccineId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
        }
        expect(Date.now() - start).toBeLessThan(5000);
    });

    it('GET vaccine by ID response time should be under 2000ms', async () => {
        const start = Date.now();
        const res = await request(server)
            .get(`${VAX_API}/${testVaccineId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(Date.now() - start).toBeLessThan(2000);
        expect(res.statusCode).toBe(200);
    });

    it('Should create 5 doses concurrently for a dedicated vaccine', async () => {
        // Create a vaccine specifically for dose concurrency test
        const vRes = await request(server)
            .post(VAX_API)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: `VaxPerfVaccine_DOSES_${ts}`,
                genericName: 'Dose Perf',
                manufacturer: 'Dose Mfr',
                cvxCode: String(ts + 30).slice(-8),
                presentation: 'vial',
                volume: { value: 0.5, unit: 'mL' },
                totalDoses: 5
            });
        const doseVaccineId = vRes.body.data._id;

        // Each dose has a unique doseNumber so no collision
        const reqs = Array.from({ length: 5 }, (_, i) =>
            request(server).post(`${DOSE_API}/vaccine/${doseVaccineId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ doseNumber: i + 1, minAge: { value: i * 2 + 2, unit: 'months' } })
        );
        const results = await Promise.all(reqs);
        results.forEach(r => expect(r.statusCode).toBe(201));
    });

    it('Should handle 5 concurrent PUT updates on the same vaccine', async () => {
        const reqs = Array.from({ length: 5 }, (_, i) =>
            request(server).put(`${VAX_API}/${testVaccineId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: `Concurrent update ${i}` })
        );
        const results = await Promise.all(reqs);
        results.forEach(r => expect(r.statusCode).toBe(200));
    });

    it('Should handle concurrent GET with different query filters', async () => {
        const filters = ['?status=active', '?status=discontinued', '?manufacturer=Perf+Mfr', '', '?status=pending'];
        const reqs = filters.map(q =>
            request(server).get(`${VAX_API}${q}`).set('Authorization', `Bearer ${adminToken}`)
        );
        const results = await Promise.all(reqs);
        results.forEach(r => expect([200, 404]).toContain(r.statusCode));
    });

    it('GET filtered vaccines response time should be under 3000ms', async () => {
        const start = Date.now();
        const res = await request(server)
            .get(`${VAX_API}?status=active`)
            .set('Authorization', `Bearer ${adminToken}`);
        expect(Date.now() - start).toBeLessThan(3000);
        expect([200, 404]).toContain(res.statusCode);
    });
});
