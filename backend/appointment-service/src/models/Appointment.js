const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
	{
		patientId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			index: true
		},
		doctorId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			index: true
		},
		doctorProfileId: {
			type: mongoose.Schema.Types.ObjectId,
			required: false,
			index: true
		},
		doctorName: {
			type: String,
			trim: true,
			default: ''
		},
		doctorEmail: {
			type: String,
			trim: true,
			default: ''
		},
		doctorContact: {
			type: String,
			trim: true,
			default: ''
		},
		specialization: {
			type: String,
			trim: true,
			default: ''
		},
		patientEmail: {
			type: String,
			trim: true,
			default: ''
		},
		patientContact: {
			type: String,
			trim: true,
			default: ''
		},
		date: {
			type: String,
			required: true,
			trim: true
		},
		time: {
			type: String,
			required: true,
			trim: true
		},
		reason: {
			type: String,
			trim: true,
			default: ''
		},
		consultationFee: {
			type: Number,
			min: 0,
			default: 0
		},
		currency: {
			type: String,
			trim: true,
			default: 'LKR'
		},
		status: {
			type: String,
			enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
			default: 'PENDING',
			index: true
		},
		videoCallUrl: {
			type: String,
			trim: true,
			default: ''
		},
		videoCallStartedByDoctor: {
			type: Boolean,
			default: false
		},
		prescriptionText: {
			type: String,
			trim: true,
			default: ''
		},
		prescriptionIssuedAt: {
			type: Date,
			default: null
		},
		paymentStatus: {
			type: String,
			enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'],
			default: 'UNPAID',
			index: true
		},
		paymentProvider: {
			type: String,
			trim: true,
			default: ''
		},
		paymentReference: {
			type: String,
			trim: true,
			default: ''
		},
		paidAt: {
			type: Date,
			default: null
		},
		paymentMeta: {
			type: mongoose.Schema.Types.Mixed,
			default: null
		}
	},
	{ timestamps: true }
);

appointmentSchema.index({ doctorId: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
