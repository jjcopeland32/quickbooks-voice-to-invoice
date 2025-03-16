/**
 * Enhanced Test script for the QuickBooks Voice-to-Invoice APIs
 * This script provides more realistic mock API functionality for testing
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3030;

// Import required middlewares
app.use(express.json());
// Configure CORS to allow requests from all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// In-memory database for testing
const mockDb = {
  users: [],
  invoices: []
};

// Add some initial data
mockDb.users.push({
  id: '123456789',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  qboConnected: false,
  password: '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' // not a real hash
});

mockDb.invoices.push({
  id: 'INV-123',
  invoiceNumber: 'TEST-123',
  customerName: 'Test Customer',
  serviceDescription: 'Web Development Services',
  amount: 100.00,
  dueDate: '2025-04-15',
  notes: 'Payment due within 30 days',
  createdAt: new Date().toISOString()
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API server is running' });
});

// Simple user authentication mock
app.post('/api/signup', (req, res) => {
  console.log('Received signup request:', req.body);
  const { email, password } = req.body;
  
  if (!email || !password) {
    console.log('Validation error: Missing email or password');
    return res.status(400).json({
      error: {
        message: 'Email and password are required',
        status: 400
      }
    });
  }
  
  // Check if user already exists
  const existingUser = mockDb.users.find(user => user.email === email);
  if (existingUser) {
    console.log('User already exists:', email);
    return res.status(409).json({
      error: {
        message: 'User already exists',
        status: 409
      }
    });
  }
  
  // Create new user
  const newUser = {
    id: 'USER-' + Date.now(),
    email: email,
    firstName: req.body.firstName || '',
    lastName: req.body.lastName || '',
    qboConnected: false,
    password: 'hashed-password-would-go-here'
  };
  
  mockDb.users.push(newUser);
  console.log('New user created:', newUser);
  
  // Modified response format to match what frontend expects
  const responseData = {
    token: 'mock-jwt-token',
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      qboConnected: newUser.qboConnected
    }
  };
  
  console.log('Sending response:', responseData);
  res.status(201).json(responseData);
});

// Login mock
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: {
        message: 'Email and password are required',
        status: 400
      }
    });
  }
  
  // Find user
  const user = mockDb.users.find(user => user.email === email);
  if (!user) {
    return res.status(401).json({
      error: {
        message: 'Invalid credentials',
        status: 401
      }
    });
  }
  
  // In a real app, we would verify the password hash here
  
  // Modified response format to match what frontend expects
  res.status(200).json({
    token: 'mock-jwt-token',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      qboConnected: user.qboConnected
    }
  });
});

// Get profile mock
app.get('/api/profile', (req, res) => {
  // Here we would normally validate the JWT token
  // For testing, we'll just return a success response
  
  // Modified response format to match what frontend expects
  res.status(200).json({
    user: {
      id: '123456789',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      qboConnected: false
    }
  });
});

// Voice processing mock
app.post('/api/process-voice', (req, res) => {
  const { audio, field } = req.body;
  
  if (!field) {
    return res.status(400).json({
      error: {
        message: 'Field is required',
        status: 400
      }
    });
  }
  
  // Mock responses for different fields
  let text = '';
  switch (field) {
    case 'customerName':
      text = 'Acme Corporation';
      break;
    case 'serviceDescription':
      text = 'Website development and SEO optimization';
      break;
    case 'amount':
      text = '1250 dollars';
      break;
    case 'dueDate':
      text = 'May 15th 2025';
      break;
    case 'notes':
      text = 'Please pay within 30 days. Thank you for your business.';
      break;
    default:
      text = 'Processed voice input for ' + field;
  }
  
  // In a real implementation, this would process audio
  // For testing, we'll just return a mock result
  res.status(200).json({
    field: field,
    text: text
  });
});

// Text refinement mock
app.post('/api/refine-text', (req, res) => {
  const { text, field } = req.body;
  
  if (!text || !field) {
    return res.status(400).json({
      error: {
        message: 'Text and field are required',
        status: 400
      }
    });
  }
  
  // Enhanced refinement based on field type
  let refined = text;
  
  switch (field) {
    case 'customerName':
      // Capitalize each word in the name
      refined = text.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      break;
    case 'amount':
      // Convert text amounts to numbers
      if (text.includes('dollars')) {
        const amountText = text.replace('dollars', '').trim();
        // Handle word numbers like "one thousand"
        const wordToNumber = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
          'hundred': 100, 'thousand': 1000
        };
        
        const words = amountText.split(' ');
        if (words.every(word => wordToNumber[word.toLowerCase()] || !isNaN(parseFloat(word)))) {
          // Simple word-to-number conversion
          let amount = 0;
          let current = 0;
          
          for (const word of words) {
            const lword = word.toLowerCase();
            if (wordToNumber[lword] === 100 || wordToNumber[lword] === 1000) {
              current = current * wordToNumber[lword];
              amount += current;
              current = 0;
            } else if (wordToNumber[lword]) {
              current += wordToNumber[lword];
            } else if (!isNaN(parseFloat(word))) {
              current += parseFloat(word);
            }
          }
          
          amount += current;
          refined = amount.toFixed(2);
        } else {
          // Extract numeric parts
          const numericPart = amountText.replace(/[^0-9.]/g, '');
          if (numericPart) {
            refined = parseFloat(numericPart).toFixed(2);
          }
        }
      } else {
        // Just extract numbers
        const numericPart = text.replace(/[^0-9.]/g, '');
        if (numericPart) {
          refined = parseFloat(numericPart).toFixed(2);
        }
      }
      break;
    case 'dueDate':
      // Convert date text to ISO format
      if (text.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        refined = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (text.includes('next week')) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        refined = nextWeek.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i)) {
        // Basic month parsing
        const months = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };
        
        let month = -1;
        let day = -1;
        let year = new Date().getFullYear();
        
        // Find month
        for (const [monthName, monthIndex] of Object.entries(months)) {
          if (text.toLowerCase().includes(monthName)) {
            month = monthIndex;
            break;
          }
        }
        
        // Find day
        const dayMatch = text.match(/\d{1,2}(st|nd|rd|th)?/);
        if (dayMatch) {
          day = parseInt(dayMatch[0].replace(/st|nd|rd|th/, ''));
        }
        
        // Find year
        const yearMatch = text.match(/\d{4}/);
        if (yearMatch) {
          year = parseInt(yearMatch[0]);
        }
        
        if (month >= 0 && day > 0) {
          const date = new Date(year, month, day);
          refined = date.toISOString().split('T')[0]; // YYYY-MM-DD
        }
      }
      break;
    default:
      // For other fields, just do basic cleanup
      refined = text.trim();
  }
  
  res.status(200).json({
    field: field,
    original: text,
    refined: refined
  });
});

// Invoice creation mock
app.post('/api/invoices', (req, res) => {
  const { customerName, serviceDescription, amount, dueDate, notes } = req.body;
  
  if (!customerName || !serviceDescription || !amount) {
    return res.status(400).json({
      error: {
        message: 'Missing required invoice fields',
        status: 400
      }
    });
  }
  
  const newInvoice = {
    id: 'INV-' + Date.now(),
    invoiceNumber: 'TEST-' + Math.floor(Math.random() * 1000),
    customerName,
    serviceDescription,
    amount,
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  
  mockDb.invoices.push(newInvoice);
  
  res.status(201).json(newInvoice);
});

// Get invoices mock
app.get('/api/invoices', (req, res) => {
  res.status(200).json({
    invoices: mockDb.invoices.map(invoice => ({
      Id: invoice.id,
      DocNumber: invoice.invoiceNumber,
      CustomerRef: { name: invoice.customerName },
      ServiceDescription: invoice.serviceDescription,
      TotalAmt: invoice.amount,
      DueDate: invoice.dueDate,
      Notes: invoice.notes,
      MetaData: { CreateTime: invoice.createdAt }
    }))
  });
});

// OAuth initiation mock
app.get('/oauth/connect', (req, res) => {
  res.redirect('/?oauth=success');
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n==========================================`);
  console.log(`Enhanced Test API server running at http://localhost:${PORT}`);
  console.log(`==========================================\n`);
  console.log('Available endpoints:');
  console.log('  GET    /health');
  console.log('  GET    /api/health');
  console.log('  POST   /api/signup');
  console.log('  POST   /api/login');
  console.log('  GET    /api/profile');
  console.log('  POST   /api/process-voice');
  console.log('  POST   /api/refine-text');
  console.log('  POST   /api/invoices');
  console.log('  GET    /api/invoices');
  console.log('  GET    /oauth/connect');
  console.log('\nPress Ctrl+C to stop the server\n');
}); 