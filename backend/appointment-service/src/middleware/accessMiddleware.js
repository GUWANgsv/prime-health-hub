const mongoose = require('mongoose');

const Appointment = require('../models/Appointment');

const canAccessAppointment = async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid appointment id'
    });
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  const appointment = await Appointment.findById(id).select('patientId doctorId');
  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  const isOwnerPatient = req.user.role === 'PATIENT' && String(appointment.patientId) === String(req.user.id);
  const isOwnerDoctor = req.user.role === 'DOCTOR' && String(appointment.doctorId) === String(req.user.id);

  if (!isOwnerPatient && !isOwnerDoctor) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this appointment'
    });
  }

  return next();
};

const canAccessPatientAppointments = (req, res, next) => {
  const { patientId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid patient id'
    });
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role !== 'PATIENT' || String(req.user.id) !== String(patientId)) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own appointments'
    });
  }

  return next();
};

const canAccessDoctorAppointments = (req, res, next) => {
  const { doctorId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid doctor id'
    });
  }

  if (req.user.role === 'ADMIN') {
    return next();
  }

  if (req.user.role !== 'DOCTOR' || String(req.user.id) !== String(doctorId)) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own appointment list'
    });
  }

  return next();
};

module.exports = {
  canAccessAppointment,
  canAccessPatientAppointments,
  canAccessDoctorAppointments
};
