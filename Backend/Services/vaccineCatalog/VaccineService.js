const VaccineProduct = require('../../Model/vaccineCatalog/VaccineModel');
const DoseRequirement = require('../../Model/vaccineCatalog/DoseModel');

// Create a new vaccine
const createVaccine = async (vaccineData, userId) => {
  try {
    // Check if vaccine with same CVX code exists
    const existingVaccine = await VaccineProduct.findOne({ 
      cvxCode: vaccineData.cvxCode 
    });
    
    if (existingVaccine) {
      throw {
        status: 400,
        message: 'Vaccine with this CVX code already exists'
      };
    }

    const vaccine = await VaccineProduct.create({
      ...vaccineData,
      createdBy: userId || 'system',
      version: 1
    });

    return {
      success: true,
      message: 'Vaccine created successfully',
      data: vaccine
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error during vaccine creation',
      error: error.message
    };
  }
};

// Get all vaccines with filtering
const getAllVaccines = async (filters = {}) => {
  try {
    const { status, manufacturer, search, region } = filters;
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by manufacturer
    if (manufacturer) {
      query.manufacturer = manufacturer;
    }

    // Search by name or generic name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by approved region
    if (region) {
      query['approvedRegions.country'] = region;
    }

    const vaccines = await VaccineProduct.find(query)
      .populate({
        path: 'doseRequirements',
        match: { status: 'active' },
        select: 'doseNumber minAge intervalFromPrevious'
      })
      .sort({ name: 1 });

    if (!vaccines || vaccines.length === 0) {
      throw {
        status: 404,
        message: 'No vaccines found',
        data: []
      };
    }

    return {
      success: true,
      count: vaccines.length,
      data: vaccines
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error while fetching vaccines',
      error: error.message
    };
  }
};

// Get vaccine by ID
const getVaccineById = async (vaccineId) => {
  try {
    const vaccine = await VaccineProduct.findById(vaccineId)
      .populate('doseRequirements');

    if (!vaccine) {
      throw {
        status: 404,
        message: 'Vaccine not found'
      };
    }

    return {
      success: true,
      data: vaccine
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error while fetching vaccine',
      error: error.message
    };
  }
};

// Update vaccine (with versioning)
const updateVaccine = async (vaccineId, updateData, userId) => {
  try {
    const oldVaccine = await VaccineProduct.findById(vaccineId);
    
    if (!oldVaccine) {
      throw {
        status: 404,
        message: 'Vaccine not found'
      };
    }

    // Check if this is a significant change that requires versioning
    // Only trigger versioning if status or totalDoses are actually being changed
    const isSignificantChange = 
      (updateData.status !== undefined && updateData.status !== oldVaccine.status) ||
      (updateData.totalDoses !== undefined && updateData.totalDoses !== oldVaccine.totalDoses);

    if (isSignificantChange) {
      // Archive old version
      await VaccineProduct.findByIdAndUpdate(vaccineId, {
        status: 'archived',
        validUntil: new Date()
      });

      // Create new version
      const newVaccine = await VaccineProduct.create({
        ...oldVaccine.toObject(),
        ...updateData,
        _id: undefined,
        version: oldVaccine.version + 1,
        validFrom: new Date(),
        validUntil: null,
        status: updateData.status || 'active',
        lastModifiedBy: userId || 'system',
        updateReason: updateData.updateReason || 'Manual update'
      });

      return {
        success: true,
        message: 'Vaccine updated with new version',
        data: newVaccine,
        previousVersion: oldVaccine.version
      };
    }

    // Minor update (no version change) - directly update fields
    const vaccine = await VaccineProduct.findByIdAndUpdate(
      vaccineId,
      { $set: updateData },
      {
        new: true,
        runValidators: false
      }
    );

    return {
      success: true,
      message: 'Vaccine updated successfully',
      data: vaccine
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error during vaccine update',
      error: error.message
    };
  }
};

// Delete vaccine (hard delete) - cascade deletes associated doses
const deleteVaccine = async (vaccineId) => {
  try {
    const vaccine = await VaccineProduct.findById(vaccineId);

    if (!vaccine) {
      throw {
        status: 404,
        message: 'Vaccine not found'
      };
    }

    // Delete all associated dose requirements (cascade delete)
    await DoseRequirement.deleteMany({ 
      vaccineId: vaccineId
    });

    // Hard delete - permanently remove vaccine from database
    await VaccineProduct.findByIdAndDelete(vaccineId);

    return {
      success: true,
      message: 'Vaccine and associated doses deleted successfully',
      data: {}
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error during vaccine deletion',
      error: error.message
    };
  }
};

// Get vaccine history/versions
const getVaccineHistory = async (vaccineId) => {
  try {
    const vaccine = await VaccineProduct.findById(vaccineId);
    
    if (!vaccine) {
      throw {
        status: 404,
        message: 'Vaccine not found'
      };
    }

    // Find all versions by name or CVX code
    const history = await VaccineProduct.find({
      $or: [
        { name: vaccine.name },
        { cvxCode: vaccine.cvxCode }
      ]
    })
    .sort({ version: -1 })
    .select('name version status validFrom validUntil updateReason');

    return {
      success: true,
      currentVersion: vaccine.version,
      history: history
    };
  } catch (error) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 500,
      message: 'Server error while fetching vaccine history',
      error: error.message
    };
  }
};

module.exports = {
  createVaccine,
  getAllVaccines,
  getVaccineById,
  updateVaccine,
  deleteVaccine,
  getVaccineHistory
};
