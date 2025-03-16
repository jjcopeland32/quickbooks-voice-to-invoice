const { getApiUrl } = require('../config/quickbooks.config');
const axios = require('axios');
const { getValidQboAccessToken } = require('../utils/token.util');

/**
 * Create an invoice in QuickBooks
 * @route POST /api/invoices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Created invoice data
 */
const createInvoice = async (req, res) => {
  try {
    // Get user ID from JWT
    const userId = req.user.id;
    
    // Get QuickBooks data from request
    const {
      customerName,
      serviceDescription,
      amount,
      dueDate,
      notes
    } = req.body;

    // Get a valid access token
    const accessToken = await getValidQboAccessToken(userId);
    
    // Generate a unique doc number
    const docNumber = `INV-${Date.now()}`;

    // Build invoice payload
    const invoice = {
      DocNumber: docNumber,
      CustomerRef: {
        name: customerName
      },
      TxnDate: new Date().toISOString().split('T')[0],
      DueDate: dueDate,
      Line: [
        {
          Description: serviceDescription,
          Amount: parseFloat(amount),
          DetailType: "SalesItemLineDetail",
          SalesItemLineDetail: {
            ItemRef: {
              name: "Services"
            }
          }
        }
      ],
      CustomerMemo: {
        value: notes || ''
      }
    };

    // Make request to QuickBooks API
    const realmId = req.user.realmId;
    const apiUrl = `${getApiUrl()}/v3/company/${realmId}/invoice`;
    
    const response = await axios.post(apiUrl, invoice, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Return created invoice data
    res.status(201).json({
      data: {
        invoiceId: response.data.Invoice.Id,
        invoiceNumber: response.data.Invoice.DocNumber,
        customerName: customerName,
        amount: amount,
        createdAt: response.data.Invoice.MetaData.CreateTime
      }
    });
  } catch (error) {
    console.error('Error creating invoice:', error);

    // Handle specific errors
    if (error.response) {
      // QuickBooks API error
      return res.status(error.response.status).json({
        error: {
          message: 'QuickBooks API error',
          status: error.response.status,
          details: error.response.data
        }
      });
    }

    if (error.message === 'User not connected to QuickBooks') {
      return res.status(400).json({
        error: {
          message: 'User not connected to QuickBooks',
          status: 400
        }
      });
    }

    return res.status(500).json({
      error: {
        message: 'Error creating invoice',
        status: 500,
        details: error.message
      }
    });
  }
};

/**
 * Get invoices list from QuickBooks
 * @route GET /api/invoices
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} List of invoices
 */
const getInvoices = async (req, res) => {
  try {
    // Get user ID from JWT
    const userId = req.user.id;
    
    // Get a valid access token
    const accessToken = await getValidQboAccessToken(userId);
    
    // Make request to QuickBooks API
    const realmId = req.user.realmId;
    const apiUrl = `${getApiUrl()}/v3/company/${realmId}/query`;
    
    const queryParams = new URLSearchParams({
      query: 'SELECT * FROM Invoice MAXRESULTS 10'
    });
    
    const response = await axios.get(`${apiUrl}?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    // Return invoices
    res.status(200).json({
      data: {
        invoices: response.data.QueryResponse.Invoice || []
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);

    // Handle specific errors
    if (error.response) {
      // QuickBooks API error
      return res.status(error.response.status).json({
        error: {
          message: 'QuickBooks API error',
          status: error.response.status,
          details: error.response.data
        }
      });
    }

    if (error.message === 'User not connected to QuickBooks') {
      return res.status(400).json({
        error: {
          message: 'User not connected to QuickBooks',
          status: 400
        }
      });
    }

    return res.status(500).json({
      error: {
        message: 'Error fetching invoices',
        status: 500,
        details: error.message
      }
    });
  }
};

module.exports = {
  createInvoice,
  getInvoices
}; 