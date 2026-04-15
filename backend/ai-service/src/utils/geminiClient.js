const axios = require('axios');

const GEMINI_API_VERSION = process.env.GEMINI_API_VERSION || 'v1beta';
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models`;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

const stripModelPrefix = (modelName = '') => String(modelName).replace(/^models\//, '');

const normalizeModelName = (modelName = '') => {
  const name = stripModelPrefix(String(modelName || '').trim());
  if (!name) {
    return 'gemini-1.5-flash';
  }

  // Backward compatibility for accidentally configured unsupported names.
  if (name === 'gemini-3-flash') return 'gemini-2.0-flash';
  if (name === 'gemini-3-pro') return 'gemini-1.5-pro';

  return name;
};

const listGenerateContentModels = async (apiKey) => {
  const response = await axios.get(`${GEMINI_BASE_URL}?key=${apiKey}`, {
    timeout: 15000
  });

  const models = Array.isArray(response?.data?.models) ? response.data.models : [];
  return models
    .filter((model) => Array.isArray(model?.supportedGenerationMethods) && model.supportedGenerationMethods.includes('generateContent'))
    .map((model) => stripModelPrefix(model.name))
    .filter(Boolean);
};

const buildModelCandidates = async (apiKey) => {
  const configuredCandidates = [normalizeModelName(GEMINI_MODEL), ...GEMINI_FALLBACK_MODELS.map(normalizeModelName)].filter(
    (model, index, arr) => model && arr.indexOf(model) === index
  );

  try {
    const availableModels = await listGenerateContentModels(apiKey);
    if (!availableModels.length) {
      return configuredCandidates;
    }

    const preferredAvailable = configuredCandidates.filter((model) => availableModels.includes(model));
    const remainingAvailable = availableModels.filter((model) => !preferredAvailable.includes(model));
    const candidates = [...preferredAvailable, ...remainingAvailable];

    return candidates.length ? candidates : configuredCandidates;
  } catch {
    return configuredCandidates;
  }
};

const buildAnalysisPrompt = (symptoms) => {
  return `You are an expert medical assistant AI trained to help patients understand their symptoms. 
  
A patient reports the following symptoms: "${symptoms}"

Please provide a medical analysis with:

1. **Possible Conditions**: List 3-5 medical conditions that could be associated with these symptoms.
2. **Recommended Specializations**: Recommend 2-3 medical doctor specializations that would be most relevant to examine these symptoms.
3. **Additional Advice**: Provide brief, general health advice for managing these symptoms (reminder: this is not a diagnosis).

Format your response as follows:
CONDITIONS: [List conditions separated by commas]
SPECIALIZATIONS: [List specializations separated by commas]
DESCRIPTION: [Brief description of what these symptoms might indicate]
ADVICE: [General health advice]

Remember: This is for informational purposes only and should not replace professional medical consultation.`;
};

const parseGeminiResponse = (text) => {
  const response = {
    possibleConditions: [],
    recommendedSpecializations: [],
    description: '',
    advice: ''
  };

  const conditionsMatch = text.match(/CONDITIONS:\s*([^\n]+)/i);
  if (conditionsMatch) {
    response.possibleConditions = conditionsMatch[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const specializationsMatch = text.match(/SPECIALIZATIONS:\s*([^\n]+)/i);
  if (specializationsMatch) {
    response.recommendedSpecializations = specializationsMatch[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const descriptionMatch = text.match(/DESCRIPTION:\s*([^\n]+)/);
  if (descriptionMatch) {
    response.description = descriptionMatch[1].trim();
  }

  const adviceMatch = text.match(/ADVICE:\s*([^\n]+)/);
  if (adviceMatch) {
    response.advice = adviceMatch[1].trim();
  }

  return response;
};

const analyzeSymptoms = async (symptoms) => {
  if (!symptoms || String(symptoms).trim().length === 0) {
    throw new Error('Symptoms cannot be empty');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const prompt = buildAnalysisPrompt(symptoms);
  const modelCandidates = await buildModelCandidates(apiKey);

  try {
    let response;
    let lastModelError;

    for (const modelName of modelCandidates) {
      try {
        response = await axios.post(
          `${GEMINI_BASE_URL}/${modelName}:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          },
          {
            timeout: 30000
          }
        );

        if (response?.data?.candidates?.length) {
          break;
        }
      } catch (candidateError) {
        lastModelError = candidateError;
      }
    }

    if (!response?.data?.candidates || response.data.candidates.length === 0) {
      if (lastModelError?.response) {
        throw new Error(
          `Gemini API error: ${lastModelError.response.status} - ${lastModelError.response.data?.error?.message || lastModelError.message}`
        );
      }

      throw new Error('No response from Gemini API');
    }

    const generatedText = response.data.candidates[0].content.parts[0].text || '';
    const parsedResponse = parseGeminiResponse(generatedText);

    return {
      success: true,
      aiResponse: parsedResponse,
      rawResponse: generatedText
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`Gemini API error: ${error.response.status} - ${error.response.data?.error?.message || error.message}`);
    }

    throw new Error(`Failed to call Gemini API: ${error.message}`);
  }
};

module.exports = {
  analyzeSymptoms,
  parseGeminiResponse,
  buildAnalysisPrompt
};
