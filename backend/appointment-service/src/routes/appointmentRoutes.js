const express = require('express');

const {
	bookAppointment,
	getMyAppointments,
	cancelMyAppointment,
	rescheduleMyAppointment,
	getMyDoctorAppointments,
	getMyAppointmentStats,
	getAdminAppointmentOverview,
	getAppointmentById,
	updateAppointmentStatus,
	updateVideoCall,
	hasPatientForDoctor,
	issuePrescription,
	initiatePayHerePayment,
	handlePayHereNotify
} = require('../controllers/appointmentController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { canAccessAppointment } = require('../middleware/accessMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// PayHere notify callback must be public (no JWT), called by payment gateway server.
router.post('/payhere/notify', handlePayHereNotify);

router.use(verifyToken);

router.post('/', authorizeRoles('PATIENT'), bookAppointment);
router.get('/my', authorizeRoles('PATIENT'), getMyAppointments);
router.patch('/:id/cancel', authorizeRoles('PATIENT'), cancelMyAppointment);
router.patch('/:id/reschedule', authorizeRoles('PATIENT'), rescheduleMyAppointment);
router.get('/doctor/my', authorizeRoles('DOCTOR'), getMyDoctorAppointments);
router.get('/doctor/has-patient/:patientUserId', authorizeRoles('DOCTOR'), hasPatientForDoctor);
router.get('/stats/my', authorizeRoles('PATIENT'), getMyAppointmentStats);
router.get('/admin/overview', authorizeRoles('ADMIN'), getAdminAppointmentOverview);
router.get('/:id', asyncHandler(canAccessAppointment), getAppointmentById);
router.patch('/:id/status', authorizeRoles('DOCTOR', 'ADMIN'), asyncHandler(canAccessAppointment), updateAppointmentStatus);
router.patch('/:id/video-call', authorizeRoles('DOCTOR', 'ADMIN'), asyncHandler(canAccessAppointment), updateVideoCall);
router.patch('/:id/prescription', authorizeRoles('DOCTOR', 'ADMIN'), asyncHandler(canAccessAppointment), issuePrescription);
router.post('/:id/payment/payhere/initiate', authorizeRoles('PATIENT'), initiatePayHerePayment);

module.exports = router;
