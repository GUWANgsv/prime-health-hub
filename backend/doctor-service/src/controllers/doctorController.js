const mongoose = require('mongoose');

const Doctor = require('../models/Doctor');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const toStringList = (value = []) =>
	Array.isArray(value)
		? value.map((item) => String(item).trim()).filter(Boolean)
		: [];

const validateDoctorPayload = (payload, { partial = false } = {}) => {
	const required = ['specialization', 'experience'];
	const allowedSpecializations = Doctor.schema.path('specialization').enumValues;

	if (!partial) {
		for (const field of required) {
			if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
				throw new ApiError(`${field} is required`, 400);
			}
		}
	}

	if (payload.specialization !== undefined && String(payload.specialization).trim().length < 2) {
		throw new ApiError('specialization must be at least 2 characters', 400);
	}

	if (!partial && (!payload.doctorName || String(payload.doctorName).trim().length < 2)) {
		throw new ApiError('doctorName is required', 400);
	}

	if (!partial && (!payload.contact || String(payload.contact).trim().length < 6)) {
		throw new ApiError('contact is required', 400);
	}

	if (payload.contact !== undefined && String(payload.contact).trim().length < 6) {
		throw new ApiError('contact must be at least 6 characters', 400);
	}

	if (
		payload.specialization !== undefined &&
		!allowedSpecializations.includes(String(payload.specialization).trim())
	) {
		throw new ApiError('invalid specialization value', 400);
	}

	if (payload.experience !== undefined) {
		const experience = Number(payload.experience);
		if (Number.isNaN(experience) || experience < 0 || experience > 80) {
			throw new ApiError('experience must be a valid number between 0 and 80', 400);
		}
	}

	if (payload.consultationFee !== undefined) {
		const fee = Number(payload.consultationFee);
		if (Number.isNaN(fee) || fee <= 0 || fee > 1000000) {
			throw new ApiError('consultationFee must be a valid number greater than 0 and up to 1000000', 400);
		}
	}
};

const createDoctor = asyncHandler(async (req, res) => {
	if (req.user.role !== 'DOCTOR') {
		throw new ApiError('Only DOCTOR can create a doctor profile', 403);
	}

	validateDoctorPayload(req.body);

	const existing = await Doctor.findOne({ userId: req.user.id });
	if (existing) {
		throw new ApiError('doctor profile already exists for this user', 409);
	}

	const doctor = await Doctor.create({
		userId: req.user.id,
		doctorName: String(req.body.doctorName).trim(),
		contact: String(req.body.contact).trim(),
		specialization: String(req.body.specialization).trim(),
		experience: Number(req.body.experience),
		qualifications: toStringList(req.body.qualifications),
		rating: req.body.rating === undefined ? 0 : Number(req.body.rating),
		consultationFee: req.body.consultationFee === undefined ? 2500 : Number(req.body.consultationFee)
	});

	return res.status(201).json({
		success: true,
		message: 'Doctor profile created successfully',
		doctor
	});
});

const getMyDoctorProfile = asyncHandler(async (req, res) => {
	const userId = req.user.role === 'ADMIN' ? req.query.userId : req.user.id;

	if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError('valid userId is required', 400);
	}

	const doctor = await Doctor.findOne({ userId });
	if (!doctor) {
		throw new ApiError('doctor profile not found', 404);
	}

	return res.status(200).json({ success: true, doctor });
});

const getDoctors = asyncHandler(async (req, res) => {
	const filter = {};
	if (req.query.status) filter.status = req.query.status;
	if (req.query.approvedOnly === 'true') filter.status = 'APPROVED';
	if (req.query.specialization) {
		filter.specialization = { $regex: String(req.query.specialization), $options: 'i' };
	}
	if (req.query.name) {
		filter.doctorName = { $regex: String(req.query.name), $options: 'i' };
	}

	const doctors = await Doctor.find(filter).sort({ rating: -1, experience: -1, createdAt: -1 });

	return res.status(200).json({
		success: true,
		count: doctors.length,
		doctors
	});
});

const searchDoctors = asyncHandler(async (req, res) => {
	const { specialization } = req.query;
	if (!specialization) {
		throw new ApiError('specialization query is required', 400);
	}

	const doctors = await Doctor.find({
		specialization: { $regex: String(specialization), $options: 'i' },
		status: 'APPROVED'
	}).sort({ rating: -1, experience: -1 });

	return res.status(200).json({ success: true, count: doctors.length, doctors });
});

const getDoctorById = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('invalid doctor id', 400);
	}

	const doctor = await Doctor.findById(id);
	if (!doctor) {
		throw new ApiError('doctor profile not found', 404);
	}

	return res.status(200).json({ success: true, doctor });
});

const updateDoctor = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('invalid doctor id', 400);
	}

	if (req.user.role === 'DOCTOR') {
		const owned = await Doctor.findOne({ _id: id, userId: req.user.id }).select('_id');
		if (!owned) {
			throw new ApiError('you can only update your own doctor profile', 403);
		}
	}

	validateDoctorPayload(req.body, { partial: true });

	const updates = {};
	const fields = ['doctorName', 'contact', 'specialization', 'experience', 'qualifications', 'availability', 'rating', 'consultationFee'];
	for (const field of fields) {
		if (req.body[field] !== undefined) updates[field] = req.body[field];
	}

	if (updates.doctorName !== undefined) updates.doctorName = String(updates.doctorName).trim();
	if (updates.contact !== undefined) updates.contact = String(updates.contact).trim();
	if (updates.specialization !== undefined) updates.specialization = String(updates.specialization).trim();
	if (updates.experience !== undefined) updates.experience = Number(updates.experience);
	if (updates.qualifications !== undefined) updates.qualifications = toStringList(updates.qualifications);
	if (updates.rating !== undefined) updates.rating = Number(updates.rating);
	if (updates.consultationFee !== undefined) updates.consultationFee = Number(updates.consultationFee);

	const doctor = await Doctor.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
	if (!doctor) {
		throw new ApiError('doctor profile not found', 404);
	}

	return res.status(200).json({
		success: true,
		message: 'Doctor profile updated successfully',
		doctor
	});
});

const deleteDoctor = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('invalid doctor id', 400);
	}

	if (req.user.role === 'DOCTOR') {
		const owned = await Doctor.findOne({ _id: id, userId: req.user.id }).select('_id');
		if (!owned) {
			throw new ApiError('you can only delete your own doctor profile', 403);
		}
	}

	const removed = await Doctor.findByIdAndDelete(id);
	if (!removed) {
		throw new ApiError('doctor profile not found', 404);
	}

	return res.status(200).json({
		success: true,
		message: 'Doctor profile deleted successfully'
	});
});

const approveDoctor = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('invalid doctor id', 400);
	}

	const doctor = await Doctor.findByIdAndUpdate(
		id,
		{ status: 'APPROVED' },
		{ new: true, runValidators: true }
	);

	if (!doctor) {
		throw new ApiError('doctor profile not found', 404);
	}

	return res.status(200).json({
		success: true,
		message: 'Doctor approved successfully',
		doctor
	});
});

module.exports = {
	createDoctor,
	getMyDoctorProfile,
	getDoctors,
	searchDoctors,
	getDoctorById,
	updateDoctor,
	deleteDoctor,
	approveDoctor
};
