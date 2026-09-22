const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../../server');
const Appointment = require('../../Model/Appointment/AppointmentModel');
const Clinic = require('../../Model/Appointment/ClinicModel');

const APPT_API = '/api/V1/appointments';
const CLINIC_API = '/api/V1/clinics';

// ============================================================
// PERFORMANCE TESTS — Appointment API
// Evaluates throughput, concurrency, and response latency
// ============================================================
describe('Appointment — Performance Testing', () => {
    let testClinicId;
    const ts = Date.now();

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test');
        }
        await Clinic.deleteMany({ clinicName: /^ApptPerf/ });
        await Appointment.deleteMany({ email: /^apptperf/ });

        // Create test clinic
        const clinic = await Clinic.create({
            clinicName: `ApptPerfClinic_${ts}`,
            address: 'Perf Address',
            city: 'Perf City',
            district: 'Perf District',
            phone: '0770555555',
            email: 'apptperfclinic@test.com',
            clinicType: 'Public',
            openDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            openTime: '09:00',
            closeTime: '17:00'
        });
        testClinicId = clinic._id;
    }, 60000);

    afterAll(async () => {
        await Appointment.deleteMany({ email: /^apptperf/ });
        await Clinic.deleteMany({ clinicName: /^ApptPerf/ });
        if (mongoose.connection.readyState) {
            await mongoose.connection.close();
        }
    });

    // ============================================================
    // TEST SUITE 1: Concurrent Appointment Creation
    // ============================================================
    describe('Concurrent Appointment Creation', () => {
        it('Should create 5 appointments concurrently within 8s', async () => {
            const reqs = Array.from({ length: 5 }, (_, i) =>
                request(server)
                    .post(APPT_API + '/create')
                    .send({
                        clinicId: testClinicId.toString(),
                        fullName: `Patient Concurrent ${i}`,
                        email: `concurrent${i}@test.com`,
                        phone: `0770888${String(i).padStart(3, '0')}`,
                        vaccineType: 'COVID-19',
                        ageGroup: 'Adult (18-60)',
                        appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        appointmentTime: `${9 + i}:00`
                    })
            );
            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(8000);
            results.forEach(r => expect([200, 201, 401]).toContain(r.statusCode));
        });

        it('Should create 10 appointments sequentially within 15s', async () => {
            const start = Date.now();
            for (let i = 0; i < 10; i++) {
                const res = await request(server)
                    .post(APPT_API + '/create')
                    .send({
                        clinicId: testClinicId.toString(),
                        fullName: `Patient Sequential ${i}`,
                        email: `sequential${i}@test.com`,
                        phone: `0770999${String(i).padStart(3, '0')}`,
                        vaccineType: 'COVID-19',
                        ageGroup: 'Adult (18-60)',
                        appointmentDate: new Date(Date.now() + (86400000 * (i + 2))).toISOString().split('T')[0],
                        appointmentTime: `${9 + (i % 8)}:00`
                    });
                expect([200, 201, 401]).toContain(res.statusCode);
            }
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(15000);
        });

        it('POST appointment response time should be under 2500ms', async () => {
            const start = Date.now();
            const res = await request(server)
                .post(APPT_API + '/create')
                .send({
                    clinicId: testClinicId.toString(),
                    fullName: `Patient ResponseTime`,
                    email: `responsetime@test.com`,
                    phone: '0770777777',
                    vaccineType: 'COVID-19',
                    ageGroup: 'Adult (18-60)',
                    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    appointmentTime: '14:00'
                });
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(2500);
            expect([200, 201, 401]).toContain(res.statusCode);
        });
    });

    // ============================================================
    // TEST SUITE 2: Appointment Retrieval Performance
    // ============================================================
    describe('Appointment Retrieval Performance', () => {
        it('Should handle 10 concurrent GET all appointments requests within 5s', async () => {
            const reqs = Array.from({ length: 10 }, () =>
                request(server)
                    .get(APPT_API)
            );
            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(5000);
            results.forEach(r => expect([200, 401, 404]).toContain(r.statusCode));
        });

        it('GET all appointments response time should be under 2000ms', async () => {
            const start = Date.now();
            const res = await request(server)
                .get(APPT_API);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(2000);
            expect([200, 401, 404]).toContain(res.statusCode);
        });

        it('Should retrieve appointments by email efficiently', async () => {
            const start = Date.now();
            const res = await request(server)
                .get(`${APPT_API}/email/concurrent1@test.com`);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(2500);
            expect([200, 401, 404]).toContain(res.statusCode);
        });

        it('Should handle concurrent appointment retrieval within 5s', async () => {
            const reqs = Array.from({ length: 8 }, () =>
                request(server)
                    .get(APPT_API)
            );
            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(5000);
        });
    });

    // ============================================================
    // TEST SUITE 3: Appointment Query Performance
    // ============================================================
    describe('Appointment Query Performance', () => {
        it('Should handle multiple query filters efficiently', async () => {
            const filters = ['', '?status=confirmed', '?status=pending'];
            const reqs = filters.map(filter =>
                request(server)
                    .get(`${APPT_API}${filter}`)
            );
            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(5000);
            results.forEach(r => expect([200, 401, 404]).toContain(r.statusCode));
        });

        it('GET filtered appointments response time should be under 2500ms', async () => {
            const start = Date.now();
            const res = await request(server)
                .get(`${APPT_API}?status=confirmed`);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(2500);
            expect([200, 401, 404]).toContain(res.statusCode);
        });

        it('Should handle 5 concurrent filtered queries within 7s', async () => {
            const reqs = Array.from({ length: 5 }, () =>
                request(server)
                    .get(`${APPT_API}?status=pending`)
            );
            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(7000);
            results.forEach(r => expect([200, 401, 404]).toContain(r.statusCode));
        });
    });

    // ============================================================
    // TEST SUITE 4: Single Appointment Retrieval Performance
    // ============================================================
    describe('Single Appointment Retrieval Performance', () => {
        let appointmentId = null;

        beforeAll(async () => {
            // Create a test appointment for retrieval tests
            const createRes = await request(server)
                .post(APPT_API + '/create')
                .send({
                    clinicId: testClinicId.toString(),
                    fullName: `Patient GetById`,
                    email: `getbyid@test.com`,
                    phone: '0770666111',
                    vaccineType: 'COVID-19',
                    ageGroup: 'Adult (18-60)',
                    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    appointmentTime: '15:00'
                });
            if (createRes.body.appointment) {
                appointmentId = createRes.body.appointment._id;
            }
        });

        it('GET single appointment response time should be under 1500ms', async () => {
            if (!appointmentId) return;
            const start = Date.now();
            const res = await request(server)
                .get(`${APPT_API}/${appointmentId}`);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(1500);
            expect([200, 401, 404]).toContain(res.statusCode);
        });

        it('Should handle 5 concurrent single appointment retrieval within 6s', async () => {
            if (!appointmentId) return;
            const reqs = Array.from({ length: 5 }, () =>
                request(server)
                    .get(`${APPT_API}/${appointmentId}`)
            );
            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(6000);
            results.forEach(r => expect([200, 401, 404]).toContain(r.statusCode));
        });
    });

    // ============================================================
    // TEST SUITE 5: Clinic Performance
    // ============================================================
    describe('Clinic Operations Performance', () => {
        it('Should handle 8 concurrent GET clinic requests within 4s', async () => {
            const reqs = Array.from({ length: 8 }, () =>
                request(server)
                    .get(CLINIC_API)
            );
            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(4000);
            results.forEach(r => expect([200, 401, 404]).toContain(r.statusCode));
        });

        it('GET clinics response time should be under 2000ms', async () => {
            const start = Date.now();
            const res = await request(server)
                .get(CLINIC_API);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(2000);
            expect([200, 401, 404]).toContain(res.statusCode);
        });

        it('Should handle concurrent clinic details retrieval within 5s', async () => {
            const reqs = Array.from({ length: 3 }, () =>
                request(server)
                    .get(`${CLINIC_API}/${testClinicId}`)
            );
            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(5000);
            results.forEach(r => expect([200, 401, 404]).toContain(r.statusCode));
        });

        it('Should handle multiple clinic queries within 6s', async () => {
            const reqs = Array.from({ length: 5 }, () =>
                request(server)
                    .get(`${CLINIC_API}?city=Perf+City`)
            );
            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;
            expect(duration).toBeLessThan(6000);
            results.forEach(r => expect([200, 401, 404]).toContain(r.statusCode));
        });
    });

    // ============================================================
    // TEST SUITE 6: Mixed Operation Load Testing
    // ============================================================
    describe('Mixed Operations Load Testing', () => {
        it('Should handle mixed CRUD operations concurrently within 12s', async () => {
            const operations = [
                // Create 2 appointments
                request(server)
                    .post(APPT_API + '/create')
                    .send({
                        clinicId: testClinicId.toString(),
                        fullName: `Patient Mixed 1`,
                        email: `mixed1@test.com`,
                        phone: '0770777222',
                        vaccineType: 'COVID-19',
                        ageGroup: 'Adult (18-60)',
                        appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        appointmentTime: '09:30'
                    }),
                request(server)
                    .post(APPT_API + '/create')
                    .send({
                        clinicId: testClinicId.toString(),
                        fullName: `Patient Mixed 2`,
                        email: `mixed2@test.com`,
                        phone: '0770777333',
                        vaccineType: 'COVID-19',
                        ageGroup: 'Adult (18-60)',
                        appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        appointmentTime: '10:30'
                    }),
                // Get appointments (3 concurrent reads)
                request(server)
                    .get(APPT_API),
                request(server)
                    .get(APPT_API),
                request(server)
                    .get(CLINIC_API)
            ];

            const start = Date.now();
            const results = await Promise.all(operations);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(12000);
            results.forEach(r => expect([200, 201, 401, 404]).toContain(r.statusCode));
        });

        it('Should maintain under 3s average response time during mixed load', async () => {
            const durations = [];
            const iterations = 5;

            for (let i = 0; i < iterations; i++) {
                const start = Date.now();
                await request(server)
                    .post(APPT_API + '/create')
                    .send({
                        clinicId: testClinicId.toString(),
                        fullName: `Patient Average ${i}`,
                        email: `average${i}@test.com`,
                        phone: `0770888${String(i + 300).padStart(3, '0')}`,
                        vaccineType: 'COVID-19',
                        ageGroup: 'Adult (18-60)',
                        appointmentDate: new Date(Date.now() + (86400000 * (i + 1))).toISOString().split('T')[0],
                        appointmentTime: `${9 + i}:00`
                    });
                durations.push(Date.now() - start);
            }

            const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;
            expect(avgDuration).toBeLessThan(3000);
        });

        it('Should handle surge load of 15 concurrent operations within 15s', async () => {
            const operations = [
                ...Array.from({ length: 7 }, (_, i) =>
                    request(server)
                        .post(APPT_API + '/create')
                        .send({
                            clinicId: testClinicId.toString(),
                            fullName: `Patient Surge ${i}`,
                            email: `surge${i}@test.com`,
                            phone: `0770999${String(i + 400).padStart(3, '0')}`,
                            vaccineType: 'COVID-19',
                            ageGroup: 'Adult (18-60)',
                            appointmentDate: new Date(Date.now() + (86400000 * 5)).toISOString().split('T')[0],
                            appointmentTime: `${9 + i}:00`
                        })
                ),
                ...Array.from({ length: 4 }, () =>
                    request(server)
                        .get(APPT_API)
                ),
                ...Array.from({ length: 4 }, () =>
                    request(server)
                        .get(CLINIC_API)
                )
            ];

            const start = Date.now();
            const results = await Promise.all(operations);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(15000);
            results.forEach(r => expect([200, 201, 401, 404]).toContain(r.statusCode));
        });
    });

    // ============================================================
    // TEST SUITE 7: Error Handling Under Load
    // ============================================================
    describe('Error Handling Under Load', () => {
        it('Should handle invalid clinic IDs gracefully under concurrent load', async () => {
            const reqs = Array.from({ length: 6 }, (_, i) =>
                request(server)
                    .post(APPT_API + '/create')
                    .send({
                        clinicId: 'invalid_id_' + i,
                        fullName: `Patient Invalid ${i}`,
                        email: `invalid${i}@test.com`,
                        phone: `0770111${String(i).padStart(3, '0')}`,
                        vaccineType: 'COVID-19',
                        ageGroup: 'Adult (18-60)',
                        appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        appointmentTime: '09:00'
                    })
            );

            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(5000);
            results.forEach(r => expect([400, 401, 404, 422, 500]).toContain(r.statusCode));
        });

        it('Should handle missing required fields efficiently', async () => {
            const reqs = Array.from({ length: 5 }, () =>
                request(server)
                    .post(APPT_API + '/create')
                    .send({
                        clinicId: testClinicId.toString()
                        // Missing all other required fields
                    })
            );

            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(3000);
            results.forEach(r => expect([400, 401, 422]).toContain(r.statusCode));
        });

        it('Should handle invalid appointment dates efficiently', async () => {
            const reqs = Array.from({ length: 4 }, (_, i) =>
                request(server)
                    .post(APPT_API + '/create')
                    .send({
                        clinicId: testClinicId.toString(),
                        fullName: `Patient Invalid Date ${i}`,
                        email: `invaliddate${i}@test.com`,
                        phone: `0770222${String(i).padStart(3, '0')}`,
                        vaccineType: 'COVID-19',
                        ageGroup: 'Adult (18-60)',
                        appointmentDate: '2020-01-01', // Past date
                        appointmentTime: '09:00'
                    })
            );

            const start = Date.now();
            const results = await Promise.all(reqs);
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(4000);
            results.forEach(r => expect([400, 401, 422, 500]).toContain(r.statusCode));
        });
    });
});
