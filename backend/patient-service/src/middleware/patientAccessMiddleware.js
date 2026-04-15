const mongoose = require('mongoose');
const axios = require('axios');

const Patient = require('../models/Patient');

const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:4004';

const isOwnerOrAdmin = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid patient id'
    });
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  const patient = await Patient.findById(id).select('userId');

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient profile not found'
    });
  }

  if (String(patient.userId) !== String(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'You can only access your own patient profile'
    });
  }

  return next();
};

const isDoctorWithAppointmentOrAdmin = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid patient id'
    });
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role !== 'DOCTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only assigned doctors can access patient reports'
    });
  }

  const patient = await Patient.findById(id).select('userId');
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient profile not found'
    });
  }

  try {
    const { data } = await axios.get(
      `${APPOINTMENT_SERVICE_URL}/api/appointments/doctor/has-patient/${patient.userId}`,
      {
        headers: req.headers.authorization
          ? { Authorization: req.headers.authorization }
          : undefined
      }
    );

    if (!data?.hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have an appointment with this patient'
      });
    }
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.response?.data?.message || 'Unable to verify doctor access for this patient'
    });
  }

  return next();
};

const isDoctorWithPatientUserIdOrAdmin = async (req, res, next) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid patient user id'
    });
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role !== 'DOCTOR') {
    return res.status(403).json({
      success: false,
      message: 'Only assigned doctors can access patient reports'
    });
  }

  try {
    const { data } = await axios.get(
      `${APPOINTMENT_SERVICE_URL}/api/appointments/doctor/has-patient/${userId}`,
      {
        headers: req.headers.authorization
          ? { Authorization: req.headers.authorization }
          : undefined
      }
    );

    if (!data?.hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have an appointment with this patient'
      });
    }
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.response?.data?.message || 'Unable to verify doctor access for this patient'
    });
  }

  return next();
};

module.exports = {
  isOwnerOrAdmin,
  isDoctorWithAppointmentOrAdmin,
  isDoctorWithPatientUserIdOrAdmin
};
