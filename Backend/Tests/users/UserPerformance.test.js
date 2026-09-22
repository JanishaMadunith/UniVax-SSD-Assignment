const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../../server');
const User = require('../../Model/users/UserModel');

const API_PREFIX = '/api/V1/users';

describe('User Endpoints - Performance & Load Testing', () => {
    let adminToken;
    let testUserId;
    let testUserEmail = 'rapid@test.com';

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test';
            await mongoose.connect(MONGO_URI);
        }
        await User.deleteMany({ $or: [
            { email: /perf|bulk|rapid|concurrent|timestamp/ },
            { name: /Perf|Bulk|Rapid|Concurrent|Timestamp/ }
        ]});

        const adminRes = await request(server)
            .post(`${API_PREFIX}/register`)
            .send({
                name: 'Perf Admin User',
                email: 'perfadmin@test.com',
                phone: '0770000002',
                password: 'password123',
                confirmPassword: 'password123',
                agreeToTerms: true,
                role: 'Admin',
                address: { city: 'Colombo', district: 'Western' }
            });
        adminToken = adminRes.body.token;

        const userRes = await request(server)
            .post(`${API_PREFIX}/register`)
            .send({
                name: 'Rapid Test User',
                email: testUserEmail,
                phone: '0770002222',
                password: 'password123',
                confirmPassword: 'password123',
                agreeToTerms: true,
                address: { city: 'Colombo', district: 'Western' }
            });
        testUserId = userRes.body.user.id;
    });

    afterAll(async () => {
        await User.deleteMany({ $or: [
            { email: /perf|bulk|rapid|concurrent|timestamp/ },
            { name: /Perf|Bulk|Rapid|Concurrent|Timestamp/ }
        ]});
        if (mongoose.connection.readyState) {
            await mongoose.connection.close();
        }
    });

    // --- TEST: Bulk Operations ---
    describe('Bulk Operations', () => {
        it('Should handle multiple rapid registrations', async () => {
            const registrations = [];
            const roles = ['Patient', 'Doctor', 'Admin'];

            for (let i = 0; i < 3; i++) {
                registrations.push(
                    request(server)
                        .post(`${API_PREFIX}/register`)
                        .send({
                            name: `Bulk User ${i}`,
                            email: `bulkuser${i}@test.com`,
                            phone: `077${String(i).padStart(7, '0')}`,
                            password: 'password123',
                            confirmPassword: 'password123',
                            agreeToTerms: true,
                            role: roles[i],
                            address: { city: 'Colombo', district: 'Western' }
                        })
                );
            }

            const results = await Promise.all(registrations);
            results.forEach((res, index) => {
                expect(res.statusCode).toBe(201);
                expect(res.body.user.role).toBe(roles[index]);
            });
        });

        it('Should retrieve all users efficiently', async () => {
            const start = Date.now();
            const res = await request(server).get(`${API_PREFIX}/`).set('Authorization', `Bearer ${adminToken}`);
            const duration = Date.now() - start;

            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body.users)).toBe(true);
            expect(duration).toBeLessThan(5000);
        });
    });

    // --- TEST: Rapid Sequential Operations ---
    describe('Rapid Sequential Operations', () => {
        it('Should handle rapid sequential logins', async () => {
            const logins = [];
            for (let i = 0; i < 5; i++) {
                logins.push(
                    request(server)
                        .post(`${API_PREFIX}/login`)
                        .send({ email: testUserEmail, password: 'password123' })
                );
            }

            const results = await Promise.all(logins);
            results.forEach(res => {
                expect(res.statusCode).toBe(200);
                expect(res.body.success).toBe(true);
            });
        });

        it('Should handle rapid concurrent updates', async () => {
            const updates = [];
            for (let i = 0; i < 5; i++) {
                updates.push(
                    request(server)
                        .put(`${API_PREFIX}/${testUserId}`)
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send({ name: `Updated Name ${i}` })
                );
            }

            const results = await Promise.all(updates);
            results.forEach(res => {
                expect(res.statusCode).toBe(200);
                expect(res.body.success).toBe(true);
            });

            const finalUser = await User.findById(testUserId);
            expect(finalUser.name).toMatch(/^Updated Name [0-4]$/);
        });

        it('Should handle rapid sequential reads', async () => {
            const reads = [];
            for (let i = 0; i < 10; i++) {
                reads.push(
                    request(server).get(`${API_PREFIX}/${testUserId}`).set('Authorization', `Bearer ${adminToken}`)
                );
            }

            const results = await Promise.all(reads);
            results.forEach(res => {
                expect(res.statusCode).toBe(200);
                expect(res.body.user._id).toBe(testUserId);
            });
        });
    });

    // --- TEST: Boundary & Response Time ---
    describe('Boundary Conditions & Response Time', () => {
        it('Should return 404 for non-existent user and 400 for invalid ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res404 = await request(server).get(`${API_PREFIX}/${fakeId}`).set('Authorization', `Bearer ${adminToken}`);
            expect(res404.statusCode).toBe(404);

            const res400 = await request(server).get(`${API_PREFIX}/123invalid`).set('Authorization', `Bearer ${adminToken}`);
            expect(res400.statusCode).toBe(400);
        });

        it('Login should respond within acceptable time', async () => {
            const start = Date.now();
            await request(server)
                .post(`${API_PREFIX}/login`)
                .send({ email: testUserEmail, password: 'password123' });
            expect(Date.now() - start).toBeLessThan(1000);
        });

        it('Should create and update timestamps correctly', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Timestamp User',
                    email: `timestamp${Date.now()}@test.com`,
                    phone: '0770006666',
                    password: 'password123',
                    confirmPassword: 'password123',
                    agreeToTerms: true,
                    address: { city: 'Colombo', district: 'Western' }
                });

            expect(res.statusCode).toBe(201);
            const user = await User.findById(res.body.user.id);
            expect(user.createdAt).toBeDefined();
            expect(user.updatedAt).toBeDefined();
        });
    });
});


