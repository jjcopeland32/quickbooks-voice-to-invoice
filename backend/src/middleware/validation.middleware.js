const Joi = require('joi');

/**
 * Validate invoice input data
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const validateInvoiceInput = (req, res, next) => {
  const schema = Joi.object({
    customerName: Joi.string().required().trim().max(100)
      .messages({
        'string.empty': 'Customer name is required',
        'string.max': 'Customer name must be less than 100 characters'
      }),
    serviceDescription: Joi.string().required().trim().max(4000)
      .messages({
        'string.empty': 'Service description is required',
        'string.max': 'Service description must be less than 4000 characters'
      }),
    amount: Joi.number().required().precision(2).min(0)
      .messages({
        'number.base': 'Amount must be a number',
        'number.empty': 'Amount is required',
        'number.min': 'Amount must be greater than or equal to 0',
        'number.precision': 'Amount must have at most 2 decimal places'
      }),
    dueDate: Joi.date().required().iso()
      .messages({
        'date.base': 'Due date must be a valid date',
        'date.empty': 'Due date is required',
        'date.format': 'Due date must be in YYYY-MM-DD format'
      }),
    notes: Joi.string().allow('', null).max(4000)
      .messages({
        'string.max': 'Notes must be less than 4000 characters'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      error: {
        message: errorMessages,
        status: 400
      }
    });
  }

  // Sanitize input (Trim strings)
  Object.keys(value).forEach(key => {
    if (typeof value[key] === 'string') {
      value[key] = value[key].trim();
    }
  });

  req.body = value;
  next();
};

/**
 * Validate signup input data
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const validateSignupInput = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().required().email().trim().lowercase()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email'
      }),
    password: Joi.string().required().min(8)
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long'
      }),
    firstName: Joi.string().allow('', null).trim()
      .messages({
        'string.empty': 'First name cannot be empty'
      }),
    lastName: Joi.string().allow('', null).trim()
      .messages({
        'string.empty': 'Last name cannot be empty'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      error: {
        message: errorMessages,
        status: 400
      }
    });
  }

  // Sanitize input (Trim strings)
  Object.keys(value).forEach(key => {
    if (typeof value[key] === 'string') {
      value[key] = value[key].trim();
    }
  });

  req.body = value;
  next();
};

/**
 * Validate login input data
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const validateLoginInput = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().required().email().trim().lowercase()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email'
      }),
    password: Joi.string().required()
      .messages({
        'string.empty': 'Password is required'
      })
  });

  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message).join(', ');
    return res.status(400).json({
      error: {
        message: errorMessages,
        status: 400
      }
    });
  }

  // Sanitize input (Trim strings)
  Object.keys(value).forEach(key => {
    if (typeof value[key] === 'string') {
      value[key] = value[key].trim();
    }
  });

  req.body = value;
  next();
};

module.exports = {
  validateInvoiceInput,
  validateSignupInput,
  validateLoginInput
}; 