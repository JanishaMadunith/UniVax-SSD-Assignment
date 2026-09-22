const request = require('supertest');
const mongoose = require('mongoose');
const server = require('../../server');
const User = require('../../Model/users/UserModel');

const API_PREFIX = '/api/V1/users';

describe('User Endpoints Integration Testing', () => {
    let userId;
    let adminToken;

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test';
            await mongoose.connect(MONGO_URI);
        }
        await User.deleteMany({ $or: [
            { email: /test\.com|@test\./ },
            { name: /John Doe|Jane|Admin User|Dr\. Smith|Test Admin|Another User|Password Test|Temp User|Updated|Health Official/ }
        ]});

        const adminRes = await request(server)
            .post(`${API_PREFIX}/register`)
            .send({
                name: 'Test Admin User',
                email: 'testadmin@test.com',
                phone: '0770000001',
                password: 'password123',
                confirmPassword: 'password123',
                agreeToTerms: true,
                role: 'Admin',
                address: { city: 'Colombo', district: 'Western' }
            });
        adminToken = adminRes.body.token;
    });

    afterAll(async () => {
        await User.deleteMany({ $or: [
            { email: /test\.com|@test\./ },
            { name: /John Doe|Jane|Admin User|Dr\. Smith|Test Admin|Another User|Password Test|Temp User|Updated|Health Official/ }
        ]});
        if (mongoose.connection.readyState) {
            await mongoose.connection.close();
        }
    });

    // --- TEST: User Registration ---
    describe(`POST ${API_PREFIX}/register`, () => {
        it('Should successfully register a new user with valid data', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'John Doe',
                    email: 'test@test.com',
                    phone: '0771234567',
                    password: 'password123',
                    confirmPassword: 'password123',
                    agreeToTerms: true,
                    address: { city: 'Colombo', district: 'Western' }
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('User registered successfully');
            expect(res.body.token).toBeDefined();
            expect(res.body.user.name).toBe('John Doe');
            expect(res.body.user.email).toBe('test@test.com');
            expect(res.body.user.role).toBe('Patient');
            expect(res.body.user.accountStatus).toBe('Active');
            userId = res.body.user.id;
        });

        it('Should fail if required fields are missing', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({ name: 'Jane Doe', email: 'jane@test.com', agreeToTerms: true });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('All fields are required');
        });

        it('Should fail if passwords do not match', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Jane Doe', email: 'jane@test.com', phone: '0771234567',
                    password: 'password123', confirmPassword: 'password456',
                    agreeToTerms: true, address: { city: 'Colombo', district: 'Western' }
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Passwords do not match');
        });

        it('Should fail if user already exists with same email', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Another User', email: 'test@test.com', phone: '0779876543',
                    password: 'password123', confirmPassword: 'password123',
                    agreeToTerms: true, address: { city: 'Colombo', district: 'Western' }
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('User already exists with this email');
        });

        it('Should reject invalid role', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Invalid Role User', email: `invalid${Date.now()}@test.com`, phone: '0771234567',
                    password: 'password123', confirmPassword: 'password123',
                    agreeToTerms: true, role: 'InvalidRole', address: { city: 'Colombo', district: 'Western' }
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toContain('Invalid role');
        });

        it('Should register Doctor with credentials', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Dr. Smith', email: `doctor${Date.now()}@test.com`, phone: '0771234567',
                    password: 'password123', confirmPassword: 'password123',
                    agreeToTerms: true, role: 'Doctor',
                    address: { city: 'Colombo', district: 'Western' },
                    doctorCredentials: { licenseNumber: 'DOC001', clinicName: 'Main Hospital', specialization: 'Cardiology' }
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.user.role).toBe('Doctor');
            expect(res.body.user.doctorCredentials).toBeDefined();
        });
    });

    // --- TEST: User Login ---
    describe(`POST ${API_PREFIX}/login`, () => {
        it('Should successfully login with valid credentials', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/login`)
                .send({ email: 'test@test.com', password: 'password123' });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.email).toBe('test@test.com');
        });

        it('Should fail if email or password is missing', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/login`)
                .send({ password: 'password123' });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Email and password are required');
        });

        it('Should fail with wrong credentials', async () => {
            const res = await request(server)
                .post(`${API_PREFIX}/login`)
                .send({ email: 'test@test.com', password: 'wrongpassword' });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Invalid email or password');
        });
    });

    // --- TEST: Get Users ---
    describe(`GET ${API_PREFIX}/`, () => {
        it('Should fetch all users without password field', async () => {
            const res = await request(server).get(`${API_PREFIX}/`).set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.users)).toBe(true);
            expect(res.body.count).toBeGreaterThan(0);
            res.body.users.forEach(user => {
                expect(user.password).toBeUndefined();
                expect(user.role).toBeDefined();
            });
        });
    });

    // --- TEST: Get User by ID ---
    describe(`GET ${API_PREFIX}/:id`, () => {
        it('Should fetch user by valid ID', async () => {
            const res = await request(server).get(`${API_PREFIX}/${userId}`).set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user._id).toBe(userId);
            expect(res.body.user.password).toBeUndefined();
        });

        it('Should return 404 for non-existent user and 400 for invalid ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res404 = await request(server).get(`${API_PREFIX}/${fakeId}`).set('Authorization', `Bearer ${adminToken}`);
            expect(res404.statusCode).toBe(404);

            const res400 = await request(server).get(`${API_PREFIX}/invalidid`).set('Authorization', `Bearer ${adminToken}`);
            expect(res400.statusCode).toBe(400);
        });
    });

    // --- TEST: Update User ---
    describe(`PUT ${API_PREFIX}/:id`, () => {
        it('Should successfully update user fields', async () => {
            const res = await request(server)
                .put(`${API_PREFIX}/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'John Updated', phone: '0779876543' });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.name).toBe('John Updated');
            expect(res.body.user.phone).toBe('0779876543');
        });

        it('Should not update password via PUT', async () => {
            const testUser = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Password Test User', email: `passwordtest${Date.now()}@test.com`, phone: '0775555555',
                    password: 'password123', confirmPassword: 'password123',
                    agreeToTerms: true, address: { city: 'Colombo', district: 'Western' }
                });

            await request(server)
                .put(`${API_PREFIX}/${testUser.body.user.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ password: 'newpassword123' });

            const loginRes = await request(server)
                .post(`${API_PREFIX}/login`)
                .send({ email: testUser.body.user.email, password: 'password123' });
            expect(loginRes.statusCode).toBe(200);
        });

        it('Should return 404 for non-existent user', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(server)
                .put(`${API_PREFIX}/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Non-existent' });

            expect(res.statusCode).toBe(404);
        });

        it('Should update address and accountStatus', async () => {
            const res = await request(server)
                .put(`${API_PREFIX}/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ address: { city: 'Kandy', district: 'Central' }, accountStatus: 'Suspended' });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.address.city).toBe('Kandy');
            expect(res.body.user.accountStatus).toBe('Suspended');
        });

        it('Should reject invalid role and invalid accountStatus', async () => {
            const roleRes = await request(server)
                .put(`${API_PREFIX}/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ role: 'SuperAdmin' });
            expect(roleRes.statusCode).toBe(400);

            const statusRes = await request(server)
                .put(`${API_PREFIX}/${userId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ accountStatus: 'Blocked' });
            expect(statusRes.statusCode).toBe(400);
        });
    });

    // --- TEST: Delete User ---
    describe(`DELETE ${API_PREFIX}/:id`, () => {
        it('Should successfully delete user and verify deletion', async () => {
            const tempUser = await request(server)
                .post(`${API_PREFIX}/register`)
                .send({
                    name: 'Temp User', email: 'tempdelete@test.com', phone: '0771111111',
                    password: 'password123', confirmPassword: 'password123',
                    agreeToTerms: true, address: { city: 'Colombo', district: 'Western' }
                });

            const res = await request(server).delete(`${API_PREFIX}/${tempUser.body.user.id}`).set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('User deleted successfully');

            const checkRes = await request(server).get(`${API_PREFIX}/${tempUser.body.user.id}`).set('Authorization', `Bearer ${adminToken}`);
            expect(checkRes.statusCode).toBe(404);
        });

        it('Should return 404 for non-existent user and 400 for invalid ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res404 = await request(server).delete(`${API_PREFIX}/${fakeId}`).set('Authorization', `Bearer ${adminToken}`);
            expect(res404.statusCode).toBe(404);

            const res400 = await request(server).delete(`${API_PREFIX}/invalidid`).set('Authorization', `Bearer ${adminToken}`);
            expect(res400.statusCode).toBe(400);
        });
    });
});


