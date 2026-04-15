const bcrypt = require('bcryptjs');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:4003';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:4002';

const ROLES = ['PATIENT', 'DOCTOR', 'ADMIN'];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const signToken = (user) =>
	jwt.sign(
		{
			id: user._id,
			email: user.email,
			role: user.role
		},
		process.env.JWT_SECRET,
		{ expiresIn: '1d' }
	);

const sanitizeUser = (user) => ({
	id: user._id,
	name: user.name,
	email: user.email,
	role: user.role,
	createdAt: user.createdAt
});

const register = asyncHandler(async (req, res) => {
	const { name, email, password, role } = req.body;

	if (!name || !email || !password) {
		throw new ApiError('name, email and password are required', 400);
	}

	if (!isValidEmail(email)) {
		throw new ApiError('email format is invalid', 400);
	}

	if (String(password).length < 6) {
		throw new ApiError('password must be at least 6 characters long', 400);
	}

	if (role && !ROLES.includes(role)) {
		throw new ApiError('role must be one of PATIENT, DOCTOR, ADMIN', 400);
	}

	const existingUser = await User.findOne({ email: email.toLowerCase() });
	if (existingUser) {
		throw new ApiError('user already exists with this email', 409);
	}

	const hashedPassword = await bcrypt.hash(password, 10);
	const user = await User.create({
		name: String(name).trim(),
		email: email.toLowerCase(),
		password: hashedPassword,
		role: role || 'PATIENT'
	});

	return res.status(201).json({
		success: true,
		message: 'user registered successfully',
		user: sanitizeUser(user)
	});
});

const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		throw new ApiError('email and password are required', 400);
	}

	const user = await User.findOne({ email: email.toLowerCase() });
	if (!user) {
		throw new ApiError('invalid email or password', 401);
	}

	const valid = await bcrypt.compare(password, user.password);
	if (!valid) {
		throw new ApiError('invalid email or password', 401);
	}

	const token = signToken(user);

	return res.status(200).json({
		success: true,
		message: 'login successful',
		token,
		user: sanitizeUser(user)
	});
});

const getProfile = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user.id).select('-password');
	if (!user) {
		throw new ApiError('user not found', 404);
	}

	return res.status(200).json({
		success: true,
		user: sanitizeUser(user)
	});
});

const getUserById = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!id || !mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('valid user id is required', 400);
	}

	const user = await User.findById(id).select('-password');
	if (!user) {
		throw new ApiError('user not found', 404);
	}

	return res.status(200).json({
		success: true,
		user: sanitizeUser(user)
	});
});

const updateProfile = asyncHandler(async (req, res) => {
	const { name, email, password } = req.body;
	const user = await User.findById(req.user.id);

	if (!user) {
		throw new ApiError('user not found', 404);
	}

	if (name !== undefined) {
		if (String(name).trim().length < 2) {
			throw new ApiError('name must be at least 2 characters', 400);
		}
		user.name = String(name).trim();
	}

	if (email !== undefined) {
		if (!isValidEmail(String(email))) {
			throw new ApiError('email format is invalid', 400);
		}
		const existing = await User.findOne({ email: String(email).toLowerCase(), _id: { $ne: user._id } });
		if (existing) {
			throw new ApiError('another user already exists with this email', 409);
		}
		user.email = String(email).toLowerCase();
	}

	if (password !== undefined && String(password).trim().length > 0) {
		if (String(password).length < 6) {
			throw new ApiError('password must be at least 6 characters long', 400);
		}
		user.password = await bcrypt.hash(String(password), 10);
	}

	await user.save();

	return res.status(200).json({
		success: true,
		message: 'profile updated successfully',
		user: sanitizeUser(user)
	});
});

const listUsers = asyncHandler(async (req, res) => {
	const { role, search } = req.query;
	const filter = {};

	if (role && ROLES.includes(String(role))) {
		filter.role = String(role);
	}

	if (search && String(search).trim()) {
		const term = String(search).trim();
		filter.$or = [
			{ name: { $regex: term, $options: 'i' } },
			{ email: { $regex: term, $options: 'i' } }
		];
	}

	const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

	return res.status(200).json({
		success: true,
		count: users.length,
		users: users.map(sanitizeUser)
	});
});

const updateUserById = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { name, email, role } = req.body;

	if (!id || !mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('valid user id is required', 400);
	}

	const user = await User.findById(id);
	if (!user) {
		throw new ApiError('user not found', 404);
	}

	if (name !== undefined) {
		if (String(name).trim().length < 2) {
			throw new ApiError('name must be at least 2 characters', 400);
		}
		user.name = String(name).trim();
	}

	if (email !== undefined) {
		if (!isValidEmail(String(email))) {
			throw new ApiError('email format is invalid', 400);
		}
		const existing = await User.findOne({ email: String(email).toLowerCase(), _id: { $ne: user._id } });
		if (existing) {
			throw new ApiError('another user already exists with this email', 409);
		}
		user.email = String(email).toLowerCase();
	}

	if (role !== undefined) {
		if (!ROLES.includes(String(role))) {
			throw new ApiError('role must be one of PATIENT, DOCTOR, ADMIN', 400);
		}
		user.role = String(role);
	}

	await user.save();

	return res.status(200).json({
		success: true,
		message: 'user updated successfully',
		user: sanitizeUser(user)
	});
});

const deleteUserById = asyncHandler(async (req, res) => {
	const { id } = req.params;

	if (!id || !mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError('valid user id is required', 400);
	}

	const user = await User.findById(id);
	if (!user) {
		throw new ApiError('user not found', 404);
	}

	const authHeader = req.headers.authorization;

	try {
		if (user.role === 'DOCTOR') {
			const doctorRes = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors/me`, {
				params: { userId: user._id },
				headers: authHeader ? { Authorization: authHeader } : undefined
			});
			if (doctorRes.data?.doctor?._id) {
				await axios.delete(`${DOCTOR_SERVICE_URL}/api/doctors/${doctorRes.data.doctor._id}`, {
					headers: authHeader ? { Authorization: authHeader } : undefined
				});
			}
		}

		if (user.role === 'PATIENT') {
			const patientRes = await axios.get(`${PATIENT_SERVICE_URL}/api/patients/me`, {
				params: { userId: user._id },
				headers: authHeader ? { Authorization: authHeader } : undefined
			});
			if (patientRes.data?.patient?._id) {
				await axios.delete(`${PATIENT_SERVICE_URL}/api/patients/${patientRes.data.patient._id}`, {
					headers: authHeader ? { Authorization: authHeader } : undefined
				});
			}
		}
	} catch (error) {
		// Keep delete going even if linked profile cleanup fails.
		console.error('Linked profile cleanup failed:', error.message);
	}

	await User.findByIdAndDelete(user._id);

	return res.status(200).json({
		success: true,
		message: 'user deleted successfully'
	});
});

module.exports = {
	register,
	login,
	getProfile,
	getUserById,
	updateProfile,
	listUsers,
	updateUserById,
	deleteUserById
};
