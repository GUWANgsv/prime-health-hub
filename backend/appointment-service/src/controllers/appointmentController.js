const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');

const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { triggerAppointmentEventNotification } = require('../utils/notificationClient');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:4003';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:4002';
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const PAYHERE_MERCHANT_ID = String(process.env.PAYHERE_MERCHANT_ID || '').trim();
const PAYHERE_MERCHANT_SECRET = String(process.env.PAYHERE_MERCHANT_SECRET || '').trim();
const PAYHERE_CURRENCY = process.env.PAYHERE_CURRENCY || 'LKR';
const PAYHERE_ENV = String(process.env.PAYHERE_ENV || 'LIVE').trim().toUpperCase();
const PAYHERE_CHECKOUT_URL =
	String(process.env.PAYHERE_CHECKOUT_URL || '').trim() ||
	(PAYHERE_ENV === 'SANDBOX' ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PAYHERE_NOTIFY_URL = process.env.PAYHERE_NOTIFY_URL || `${process.env.GATEWAY_PUBLIC_URL || 'http://localhost:4000'}/api/appointments/payhere/notify`;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const decodeMaybeBase64Secret = (value) => {
	const raw = String(value || '').trim();
	if (!raw) {
		return raw;
	}

	// Some environments store merchant secret as base64 text; decode before hashing.
	const looksLikeBase64 = /^[A-Za-z0-9+/=]+$/.test(raw) && raw.length % 4 === 0;
	if (!looksLikeBase64) {
		return raw;
	}

	try {
		const decoded = Buffer.from(raw, 'base64').toString('utf8').trim();
		if (/^[\x20-\x7E]+$/.test(decoded) && decoded.length >= 8) {
			return decoded;
		}
	} catch (error) {
		return raw;
	}

	return raw;
};

const resolvePayHereSecretHash = (merchantSecret) => {
	const normalized = decodeMaybeBase64Secret(merchantSecret);
	if (/^[a-fA-F0-9]{32}$/.test(normalized)) {
		return normalized.toUpperCase();
	}

	return crypto.createHash('md5').update(normalized).digest('hex').toUpperCase();
};

const normalizeStatusFilter = (value) => {
	if (!value || value === 'ALL') {
		return null;
	}

	const normalized = String(value).trim().toUpperCase();
	if (normalized === 'APPROVED') {
		return 'PENDING';
	}

	if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(normalized)) {
		throw new ApiError('invalid appointment status filter', 400);
	}

	return normalized;
};

const fetchDoctorByUserId = async (doctorUserId, authHeader, { approvedOnly = true } = {}) => {
	const { data } = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors`, {
		params: approvedOnly ? { approvedOnly: 'true' } : undefined,
		headers: authHeader ? { Authorization: authHeader } : undefined
	});

	const doctors = Array.isArray(data?.doctors) ? data.doctors : [];
	return doctors.find((d) => String(d.userId) === String(doctorUserId));
};

const fetchDoctorProfileByToken = async (authHeader) => {
	const { data } = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/me`, {
		headers: authHeader ? { Authorization: authHeader } : undefined
	});

	if (!data?.success || !data?.doctor) {
		throw new ApiError('doctor profile not found', 404);
	}

	return data.doctor;
};

const fetchUserById = async (userId, authHeader) => {
	const { data } = await axios.get(`${AUTH_SERVICE_URL}/api/auth/users/${userId}`, {
		headers: authHeader ? { Authorization: authHeader } : undefined
	});

	if (!data?.success || !data?.user) {
		return null;
	}

	return data.user;
};

const fetchPatientProfileByToken = async (authHeader) => {
	const { data } = await axios.get(`${PATIENT_SERVICE_URL}/api/patients/me`, {
		headers: authHeader ? { Authorization: authHeader } : undefined
	});

	if (!data?.success || !data?.patient) {
		return null;
	}

	return data.patient;
};

const ensureApprovedDoctor = async (req) => {
	if (req.user.role !== 'DOCTOR') {
		return null;
	}

	const doctor = await fetchDoctorProfileByToken(req.headers.authorization);
	if (doctor.status !== 'APPROVED') {
		throw new ApiError('doctor profile must be approved to manage appointments', 403);
	}

	return doctor;
};

const bookAppointment = asyncHandler(async (req, res) => {
	if (req.user.role !== 'PATIENT') {
		throw new ApiError('Only PATIENT can book appointments', 403);
	}

	const { doctorId, date, time, reason } = req.body;
	if (!doctorId || !date || !time) {
		throw new ApiError('doctorId, date and time are required', 400);
	}

	if (!isValidObjectId(doctorId)) {
		throw new ApiError('doctorId must be a valid id', 400);
	}

	const approvedDoctor = await fetchDoctorByUserId(doctorId, req.headers.authorization, { approvedOnly: true });
	if (!approvedDoctor) {
		throw new ApiError('doctor not found or not approved', 404);
	}

	const [patientUser, doctorUser, patientProfile] = await Promise.all([
		fetchUserById(req.user.id, req.headers.authorization).catch(() => null),
		fetchUserById(doctorId, req.headers.authorization).catch(() => null),
		fetchPatientProfileByToken(req.headers.authorization).catch(() => null)
	]);

	const appointment = await Appointment.create({
		patientId: req.user.id,
		doctorId,
		doctorProfileId: approvedDoctor._id,
		doctorName: approvedDoctor.doctorName || 'Doctor',
		doctorEmail: doctorUser?.email || '',
		doctorContact: String(approvedDoctor.contact || '').trim(),
		specialization: approvedDoctor.specialization,
		patientEmail: patientUser?.email || req.user.email || '',
		patientContact: patientProfile?.contact || '',
		consultationFee: Number(approvedDoctor.consultationFee || 0),
		currency: PAYHERE_CURRENCY,
		date: String(date).trim(),
		time: String(time).trim(),
		reason: reason ? String(reason).trim() : ''
	});

	const notificationResult = await triggerAppointmentEventNotification({
		type: 'APPOINTMENT_BOOKED',
		appointment,
		authHeader: req.headers.authorization,
		message: `Appointment booked for ${appointment.date} at ${appointment.time}`,
		recipients: [
			{
				userId: appointment.patientId,
				role: 'PATIENT',
				name: patientUser?.name || 'Patient',
				email: appointment.patientEmail,
				phone: appointment.patientContact
			},
			{
				userId: appointment.doctorId,
				role: 'DOCTOR',
				name: approvedDoctor.doctorName || doctorUser?.name || 'Doctor',
				email: appointment.doctorEmail,
				phone: appointment.doctorContact
			}
		]
	});

	const whatsappLink = Array.isArray(notificationResult?.delivery)
		? notificationResult.delivery.find((item) => item?.whatsappLink)?.whatsappLink || ''
		: '';

	return res.status(201).json({
		success: true,
		message: 'Appointment booked successfully',
		appointment,
		notificationDelivery: notificationResult?.delivery || [],
		whatsappLink
	});
});

const getMyAppointments = asyncHandler(async (req, res) => {
	if (req.user.role !== 'PATIENT') {
		throw new ApiError('Only PATIENT can view this endpoint', 403);
	}

	const status = normalizeStatusFilter(req.query.status);
	const filter = { patientId: req.user.id };
	if (status) {
		filter.status = status;
	}

	const appointments = await Appointment.find(filter).sort({ date: 1, time: 1, createdAt: -1 });

	return res.status(200).json({
		success: true,
		count: appointments.length,
		appointments
	});
});

const cancelMyAppointment = asyncHandler(async (req, res) => {
	if (req.user.role !== 'PATIENT') {
		throw new ApiError('Only PATIENT can cancel appointments', 403);
	}

	const { id } = req.params;
	if (!isValidObjectId(id)) {
		throw new ApiError('invalid appointment id', 400);
	}

	const appointment = await Appointment.findOne({ _id: id, patientId: req.user.id });
	if (!appointment) {
		throw new ApiError('Appointment not found', 404);
	}

	if (appointment.status === 'CONFIRMED') {
		throw new ApiError('confirmed appointments cannot be cancelled by patient', 400);
	}

	if (appointment.status === 'CANCELLED') {
		throw new ApiError('appointment is already cancelled', 400);
	}

	appointment.status = 'CANCELLED';
	await appointment.save();

	return res.status(200).json({
		success: true,
		message: 'Appointment cancelled successfully',
		appointment
	});
});

const rescheduleMyAppointment = asyncHandler(async (req, res) => {
	if (req.user.role !== 'PATIENT') {
		throw new ApiError('Only PATIENT can reschedule appointments', 403);
	}

	const { id } = req.params;
	const { date, time } = req.body;

	if (!isValidObjectId(id)) {
		throw new ApiError('invalid appointment id', 400);
	}

	if (!date || !time) {
		throw new ApiError('date and time are required', 400);
	}

	const appointment = await Appointment.findOne({ _id: id, patientId: req.user.id });
	if (!appointment) {
		throw new ApiError('Appointment not found', 404);
	}

	if (appointment.status !== 'PENDING') {
		throw new ApiError('only pending appointments can be rescheduled', 400);
	}

	appointment.date = String(date).trim();
	appointment.time = String(time).trim();
	await appointment.save();

	return res.status(200).json({
		success: true,
		message: 'Appointment rescheduled successfully',
		appointment
	});
});

const getMyDoctorAppointments = asyncHandler(async (req, res) => {
	if (req.user.role !== 'DOCTOR') {
		throw new ApiError('Only DOCTOR can view this endpoint', 403);
	}

	await ensureApprovedDoctor(req);

	const appointments = await Appointment.find({ doctorId: req.user.id }).sort({ date: 1, time: 1, createdAt: -1 });

	return res.status(200).json({
		success: true,
		count: appointments.length,
		appointments
	});
});

const getMyAppointmentStats = asyncHandler(async (req, res) => {
	if (req.user.role !== 'PATIENT') {
		throw new ApiError('Only PATIENT can view this endpoint', 403);
	}

	const appointments = await Appointment.find({ patientId: req.user.id }).select('date status');
	const today = new Date().toISOString().slice(0, 10);

	const stats = {
		todayAppointments: appointments.filter((a) => a.date === today).length,
		totalAppointments: appointments.length,
		pendingAppointments: appointments.filter((a) => a.status === 'PENDING').length,
		confirmedAppointments: appointments.filter((a) => a.status === 'CONFIRMED').length
	};

	return res.status(200).json({ success: true, stats });
});

const getAdminAppointmentOverview = asyncHandler(async (req, res) => {
	if (req.user.role !== 'ADMIN') {
		throw new ApiError('Only ADMIN can view this endpoint', 403);
	}

	const appointments = await Appointment.find({}).sort({ createdAt: -1 }).limit(200);
	const totalRevenue = appointments
		.filter((appointment) => appointment.paymentStatus === 'PAID')
		.reduce((sum, appointment) => sum + Number(appointment.consultationFee || 0), 0);

	const overview = {
		totalAppointments: appointments.length,
		pendingAppointments: appointments.filter((appointment) => appointment.status === 'PENDING').length,
		confirmedAppointments: appointments.filter((appointment) => appointment.status === 'CONFIRMED').length,
		completedAppointments: appointments.filter((appointment) => appointment.status === 'COMPLETED').length,
		paidAppointments: appointments.filter((appointment) => appointment.paymentStatus === 'PAID').length,
		unpaidAppointments: appointments.filter((appointment) => appointment.paymentStatus !== 'PAID').length,
		totalRevenue
	};

	return res.status(200).json({
		success: true,
		overview,
		appointments
	});
});

const getAppointmentById = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!isValidObjectId(id)) {
		throw new ApiError('invalid appointment id', 400);
	}

	const appointment = await Appointment.findById(id);
	if (!appointment) {
		throw new ApiError('Appointment not found', 404);
	}

	return res.status(200).json({ success: true, appointment });
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { status } = req.body;

	const doctor = await ensureApprovedDoctor(req);

	if (!isValidObjectId(id)) {
		throw new ApiError('invalid appointment id', 400);
	}

	if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
		throw new ApiError('invalid status value', 400);
	}

	const existingAppointment = await Appointment.findById(id).select('doctorId currency consultationFee');
	if (!existingAppointment) {
		throw new ApiError('Appointment not found', 404);
	}

	const updates = { status };
	if (status === 'CONFIRMED') {
		let confirmedFee = Number(doctor?.consultationFee || 0);
		if (confirmedFee <= 0) {
			const doctorByAppointment = await fetchDoctorByUserId(existingAppointment.doctorId, req.headers.authorization, {
				approvedOnly: false
			});
			confirmedFee = Number(doctorByAppointment?.consultationFee || 0);
		}

		if (confirmedFee <= 0) {
			throw new ApiError('set a valid consultation fee in doctor profile before confirming appointments', 400);
		}

		updates.consultationFee = confirmedFee;
		if (!existingAppointment.currency) {
			updates.currency = PAYHERE_CURRENCY;
		}
	}

	const appointment = await Appointment.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

	let notificationResult = null;
	if (status === 'COMPLETED') {
		notificationResult = await triggerAppointmentEventNotification({
			type: 'APPOINTMENT_COMPLETED',
			appointment,
			authHeader: req.headers.authorization,
			message: `Consultation completed for ${appointment.date} at ${appointment.time}`,
			recipients: [
				{
					userId: appointment.patientId,
					role: 'PATIENT',
					name: 'Patient',
					email: appointment.patientEmail,
					phone: appointment.patientContact
				},
				{
					userId: appointment.doctorId,
					role: 'DOCTOR',
					name: appointment.doctorName || 'Doctor',
					email: appointment.doctorEmail,
					phone: appointment.doctorContact
				}
			]
		});
	}

	const whatsappLink = Array.isArray(notificationResult?.delivery)
		? notificationResult.delivery.find((item) => item?.whatsappLink)?.whatsappLink || ''
		: '';


	return res.status(200).json({
		success: true,
		message: 'Appointment status updated successfully',
		appointment,
		notificationDelivery: notificationResult?.delivery || [],
		whatsappLink
	});
});

const updateVideoCall = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { videoCallUrl } = req.body;

	await ensureApprovedDoctor(req);

	if (!isValidObjectId(id)) {
		throw new ApiError('invalid appointment id', 400);
	}

	if (!videoCallUrl || !String(videoCallUrl).trim().startsWith('http')) {
		throw new ApiError('valid videoCallUrl is required', 400);
	}

	const existingAppointment = await Appointment.findById(id).select('status');
	if (!existingAppointment) {
		throw new ApiError('Appointment not found', 404);
	}

	if (existingAppointment.status !== 'CONFIRMED') {
		throw new ApiError('video call can be started only for confirmed appointments', 400);
	}

	const appointment = await Appointment.findByIdAndUpdate(
		id,
		{ videoCallUrl: String(videoCallUrl).trim(), videoCallStartedByDoctor: true },
		{ new: true, runValidators: true }
	);

	if (!appointment) {
		throw new ApiError('Appointment not found', 404);
	}

	return res.status(200).json({
		success: true,
		message: 'Video call URL updated successfully',
		appointment
	});
});

const hasPatientForDoctor = asyncHandler(async (req, res) => {
	if (req.user.role !== 'DOCTOR') {
		throw new ApiError('Only DOCTOR can access this endpoint', 403);
	}

	await ensureApprovedDoctor(req);

	const { patientUserId } = req.params;
	if (!isValidObjectId(patientUserId)) {
		throw new ApiError('invalid patient user id', 400);
	}

	const count = await Appointment.countDocuments({
		doctorId: req.user.id,
		patientId: patientUserId
	});

	return res.status(200).json({
		success: true,
		hasAccess: count > 0
	});
});

const issuePrescription = asyncHandler(async (req, res) => {
	await ensureApprovedDoctor(req);

	const { id } = req.params;
	const { prescriptionText } = req.body;

	if (!isValidObjectId(id)) {
		throw new ApiError('invalid appointment id', 400);
	}

	if (!prescriptionText || String(prescriptionText).trim().length < 5) {
		throw new ApiError('prescriptionText is required (min 5 characters)', 400);
	}

	const appointment = await Appointment.findByIdAndUpdate(
		id,
		{
			prescriptionText: String(prescriptionText).trim(),
			prescriptionIssuedAt: new Date()
		},
		{ new: true, runValidators: true }
	);

	if (!appointment) {
		throw new ApiError('Appointment not found', 404);
	}

	return res.status(200).json({
		success: true,
		message: 'Digital prescription issued successfully',
		appointment
	});
});

const createPayHereHash = ({ merchantId, orderId, amount, currency, merchantSecret }) => {
	const secretHash = resolvePayHereSecretHash(merchantSecret);
	return crypto
		.createHash('md5')
		.update(`${merchantId}${orderId}${amount}${currency}${secretHash}`)
		.digest('hex')
		.toUpperCase();
};

const verifyPayHereNotifyHash = ({ merchantId, orderId, payhereAmount, payhereCurrency, statusCode, merchantSecret, md5sig }) => {
	const secretHash = resolvePayHereSecretHash(merchantSecret);
	const localHash = crypto
		.createHash('md5')
		.update(`${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${secretHash}`)
		.digest('hex')
		.toUpperCase();

	return localHash === String(md5sig || '').toUpperCase();
};

const initiatePayHerePayment = asyncHandler(async (req, res) => {
	if (req.user.role !== 'PATIENT') {
		throw new ApiError('Only PATIENT can initiate payment', 403);
	}

	if (!PAYHERE_MERCHANT_ID || !PAYHERE_MERCHANT_SECRET) {
		throw new ApiError('PayHere merchant configuration is missing', 500);
	}

	const { id } = req.params;
	if (!isValidObjectId(id)) {
		throw new ApiError('invalid appointment id', 400);
	}

	const appointment = await Appointment.findOne({ _id: id, patientId: req.user.id });
	if (!appointment) {
		throw new ApiError('Appointment not found', 404);
	}

	if (appointment.status !== 'CONFIRMED') {
		throw new ApiError('payment can be made only for confirmed appointments', 400);
	}

	if (appointment.paymentStatus === 'PAID') {
		throw new ApiError('appointment is already paid', 400);
	}

	let payableConsultationFee = Number(appointment.consultationFee || 0);
	if (payableConsultationFee <= 0) {
		try {
			const doctor = await fetchDoctorByUserId(appointment.doctorId, req.headers.authorization, {
				approvedOnly: false
			});

			const doctorFee = Number(doctor?.consultationFee || 0);
			if (doctorFee > 0) {
				appointment.consultationFee = doctorFee;
				if (!appointment.currency) {
					appointment.currency = PAYHERE_CURRENCY;
				}
				await appointment.save();
				payableConsultationFee = doctorFee;
			}
		} catch (error) {
			// If doctor service lookup fails, keep current value and fall back to validation below.
		}
	}

	if (payableConsultationFee <= 0) {
		throw new ApiError('consultation fee is not set for this appointment. Ask doctor to update fee and rebook or retry payment.', 400);
	}

	const orderId = `AP${Date.now().toString().slice(-8)}${String(appointment._id).slice(-8)}`;
	const amount = Number(payableConsultationFee).toFixed(2);
	const currency = appointment.currency || PAYHERE_CURRENCY;
	const hash = createPayHereHash({
		merchantId: PAYHERE_MERCHANT_ID,
		orderId,
		amount,
		currency,
		merchantSecret: PAYHERE_MERCHANT_SECRET
	});

	appointment.paymentProvider = 'PAYHERE';
	appointment.paymentReference = orderId;
	appointment.paymentStatus = 'PENDING';
	await appointment.save();

	return res.status(200).json({
		success: true,
		payment: {
			provider: 'PAYHERE',
			checkoutUrl: PAYHERE_CHECKOUT_URL,
			payload: {
				merchant_id: PAYHERE_MERCHANT_ID,
				return_url: `${FRONTEND_URL}/dashboard/patient?tab=appointments`,
				cancel_url: `${FRONTEND_URL}/dashboard/patient?tab=appointments`,
				notify_url: PAYHERE_NOTIFY_URL,
				order_id: orderId,
				items: `Consultation Fee - ${appointment.doctorName || 'Doctor'}`,
				currency,
				amount,
				first_name: 'Patient',
				last_name: 'User',
				email: req.user.email || 'patient@example.com',
				phone: '0771234567',
				address: 'N/A',
				city: 'Colombo',
				country: 'Sri Lanka',
				hash,
				custom_1: String(appointment._id),
				custom_2: String(req.user.id)
			}
		}
	});
});

const handlePayHereNotify = asyncHandler(async (req, res) => {
	const {
		merchant_id: merchantId,
		order_id: orderId,
		payhere_amount: payhereAmount,
		payhere_currency: payhereCurrency,
		status_code: statusCode,
		md5sig
	} = req.body;

	if (!merchantId || !orderId || !statusCode) {
		return res.status(400).send('INVALID_NOTIFY_PAYLOAD');
	}

	if (String(merchantId) !== String(PAYHERE_MERCHANT_ID)) {
		return res.status(400).send('INVALID_MERCHANT');
	}

	const validHash = verifyPayHereNotifyHash({
		merchantId,
		orderId,
		payhereAmount,
		payhereCurrency,
		statusCode,
		merchantSecret: PAYHERE_MERCHANT_SECRET,
		md5sig
	});

	if (!validHash) {
		return res.status(400).send('INVALID_HASH');
	}

	const appointment = await Appointment.findOne({ paymentReference: String(orderId) });
	if (!appointment) {
		return res.status(404).send('APPOINTMENT_NOT_FOUND');
	}

	const successPayment = String(statusCode) === '2';
	appointment.paymentStatus = successPayment ? 'PAID' : 'FAILED';
	appointment.paymentMeta = req.body;
	if (successPayment) {
		appointment.paidAt = new Date();
	}
	await appointment.save();

	return res.status(200).send('OK');
});

module.exports = {
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
};
