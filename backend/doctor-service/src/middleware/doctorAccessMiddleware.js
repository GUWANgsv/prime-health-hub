const mongoose = require('mongoose');

const Doctor = require('../models/Doctor');

const isDoctorOwner = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid doctor id'
    });
  }

  const doctor = await Doctor.findById(id).select('userId');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor profile not found'
    });
  }

  if (String(doctor.userId) !== String(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own doctor profile'
    });
  }

  return next();
};

module.exports = {
  isDoctorOwner
};
