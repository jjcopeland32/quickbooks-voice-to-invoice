const axios = require('axios');

/**
 * OpenAI API integration for text processing and professionalization
 * Uses GPT-3.5-turbo with retry mechanism
 */
class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Refine text using OpenAI GPT-3.5-turbo
   * Professionalizes the text for business purposes
   * 
   * @param {String} text - Input text to refine
   * @returns {Promise<String>} Refined text
   */
  async refineText(text) {
    const prompt = `Please professionalize the following text for a business invoice, maintaining all factual information but making it sound more professional: "${text}"`;
    
    return this.makeOpenAIRequest(prompt);
  }

  /**
   * Process voice recognition results into structured data
   * Extracts relevant information for invoice creation
   * 
   * @param {String} text - Voice recognition text
   * @param {String} field - The specific field to extract (customerName, serviceDescription, amount, dueDate, notes)
   * @returns {Promise<String>} Processed text for the specified field
   */
  async processVoiceToField(text, field) {
    let prompt;
    
    switch (field) {
      case 'customerName':
        prompt = `Extract only the customer name from the following text: "${text}". Return only the name, nothing else.`;
        break;
      case 'serviceDescription':
        prompt = `Extract a concise service description from the following text: "${text}". Make it professional and clear, return only the description, nothing else.`;
        break;
      case 'amount':
        prompt = `Extract the numerical amount from the following text: "${text}". Return only the number in format like 100 or 100.00 with no currency symbols, nothing else.`;
        break;
      case 'dueDate':
        prompt = `Extract the due date from the following text: "${text}". Format it as YYYY-MM-DD, return only the date, nothing else.`;
        break;
      case 'notes':
        prompt = `Extract any additional notes or comments from the following text: "${text}". Summarize them professionally, return only the notes, nothing else.`;
        break;
      default:
        throw new Error('Invalid field specified');
    }
    
    return this.makeOpenAIRequest(prompt);
  }

  /**
   * Make a request to OpenAI API with retry mechanism
   * 
   * @param {String} prompt - The prompt to send to OpenAI
   * @returns {Promise<String>} OpenAI response text
   */
  async makeOpenAIRequest(prompt, retryCount = 0) {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that processes text for business invoices.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 150
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error(`OpenAI API error (attempt ${retryCount + 1}):`, error.message);
      
      // Retry logic
      if (retryCount < this.maxRetries) {
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, retryCount);
        console.log(`Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeOpenAIRequest(prompt, retryCount + 1);
      }
      
      throw new Error('Failed to process text with OpenAI after multiple retries');
    }
  }
}

module.exports = new OpenAIService(); 