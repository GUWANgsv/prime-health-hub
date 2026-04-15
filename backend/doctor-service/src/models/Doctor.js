const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      trim: true
    },
    timeSlots: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    contact: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30
    },
    specialization: {
  type: String,
  required: true,
  trim: true,
  enum: [
    // Primary & General Care
    'General Practice',
    'Family Medicine',
    'Internal Medicine',
    'Pediatrics',
    'Geriatrics',

    // Medical Specialties (Non-Surgical)
    'Cardiology',
    'Dermatology',
    'Endocrinology',
    'Gastroenterology',
    'Hematology',
    'Infectious Disease',
    'Nephrology',
    'Neurology',
    'Oncology',
    'Pulmonology',
    'Rheumatology',
    'Psychiatry',

    // Surgical Specialties
    'General Surgery',
    'Neurosurgery',
    'Orthopedic Surgery',
    'Plastic Surgery',
    'Vascular Surgery',
    'Cardiothoracic Surgery',
    'Urology',

    // Women & Children
    'Obstetrics & Gynecology (OB/GYN)',
    'Neonatology',
    'Pediatric Surgery',

    // Specialized Organs
    'Ophthalmology',
    'Otolaryngology (ENT)',
    'Dentistry',

    // Diagnostic & Emergency
    'Radiology',
    'Pathology',
    'Anesthesiology',
    'Emergency Medicine',

    // Rehabilitation & Others
    'Physical Medicine & Rehabilitation',
    'Sports Medicine',
    'Pain Management',
    'Immunology',
    'Allergy Medicine'
  ]
},

    experience: {
      type: Number,
      required: true,
      min: 0,
      max: 80
    },
    qualifications: {
      type: [String],
      default: []
    },
    availability: {
      type: [availabilitySchema],
      default: []
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED'],
      default: 'PENDING'
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    consultationFee: {
      type: Number,
      min: 0,
      default: 2500
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);
