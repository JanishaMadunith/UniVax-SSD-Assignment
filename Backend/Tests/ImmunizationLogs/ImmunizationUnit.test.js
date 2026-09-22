const mongoose = require('mongoose');
require('../../server'); // loads dotenv so MONGO_URI is available
const ImmunizationLog = require('../../Model/ImmunizationLogs/immunizationLog.model');
const immunizationLogService = require('../../Services/ImmunizationLogs/immunizationLog.service');
const User = require('../../Model/users/UserModel');
const VaccineProduct = require('../../Model/vaccineCatalog/VaccineModel');

// ============================================================
// UNIT TESTS — Immunization Log Service (direct calls, no HTTP)
// Tests each service method in isolation against test DB
// ============================================================
describe('Immunization Log — Unit Testing', () => {
    let testUserId;
    let testVaccineId;
    let createdLogId;

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test');
        }
        // Clean up old unit test fixtures (handles re-runs)
        await User.deleteMany({ email: 'unitloguser@test.com' });
        await VaccineProduct.deleteMany({ name: /^UnitLogVaccine_/ });

        // Create test user directly via model (bypasses HTTP layer)
        const user = await User.create({
            name: `UnitLogUser_${Date.now()}`,
            email: 'unitloguser@test.com',
            phone: '0770011111',
            password: 'password123',
            agreeToTerms: true,
            address: { city: 'Colombo', district: 'Western' }
        });
        testUserId = user._id;

        // Create test vaccine directly via model
        const vaccine = await VaccineProduct.create({
            name: `UnitLogVaccine_${Date.now()}`,
            genericName: 'Unit Generic',
            manufacturer: 'Unit Mfr',
            cvxCode: String(Date.now()).slice(-8),
            presentation: 'vial',
            volume: { value: 0.5, unit: 'mL' },
            totalDoses: 2
        });
        testVaccineId = vaccine._id;
    }, 60000);

    afterAll(async () => {
        await ImmunizationLog.deleteMany({ batchNumber: /^UNIT/ });
        await VaccineProduct.deleteMany({ name: /^UnitLogVaccine_/ });
        await User.deleteMany({ email: 'unitloguser@test.com' });
        if (mongoose.connection.readyState) {
            await mongoose.connection.close();
        }
    });

    // Helper: base valid log data
    const makeLogData = (overrides = {}) => ({
        userId: testUserId,
        vaccineId: testVaccineId,
        dateAdministered: new Date(),
        doseNumber: 1,
        clinic: 'Unit Test Clinic',
        brand: 'UnitBrand',
        batchNumber: `UNIT_${Date.now()}`,
        ...overrides
    });

    // --- Unit: createLog ---
    describe('ImmunizationLogService.createLog()', () => {
        it('Should create a log with valid data', async () => {
            const log = await immunizationLogService.createLog(makeLogData({ batchNumber: 'UNIT001' }));
            expect(log).toBeDefined();
            expect(log._id).toBeDefined();
            expect(log.doseNumber).toBe(1);
            expect(log.clinic).toBe('Unit Test Clinic');
            createdLogId = log._id;
        });

        it('Should fail when required field clinic is missing', async () => {
            const data = makeLogData();
            delete data.clinic;
            await expect(immunizationLogService.createLog(data)).rejects.toThrow();
        });

        it('Should fail when required field brand is missing', async () => {
            const data = makeLogData();
            delete data.brand;
            await expect(immunizationLogService.createLog(data)).rejects.toThrow();
        });

        it('Should fail when required field batchNumber is missing', async () => {
            const data = makeLogData();
            delete data.batchNumber;
            await expect(immunizationLogService.createLog(data)).rejects.toThrow();
        });
    });

    // --- Unit: getLogs ---
    describe('ImmunizationLogService.getLogs()', () => {
        it('Should return all logs for Admin role', async () => {
            const logs = await immunizationLogService.getLogs(testUserId, 'Admin');
            expect(Array.isArray(logs)).toBe(true);
            expect(logs.length).toBeGreaterThan(0);
        });

        it('Should return all logs for Doctor role', async () => {
            const logs = await immunizationLogService.getLogs(testUserId, 'Doctor');
            expect(Array.isArray(logs)).toBe(true);
        });

        it('Should return only own logs for Patient role', async () => {
            const logs = await immunizationLogService.getLogs(testUserId, 'Patient');
            expect(Array.isArray(logs)).toBe(true);
            logs.forEach(log => {
                const logUid = log.userId?._id?.toString() || log.userId?.toString();
                expect(logUid).toBe(testUserId.toString());
            });
        });
    });

    // --- Unit: getLogById ---
    describe('ImmunizationLogService.getLogById()', () => {
        it('Should return correct log by ID', async () => {
            const log = await immunizationLogService.getLogById(createdLogId);
            expect(log).toBeDefined();
            expect(log._id.toString()).toBe(createdLogId.toString());
        });

        it('Should return null for a non-existent ObjectId', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const log = await immunizationLogService.getLogById(fakeId);
            expect(log).toBeNull();
        });
    });

    // --- Unit: updateLog ---
    describe('ImmunizationLogService.updateLog()', () => {
        it('Should update notes field of a log', async () => {
            const updated = await immunizationLogService.updateLog(createdLogId, { notes: 'Unit test note' });
            expect(updated).toBeDefined();
            expect(updated.notes).toBe('Unit test note');
        });

        it('Should return null when updating a non-existent log', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const result = await immunizationLogService.updateLog(fakeId, { notes: 'ghost' });
            expect(result).toBeNull();
        });
    });

    // --- Unit: deleteLog ---
    describe('ImmunizationLogService.deleteLog()', () => {
        it('Should delete a log and return the deleted document', async () => {
            const toDelete = await immunizationLogService.createLog(makeLogData({ batchNumber: 'UNIT_DEL' }));
            const deleted = await immunizationLogService.deleteLog(toDelete._id);
            expect(deleted).toBeDefined();
            expect(deleted._id.toString()).toBe(toDelete._id.toString());
        });

        it('Should return null when deleting a non-existent log', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const result = await immunizationLogService.deleteLog(fakeId);
            expect(result).toBeNull();
        });
    });

    // --- Unit: Model validation ---
    describe('ImmunizationLog Model Validation', () => {
        it('Should reject doseNumber less than 1 (min: 1)', async () => {
            const log = new ImmunizationLog({
                userId: testUserId,
                vaccineId: testVaccineId,
                dateAdministered: new Date(),
                doseNumber: 0,
                clinic: 'Unit Test Clinic',
                brand: 'UnitBrand',
                batchNumber: 'UNIT_BAD_DOSE'
            });
            await expect(log.save()).rejects.toThrow();
        });

        it('Should set createdAt and updatedAt timestamps on creation', async () => {
            const log = await immunizationLogService.createLog(makeLogData({ batchNumber: 'UNIT_TS' }));
            expect(log.createdAt).toBeDefined();
            expect(log.updatedAt).toBeDefined();
        });
    });
});
