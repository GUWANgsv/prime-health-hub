const AIAnalysis = require('../models/AIAnalysis');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/apiError');
const { analyzeSymptoms } = require('../utils/geminiClient');

const analyze = asyncHandler(async (req, res) => {
  const { symptoms, userId } = req.body;

  if (!symptoms || String(symptoms).trim().length === 0) {
    throw new ApiError('symptoms field is required', 400);
  }

  if (String(symptoms).trim().length < 5) {
    throw new ApiError('symptoms must be at least 5 characters', 400);
  }

  if (String(symptoms).trim().length > 2000) {
    throw new ApiError('symptoms must not exceed 2000 characters', 400);
  }

  let analysisRecord;

  try {
    const { aiResponse, rawResponse } = await analyzeSymptoms(String(symptoms).trim());

    analysisRecord = await AIAnalysis.create({
      userId: userId,
      symptoms: String(symptoms).trim(),
      aiResponse,
      status: 'SUCCESS'
    });

    return res.status(200).json({
      success: true,
      message: 'Symptom analysis completed successfully',
      analysis: {
        id: analysisRecord._id,
        symptoms: analysisRecord.symptoms,
        possibleConditions: aiResponse.possibleConditions,
        recommendedSpecializations: aiResponse.recommendedSpecializations,
        description: aiResponse.description,
        advice: aiResponse.advice,
        timestamp: analysisRecord.createdAt
      }
    });
  } catch (error) {
    if (analysisRecord) {
      analysisRecord.status = 'FAILED';
      await analysisRecord.save();
    } else {
      try {
        await AIAnalysis.create({
          userId: userId,
          symptoms: String(symptoms).trim(),
          status: 'FAILED'
        });
      } catch (logError) {
        console.error('Failed to log analysis error:', logError.message);
      }
    }

    throw new ApiError(error.message || 'Failed to analyze symptoms', 500);
  }
});

module.exports = {
  analyze
};
