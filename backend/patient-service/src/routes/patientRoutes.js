const express = require('express');

const {
  createPatient,
  getMyPatientProfile,
  getPatientById,
  updatePatient,
  deletePatient,
  addReport,
  getReports,
  getReportsByUserId,
  downloadReport,
  downloadReportByUserId
} = require('../controllers/patientController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { uploadReportFile } = require('../middleware/uploadMiddleware');
const {
  isOwnerOrAdmin,
  isDoctorWithAppointmentOrAdmin,
  isDoctorWithPatientUserIdOrAdmin
} = require('../middleware/patientAccessMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(verifyToken);

router.post('/', authorizeRoles('PATIENT', 'ADMIN'), createPatient);
router.get('/me', authorizeRoles('PATIENT', 'ADMIN'), getMyPatientProfile);
router.get('/by-user/:userId/reports/doctor', authorizeRoles('DOCTOR', 'ADMIN'), asyncHandler(isDoctorWithPatientUserIdOrAdmin), getReportsByUserId);
router.get('/by-user/:userId/reports/:reportId/download/doctor', authorizeRoles('DOCTOR', 'ADMIN'), asyncHandler(isDoctorWithPatientUserIdOrAdmin), downloadReportByUserId);

router.get('/:id', authorizeRoles('PATIENT', 'ADMIN'), asyncHandler(isOwnerOrAdmin), getPatientById);
router.put('/:id', authorizeRoles('PATIENT', 'ADMIN'), asyncHandler(isOwnerOrAdmin), updatePatient);
router.delete('/:id', authorizeRoles('PATIENT', 'ADMIN'), asyncHandler(isOwnerOrAdmin), deletePatient);

router.post('/:id/reports', authorizeRoles('PATIENT', 'ADMIN'), asyncHandler(isOwnerOrAdmin), uploadReportFile.single('report'), addReport);
router.get('/:id/reports', authorizeRoles('PATIENT', 'ADMIN'), asyncHandler(isOwnerOrAdmin), getReports);
router.get('/:id/reports/:reportId/download', authorizeRoles('PATIENT', 'ADMIN'), asyncHandler(isOwnerOrAdmin), downloadReport);
router.get('/:id/reports/doctor', authorizeRoles('DOCTOR', 'ADMIN'), asyncHandler(isDoctorWithAppointmentOrAdmin), getReports);

module.exports = router;
