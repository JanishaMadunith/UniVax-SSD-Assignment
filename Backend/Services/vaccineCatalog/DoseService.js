const DoseRequirement = require('../../Model/vaccineCatalog/DoseModel');
const VaccineProduct = require('../../Model/vaccineCatalog/VaccineModel');

// Create a new dose requirement
const createDose = async (vaccineId, doseData) => {
  try {
    // Check if vaccine exists
    const vaccine = await VaccineProduct.findById(vaccineId);
    
    if (!vaccine) {
      throw {
        status: 404,
        message: 'Vaccine not found'
      };
    }

    // Check if dose number already exists
    const existingDose = await DoseRequirement.findOne({
      vaccineId: vaccineId,
      doseNumber: doseData.doseNumber,
      status: 'active'
    });

    if (existingDose) {
      throw {
        status: 400,
        message: `Dose ${doseData.doseNumber} already exists for this vaccine`
      };
    }

    const dose = await DoseRequirement.create({
      ...doseData,
      vaccineId: vaccineId,
      version: 1
    });

    return {
      success: true,
      message: 'Dose requirement created successfully',
      data: dose
    };
  } catch (error) {
    console.error('Dose creation error:', error);
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error during dose creation',
      error: error.message
    };
  }
};

// Get all doses for a vaccine
const getVaccineDoses = async (vaccineId) => {
  try {
    // Check if vaccine exists
    const vaccine = await VaccineProduct.findById(vaccineId);
    
    if (!vaccine) {
      throw {
        status: 404,
        message: 'Vaccine not found'
      };
    }

    const doses = await DoseRequirement.find({
      vaccineId: vaccineId,
      status: { $ne: 'superseded' }
    }).sort({ doseNumber: 1 });

    if (!doses || doses.length === 0) {
      throw {
        status: 404,
        message: 'No dose requirements found for this vaccine',
        data: []
      };
    }

    return {
      success: true,
      count: doses.length,
      data: doses
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error while fetching vaccine doses',
      error: error.message
    };
  }
};

// Get dose by ID
const getDoseById = async (doseId) => {
  try {
    const dose = await DoseRequirement.findById(doseId)
      .populate('vaccineId', 'name manufacturer');

    if (!dose) {
      throw {
        status: 404,
        message: 'Dose requirement not found'
      };
    }

    return {
      success: true,
      data: dose
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error while fetching dose',
      error: error.message
    };
  }
};

// Update dose requirement (with versioning)
const updateDose = async (doseId, updateData) => {
  try {
    const oldDose = await DoseRequirement.findById(doseId);
    
    if (!oldDose) {
      throw {
        status: 404,
        message: 'Dose requirement not found'
      };
    }

    // Check if this is a significant change that requires versioning
    const isSignificantChange = 
      (updateData.minAge && JSON.stringify(updateData.minAge) !== JSON.stringify(oldDose.minAge)) ||
      (updateData.intervalFromPrevious && JSON.stringify(updateData.intervalFromPrevious) !== JSON.stringify(oldDose.intervalFromPrevious));

    if (isSignificantChange) {
      // Mark old version as superseded
      await DoseRequirement.findByIdAndUpdate(doseId, {
        status: 'superseded',
        validUntil: new Date()
      });

      // Create new version with all changes
      const newVersion = {
        ...oldDose.toObject(),
        ...updateData,
        _id: undefined,
        version: oldDose.version + 1,
        validFrom: new Date(),
        validUntil: null,
        status: 'active'
      };

      // Remove __v to avoid conflicts
      delete newVersion.__v;

      const newDose = await DoseRequirement.create(newVersion);

      return {
        success: true,
        message: 'Dose requirement updated with new version',
        data: newDose
      };
    }

    // Minor update - directly update with all provided fields
    const dose = await DoseRequirement.findByIdAndUpdate(
      doseId,
      { $set: updateData },
      {
        new: true,
        runValidators: false
      }
    );

    return {
      success: true,
      message: 'Dose requirement updated successfully',
      data: dose
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error during dose update',
      error: error.message
    };
  }
};

// Delete dose requirement (hard delete)
const deleteDose = async (doseId) => {
  try {
    const dose = await DoseRequirement.findById(doseId);

    if (!dose) {
      throw {
        status: 404,
        message: 'Dose requirement not found'
      };
    }

    // Hard delete - permanently remove from database
    await DoseRequirement.findByIdAndDelete(doseId);

    return {
      success: true,
      message: 'Dose requirement deleted successfully',
      data: {}
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error during dose deletion',
      error: error.message
    };
  }
};

// Calculate next due date based on patient age and last dose
const calculateDueDate = async (vaccineId, patientAgeMonths, lastDoseDate, doseNumber = 1) => {
  try {
    const dose = await DoseRequirement.findOne({
      vaccineId: vaccineId,
      doseNumber: doseNumber,
      status: 'active'
    });

    if (!dose) {
      throw {
        status: 404,
        message: 'Dose requirements not found'
      };
    }

    let dueDate = null;
    let status = 'eligible';

    // First dose - based on age
    if (doseNumber === 1 || !lastDoseDate) {
      if (patientAgeMonths >= dose.minAge.value) {
        dueDate = new Date();
      } else {
        // Calculate future date when age requirement will be met
        const birthDate = new Date();
        birthDate.setMonth(birthDate.getMonth() - patientAgeMonths);
        dueDate = new Date(birthDate);
        dueDate.setMonth(dueDate.getMonth() + dose.minAge.value);
        status = 'future';
      }
    } 
    // Subsequent doses - based on interval
    else if (lastDoseDate) {
      const lastDose = new Date(lastDoseDate);
      dueDate = new Date(lastDose);
      
      if (dose.intervalFromPrevious.exactDays) {
        dueDate.setDate(dueDate.getDate() + dose.intervalFromPrevious.exactDays);
      } else if (dose.intervalFromPrevious.minDays) {
        dueDate.setDate(dueDate.getDate() + dose.intervalFromPrevious.minDays);
      }

      // Check if overdue
      if (new Date() > dueDate) {
        status = 'overdue';
      }
    }

    return {
      success: true,
      data: {
        dueDate,
        status,
        doseNumber: dose.doseNumber,
        minAgeRequired: dose.minAge,
        interval: dose.intervalFromPrevious
      }
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error during due date calculation',
      error: error.message
    };
  }
};

module.exports = {
  createDose,
  getVaccineDoses,
  getDoseById,
  updateDose,
  deleteDose,
  calculateDueDate
};
