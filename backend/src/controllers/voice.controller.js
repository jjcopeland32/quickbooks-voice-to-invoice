const openAIService = require('../utils/openai.util');
const { sanitizeInput } = require('../middleware/validation.middleware');

/**
 * Process voice input
 * Takes raw voice text and processes it for a specific field
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Processed field value
 */
const processVoice = async (req, res) => {
  try {
    const { text, field } = req.body;
    
    if (!text || !field) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameters: text and field',
          status: 400
        }
      });
    }
    
    // Sanitize the input text
    const sanitizedText = sanitizeInput(text);
    
    // Valid fields check
    const validFields = ['customerName', 'serviceDescription', 'amount', 'dueDate', 'notes'];
    if (!validFields.includes(field)) {
      return res.status(400).json({
        error: {
          message: `Invalid field: ${field}. Must be one of: ${validFields.join(', ')}`,
          status: 400
        }
      });
    }
    
    // Process the voice input for the specific field
    const processedValue = await openAIService.processVoiceToField(sanitizedText, field);
    
    return res.status(200).json({
      status: 'success',
      data: {
        field,
        value: processedValue
      }
    });
  } catch (error) {
    console.error('Error processing voice input:', error.message);
    return res.status(500).json({
      error: {
        message: 'Error processing voice input',
        status: 500,
        details: error.message
      }
    });
  }
};

/**
 * Refine text using OpenAI
 * Makes text more professional for business purposes
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Refined text
 */
const refineText = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: {
          message: 'Missing required parameter: text',
          status: 400
        }
      });
    }
    
    // Sanitize the input text
    const sanitizedText = sanitizeInput(text);
    
    // Refine the text using OpenAI
    const refinedText = await openAIService.refineText(sanitizedText);
    
    return res.status(200).json({
      status: 'success',
      data: {
        original: text,
        refined: refinedText
      }
    });
  } catch (error) {
    console.error('Error refining text:', error.message);
    return res.status(500).json({
      error: {
        message: 'Error refining text',
        status: 500,
        details: error.message
      }
    });
  }
};

module.exports = {
  processVoice,
  refineText
}; 