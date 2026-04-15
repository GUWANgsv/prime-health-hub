const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true
    },
    symptoms: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    aiResponse: {
      possibleConditions: [String],
      recommendedSpecializations: [String],
      description: String,
      advice: String
    },
    geminiModel: {
      type: String,
      default: 'gemini-pro'
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED'],
      default: 'SUCCESS'
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

module.exports = mongoose.model('AIAnalysis', analysisSchema);
