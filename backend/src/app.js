/**
 * Main application file
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const quickbooksRoutes = require('./routes/quickbooks.routes');
const invoiceRoutes = require('./routes/invoice.routes');

// Create Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// CORS configuration
const corsOptions = {
    origin: ['http://localhost:8081', 'http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', quickbooksRoutes);
app.use('/api/invoices', invoiceRoutes);

// Add route to check API status
app.get('/api/status', (req, res) => {
    res.json({ status: 'API is running', timestamp: new Date() });
});

// Error handling middleware for JSON parsing errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        // Handle JSON parsing errors specifically
        return res.status(400).json({ 
            error: {
                message: 'Invalid JSON in request body',
                status: 400
            }
        });
    }
    next(err);
});

// Catch-all route for SPA - must be before error handlers
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Always set content type to application/json
    res.setHeader('Content-Type', 'application/json');
    
    // Return a JSON response even for unexpected errors
    res.status(err.status || 500).json({ 
        error: {
            message: err.message || 'Something went wrong!',
            status: err.status || 500
        }
    });
});

// Start server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle uncaught exceptions properly
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Log the error but don't exit the process in production
    if (process.env.NODE_ENV !== 'production') {
        process.exit(1);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

module.exports = app; 