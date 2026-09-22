const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../../server');
const User = require('../../Model/users/UserModel');

const API_PREFIX = '/api/V1/users';

describe('User Authentication & Security Testing', () => {
    let validUserId;
    let authToken;
    let validUserEmail = 'security@test.com';
    let validUserPassword = 'SecurePass123';

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test';
            await mongoose.connect(MONGO_URI);
        }
        await User.deleteMany({ email: /security|attacker|sql|xss|defaultrole|doctorauth|concurrent/ });

        const res = await request(server)
            .post(`${API_PREFIX}/register`)
            .send({
                name: 'Security Tester',
                email: validUserEmail,
                phone: '0770000000',
                password: validUserPassword,
                confirmPassword: validUserPassword,
                agreeToTerms: true,
                address: { city: 'Colombo', district: 'Western' }
            });

        validUserId = res.body.user.id;
        authToken = res.body.token;
    });

    afterAll(async () => {
        await User.deleteMany({ email: /security|attacker|sql|xss|defaultrole|doctorauth|concurrent/ });
        if (mongoose.connection.readyState) {
            await mongoose.connection.close();
        }
    });

    // --- TEST: Password Security ---
    describe('Password Security', () => {
        it('Should hash password and not store plain text', async () => {
            const user = await User.findById(validUserId);
            expect(user.password).not.toBe(validUserPassword);
            expect(user.password.length).toBeGreaterThan(validUserPassword.length);
        });

        it('Should not return password in login response', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/login`)
                .send({ email: validUserEmail, password: validUserPassword });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.password).toBeUndefined();
        });

        it('Should validate correct and reject incorrect passwords', async () => {
            const user = await User.findById(validUserId);
            expect(await user.comparePassword(validUserPassword)).toBe(true);
            expect(await user.comparePassword('WrongPassword123')).toBe(false);
        });
    });

    // --- TEST: Input Validation & Injection ---
    describe('Input Validation & Security', () => {
        it('Should handle SQL injection attempts safely', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: "'; DROP TABLE users; --",
                    email: 'sql@test.com', phone: '0771111111',
                    password: 'password123', confirmPassword: 'password123',
                    agreeToTerms: true, address: { city: 'Colombo', district: 'Western' }
                });

            expect(res.statusCode).toBe(201);
            const user = await User.findOne({ email: 'sql@test.com' });
            expect(user).toBeDefined();
        });

        it('Should handle null and undefined values gracefully', async () => {
            const nullRes = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({ name: null, email: 'null@test.com', phone: null,
                    password: 'password123', confirmPassword: 'password123', agreeToTerms: true });
            expect(nullRes.statusCode).toBe(400);

            const undefRes = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({ name: 'Test', email: 'undefined@test.com', phone: 'phone',
                    password: 'password123', confirmPassword: 'password123', agreeToTerms: undefined });
            expect(undefRes.statusCode).toBe(400);
        });

        it('Should enforce unique email (case-insensitive)', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Case Test', email: 'SECURITY@TEST.COM', phone: '0771111111',
                    password: 'password123', confirmPassword: 'password123',
                    agreeToTerms: true, address: { city: 'Colombo', district: 'Western' }
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('User already exists with this email');
        });
    });

    // --- TEST: Role Management ---
    describe('Role Management', () => {
        it('Should assign default Patient role when none specified', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Default Role User', email: `defaultrole${Date.now()}@test.com`, phone: '0771234567',
                    password: 'password123', confirmPassword: 'password123',
                    agreeToTerms: true, address: { city: 'Colombo', district: 'Western' }
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.user.role).toBe('Patient');
        });

        it('Should store doctor credentials and reject invalid roles', async () => {
            const doctorRes = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Doctor Auth', email: `doctorauth${Date.now()}@test.com`, phone: '0771234567',
                    password: 'password123', confirmPassword: 'password123',
                    agreeToTerms: true, role: 'Doctor',
                    address: { city: 'Colombo', district: 'Western' },
                    doctorCredentials: { licenseNumber: 'LIC123', clinicName: 'Clinic', specialization: 'Pediatrics' }
                });
            expect(doctorRes.statusCode).toBe(201);
            expect(doctorRes.body.user.doctorCredentials).toBeDefined();

            const invalidRes = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Invalid', email: `invalidrole${Date.now()}@test.com`, phone: '0771234567',
                    password: 'password123', confirmPassword: 'password123',
                    agreeToTerms: true, role: 'Superuser', address: { city: 'Colombo', district: 'Western' }
                });
            expect(invalidRes.statusCode).toBe(400);
            expect(invalidRes.body.message).toContain('Invalid role');
        });
    });

    // --- TEST: Data Persistence ---
    describe('Data Persistence & Consistency', () => {
        it('Should properly store and retrieve user data', async () => {
            const res = await request(server)
                .get(`${API_PREFIX}/${validUserId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user.email).toBe(validUserEmail);
            expect(res.body.user.name).toBe('Security Tester');
        });

        it('Should maintain data integrity during update', async () => {
            const originalUser = await User.findById(validUserId);
            const originalEmail = originalUser.email;

            const res = await request(server)
                .put(`${API_PREFIX}/${validUserId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Updated Name', phone: '0779999999' });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.email).toBe(originalEmail);
            expect(res.body.user.name).toBe('Updated Name');
        });
    });

    // --- TEST: Response Structure ---
    describe('Response Structure', () => {
        it('Should return consistent response structure for login', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/login`)
                .send({ email: validUserEmail, password: validUserPassword });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success');
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('id');
            expect(res.body.user).toHaveProperty('name');
            expect(res.body.user).toHaveProperty('email');
            expect(res.body.user).toHaveProperty('role');
        });

        it('Should not leak sensitive information in error responses', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/login`)
                .send({ email: validUserEmail, password: 'wrongpassword' });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Invalid email or password');
            expect(res.body.message).not.toContain('missing');
        });

        it('Should handle concurrent registration attempts gracefully', async () => {
            const userData = {
                name: 'Concurrent User', email: 'attacker@test.com', phone: '0771111111',
                password: 'password123', confirmPassword: 'password123',
                agreeToTerms: true, address: { city: 'Colombo', district: 'Western' }
            };

            const [res1, res2] = await Promise.all([
                request(server).post(`${API_PREFIX}/register`).send(userData),
                request(server).post(`${API_PREFIX}/register`).send(userData)
            ]);

            const results = [res1.statusCode, res2.statusCode];
            expect(results.includes(201)).toBe(true);
            expect(results.includes(400)).toBe(true);
        });
    });
});


