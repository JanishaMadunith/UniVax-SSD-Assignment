const mongoose = require('mongoose');
require('../../server'); // loads dotenv so MONGO_URI is available
const VaccineProduct = require('../../Model/vaccineCatalog/VaccineModel');
const DoseRequirement = require('../../Model/vaccineCatalog/DoseModel');
const vaccineService = require('../../Services/vaccineCatalog/VaccineService');
const doseService = require('../../Services/vaccineCatalog/DoseService');

// ============================================================
// UNIT TESTS — Vaccine & Dose Service (direct calls, no HTTP)
// Tests each service method in isolation against test DB
// ============================================================
describe('Vaccine Catalog — Unit Testing', () => {
    let testVaccineId;
    let testDoseId;
    const ts = Date.now();

    beforeAll(async () => {
        if (!mongoose.connection.readyState) {
            await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/univax-test');
        }
        await VaccineProduct.deleteMany({ name: /^UnitVaccine_/ });
    }, 60000);

    afterAll(async () => {
        if (testVaccineId) {
            await DoseRequirement.deleteMany({ vaccineId: testVaccineId });
        }
        await VaccineProduct.deleteMany({ name: /^UnitVaccine_/ });
        if (mongoose.connection.readyState) {
            await mongoose.connection.close();
        }
    });

    // --- Unit: vaccineService.createVaccine ---
    describe('vaccineService.createVaccine()', () => {
        it('Should create a vaccine with valid data', async () => {
            const result = await vaccineService.createVaccine({
                name: `UnitVaccine_${ts}`,
                genericName: 'Unit Generic',
                manufacturer: 'Unit Mfr',
                cvxCode: String(ts).slice(-8),
                presentation: 'vial',
                volume: { value: 0.5, unit: 'mL' },
                totalDoses: 2
            });
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.name).toContain('UnitVaccine');
            testVaccineId = result.data._id;
        });

        it('Should throw status 400 for duplicate CVX code', async () => {
            await expect(vaccineService.createVaccine({
                name: `UnitVaccine_DUP_${ts}`,
                genericName: 'Dup Generic',
                manufacturer: 'Dup Mfr',
                cvxCode: String(ts).slice(-8), // same CVX code
                presentation: 'vial',
                volume: { value: 1.0, unit: 'mL' },
                totalDoses: 1
            })).rejects.toMatchObject({ status: 400 });
        });
    });

    // --- Unit: vaccineService.getAllVaccines ---
    describe('vaccineService.getAllVaccines()', () => {
        it('Should return success with vaccine array when vaccines exist', async () => {
            const result = await vaccineService.getAllVaccines({});
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.count).toBeGreaterThan(0);
        });

        it('Should filter by status=active and only return active vaccines', async () => {
            const result = await vaccineService.getAllVaccines({ status: 'active' });
            expect(result.success).toBe(true);
            result.data.forEach(v => expect(v.status).toBe('active'));
        });

        it('Should throw status 404 when no vaccines match criteria', async () => {
            await expect(
                vaccineService.getAllVaccines({ manufacturer: 'NoSuchManufacturer_ZZZZ' })
            ).rejects.toMatchObject({ status: 404 });
        });
    });

    // --- Unit: vaccineService.getVaccineById ---
    describe('vaccineService.getVaccineById()', () => {
        it('Should return correct vaccine by ID', async () => {
            const result = await vaccineService.getVaccineById(testVaccineId);
            expect(result.success).toBe(true);
            expect(result.data._id.toString()).toBe(testVaccineId.toString());
        });

        it('Should throw status 404 for a non-existent ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await expect(vaccineService.getVaccineById(fakeId))
                .rejects.toMatchObject({ status: 404 });
        });
    });

    // --- Unit: vaccineService.updateVaccine (minor) ---
    describe('vaccineService.updateVaccine()', () => {
        it('Should do a minor update without creating a new version', async () => {
            const result = await vaccineService.updateVaccine(testVaccineId, {
                description: 'Updated in unit test'
            });
            expect(result.success).toBe(true);
            expect(result.data.description).toBe('Updated in unit test');
        });
    });

    // --- Unit: doseService.createDose ---
    describe('doseService.createDose()', () => {
        it('Should create a dose requirement for a valid vaccine', async () => {
            const result = await doseService.createDose(testVaccineId, {
                doseNumber: 1,
                minAge: { value: 2, unit: 'months' }
            });
            expect(result.success).toBe(true);
            expect(result.data.doseNumber).toBe(1);
            testDoseId = result.data._id;
        });

        it('Should throw status 400 for a duplicate dose number on same vaccine', async () => {
            await expect(doseService.createDose(testVaccineId, {
                doseNumber: 1, // already exists
                minAge: { value: 2, unit: 'months' }
            })).rejects.toMatchObject({ status: 400 });
        });

        it('Should throw status 404 for a non-existent vaccine ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await expect(doseService.createDose(fakeId, {
                doseNumber: 1,
                minAge: { value: 2, unit: 'months' }
            })).rejects.toMatchObject({ status: 404 });
        });
    });

    // --- Unit: doseService.getDoseById ---
    describe('doseService.getDoseById()', () => {
        it('Should return correct dose by ID', async () => {
            const result = await doseService.getDoseById(testDoseId);
            expect(result.success).toBe(true);
            expect(result.data._id.toString()).toBe(testDoseId.toString());
        });

        it('Should throw status 404 for a non-existent dose ID', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await expect(doseService.getDoseById(fakeId))
                .rejects.toMatchObject({ status: 404 });
        });
    });
});
