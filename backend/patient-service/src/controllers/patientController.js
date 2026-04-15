const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const resolveReportAbsolutePath = (storedPath) => {
	if (!storedPath) return null;
	return path.isAbsolute(storedPath)
		? storedPath
		: path.resolve(path.join(__dirname, '..', '..', storedPath));
};

const appendReportDownloadPath = (patientId, report, forDoctor = false, userId = null) => {
	if (!report || !report._id) {
		return report;
	}

	const reportObject = report.toObject ? report.toObject() : { ...report };
	reportObject.downloadPath = forDoctor
		? `/api/patients/by-user/${userId}/reports/${reportObject._id}/download/doctor`
		: `/api/patients/${patientId}/reports/${reportObject._id}/download`;
	return reportObject;
};

const toStringList = (value = []) =>
	Array.isArray(value)
		? value.map((item) => String(item).trim()).filter(Boolean)
		: [];

const validateBasePayload = (payload, { partial = false } = {}) => {
	const required = ['age', 'gender', 'contact', 'address'];

	if (!partial) {
		for (const field of required) {
			if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
				throw new ApiError(`${field} is required`, 400);
			}
		}
	}

	if (payload.age !== undefined) {
		const age = Number(payload.age);
		if (Number.isNaN(age) || age < 0 || age > 130) {
			throw new ApiError('age must be a valid number between 0 and 130', 400);
		}
	}

	if (payload.gender !== undefined && !['MALE', 'FEMALE', 'OTHER'].includes(payload.gender)) {
		throw new ApiError('gender must be MALE, FEMALE or OTHER', 400);
	}
};

const createPatient = asyncHandler(async (req, res) => {
	validateBasePayload(req.body);

	const finalUserId = req.user.role === 'PATIENT' ? req.user.id : req.body.userId;

	if (!finalUserId || !mongoose.Types.ObjectId.isValid(finalUserId)) {
		throw new ApiError('valid userId is required', 400);
	}

	const existing = await Patient.findOne({ userId: finalUserId });
	if (existing) {
		throw new ApiError('patient profile already exists for this user', 409);
	}

	const patient = await Patient.create({
		userId: finalUserId,
		age: Number(req.body.age),
		gender: req.body.gender,
		contact: String(req.body.contact).trim(),
		address: String(req.body.address).trim(),
		medicalHistory: toStringList(req.body.medicalHistory),
		allergies: toStringList(req.body.allergies),
		chronicConditions: toStringList(req.body.chronicConditions)
	});

	return res.status(201).json({
		success: true,
		message: 'Patient profile created successfully',
		patient
	});
});

const getMyPatientProfile = asyncHandler(async (req, res) => {
	const userId = req.user.role === 'ADMIN' ? req.query.userId : req.user.id;
	if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError('valid userId is required', 400);
	}

	const patient = await Patient.findOne({ userId });
	if (!patient) {
		throw new ApiError('patient profile not found', 404);
	}

	return res.status(200).json({ success: true, patient });
});

const getPatientById = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('invalid patient id', 400);
	}

	const patient = await Patient.findById(id);
	if (!patient) {
		throw new ApiError('patient profile not found', 404);
	}

	return res.status(200).json({ success: true, patient });
});

const updatePatient = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('invalid patient id', 400);
	}

	if (req.body.gender !== undefined) {
		throw new ApiError('gender cannot be updated once profile is created', 400);
	}

	validateBasePayload(req.body, { partial: true });

	const updates = {};
	const fields = ['age', 'contact', 'address', 'medicalHistory', 'allergies', 'chronicConditions'];
	for (const field of fields) {
		if (req.body[field] !== undefined) updates[field] = req.body[field];
	}

	if (updates.age !== undefined) updates.age = Number(updates.age);
	if (updates.contact !== undefined) updates.contact = String(updates.contact).trim();
	if (updates.address !== undefined) updates.address = String(updates.address).trim();
	if (updates.medicalHistory !== undefined) updates.medicalHistory = toStringList(updates.medicalHistory);
	if (updates.allergies !== undefined) updates.allergies = toStringList(updates.allergies);
	if (updates.chronicConditions !== undefined) updates.chronicConditions = toStringList(updates.chronicConditions);

	const patient = await Patient.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
	if (!patient) {
		throw new ApiError('patient profile not found', 404);
	}

	return res.status(200).json({
		success: true,
		message: 'Patient profile updated successfully',
		patient
	});
});

const deletePatient = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('invalid patient id', 400);
	}

	const removed = await Patient.findByIdAndDelete(id);
	if (!removed) {
		throw new ApiError('patient profile not found', 404);
	}

	return res.status(200).json({ success: true, message: 'Patient profile deleted successfully' });
});

const addReport = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const reportFile = req.file;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('invalid patient id', 400);
	}

	if (!reportFile) {
		throw new ApiError('report file is required', 400);
	}

	const patient = await Patient.findByIdAndUpdate(
		id,
		{
			$push: {
				reports: {
					fileName: String(reportFile.originalname).trim(),
					fileType: String(reportFile.mimetype || 'application/octet-stream').trim(),
					storedFileName: String(reportFile.filename).trim(),
					filePath: String(reportFile.path).trim(),
					fileSize: Number(reportFile.size || 0),
					uploadedAt: new Date()
				}
			}
		},
		{ new: true, runValidators: true }
	);

	if (!patient) {
		if (reportFile.path) {
			fs.unlink(reportFile.path, () => {});
		}
		throw new ApiError('patient profile not found', 404);
	}

	return res.status(200).json({
		success: true,
		message: 'Medical report uploaded successfully',
		reports: patient.reports
	});
});

const getReports = asyncHandler(async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('invalid patient id', 400);
	}

	const patient = await Patient.findById(id).select('medicalHistory allergies chronicConditions reports');
	if (!patient) {
		throw new ApiError('patient profile not found', 404);
	}

	return res.status(200).json({
		success: true,
		medicalHistory: patient.medicalHistory,
		allergies: patient.allergies,
		chronicConditions: patient.chronicConditions,
		reports: patient.reports.map((report) => appendReportDownloadPath(id, report))
	});
});

const getReportsByUserId = asyncHandler(async (req, res) => {
	const { userId } = req.params;
	if (!mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError('invalid patient user id', 400);
	}

	const patient = await Patient.findOne({ userId }).select('medicalHistory allergies chronicConditions reports');
	if (!patient) {
		throw new ApiError('patient profile not found', 404);
	}

	return res.status(200).json({
		success: true,
		medicalHistory: patient.medicalHistory,
		allergies: patient.allergies,
		chronicConditions: patient.chronicConditions,
		reports: patient.reports.map((report) => appendReportDownloadPath(patient._id, report, true, userId))
	});
});

const downloadReport = asyncHandler(async (req, res) => {
	const { id, reportId } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reportId)) {
		throw new ApiError('invalid patient/report id', 400);
	}

	const patient = await Patient.findById(id).select('reports');
	if (!patient) {
		throw new ApiError('patient profile not found', 404);
	}

	const report = patient.reports.find((item) => String(item._id) === String(reportId));
	if (!report) {
		throw new ApiError('report not found', 404);
	}

	const absPath = resolveReportAbsolutePath(report.filePath);
	if (!absPath || !fs.existsSync(absPath)) {
		throw new ApiError('report file missing from storage', 404);
	}

	return res.download(absPath, report.fileName);
});

const downloadReportByUserId = asyncHandler(async (req, res) => {
	const { userId, reportId } = req.params;
	if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(reportId)) {
		throw new ApiError('invalid patient user/report id', 400);
	}

	const patient = await Patient.findOne({ userId }).select('reports');
	if (!patient) {
		throw new ApiError('patient profile not found', 404);
	}

	const report = patient.reports.find((item) => String(item._id) === String(reportId));
	if (!report) {
		throw new ApiError('report not found', 404);
	}

	const absPath = resolveReportAbsolutePath(report.filePath);
	if (!absPath || !fs.existsSync(absPath)) {
		throw new ApiError('report file missing from storage', 404);
	}

	return res.download(absPath, report.fileName);
});

module.exports = {
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
};
