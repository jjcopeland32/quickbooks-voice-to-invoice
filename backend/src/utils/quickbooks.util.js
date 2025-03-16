const axios = require('axios');
const { getApiUrl, refreshToken } = require('../config/quickbooks.config');

/**
 * QuickBooks API service for invoice-related operations
 * Handles creating and managing invoices in QuickBooks
 */
class QuickBooksService {
  constructor() {
    this.apiUrl = getApiUrl();
    this.apiVersion = 'v3';
  }

  /**
   * Create an invoice in QuickBooks
   * Maps the local invoice data to QuickBooks invoice schema
   * 
   * @param {Object} invoiceData - Invoice data (customerName, serviceDescription, amount, dueDate, notes)
   * @param {String} realmId - QuickBooks company ID
   * @param {Object} tokenInfo - OAuth token information
   * @returns {Promise<Object>} Created invoice
   */
  async createInvoice(invoiceData, realmId, tokenInfo) {
    try {
      // Ensure we have a valid token
      const token = await this.ensureValidToken(tokenInfo);
      
      // First, we need to find or create the customer
      const customer = await this.findOrCreateCustomer(invoiceData.customerName, realmId, token);
      
      // Create the invoice payload
      const invoicePayload = this.createInvoicePayload(invoiceData, customer.Id);
      
      // Send the request to create the invoice
      const response = await axios.post(
        `${this.apiUrl}/${this.apiVersion}/company/${realmId}/invoice`,
        invoicePayload,
        {
          headers: this.getHeaders(token.token.access_token)
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating invoice in QuickBooks:', error.message);
      throw error;
    }
  }

  /**
   * Find or create a customer in QuickBooks
   * 
   * @param {String} customerName - Name of the customer
   * @param {String} realmId - QuickBooks company ID
   * @param {Object} token - OAuth token
   * @returns {Promise<Object>} Customer object
   */
  async findOrCreateCustomer(customerName, realmId, token) {
    try {
      // Try to find the customer first
      const query = encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${customerName.replace(/'/g, "\\'")}'`);
      const response = await axios.get(
        `${this.apiUrl}/${this.apiVersion}/company/${realmId}/query?query=${query}`,
        {
          headers: this.getHeaders(token.token.access_token)
        }
      );
      
      // If customer exists, return it
      if (response.data.QueryResponse && response.data.QueryResponse.Customer && response.data.QueryResponse.Customer.length > 0) {
        return response.data.QueryResponse.Customer[0];
      }
      
      // Otherwise, create a new customer
      const customerPayload = {
        DisplayName: customerName,
        CompanyName: customerName,
        PrintOnCheckName: customerName,
        Active: true
      };
      
      const createResponse = await axios.post(
        `${this.apiUrl}/${this.apiVersion}/company/${realmId}/customer`,
        customerPayload,
        {
          headers: this.getHeaders(token.token.access_token)
        }
      );
      
      return createResponse.data.Customer;
    } catch (error) {
      console.error('Error finding or creating customer in QuickBooks:', error.message);
      throw error;
    }
  }

  /**
   * Create the invoice payload for QuickBooks API
   * Maps the local data to QuickBooks invoice schema
   * 
   * @param {Object} invoiceData - Invoice data
   * @param {String} customerId - QuickBooks customer ID
   * @returns {Object} Invoice payload for QuickBooks API
   */
  createInvoicePayload(invoiceData, customerId) {
    // Parse the amount to ensure it's a number
    const amount = parseFloat(invoiceData.amount);
    
    // Create a line item for the service
    const lineItem = {
      DetailType: 'SalesItemLineDetail',
      Amount: amount,
      SalesItemLineDetail: {
        ItemRef: {
          name: 'Services'
        }
      },
      Description: invoiceData.serviceDescription
    };
    
    // Parse the due date
    const dueDate = new Date(invoiceData.dueDate);
    const formattedDueDate = dueDate.toISOString().split('T')[0];
    
    // Create the invoice object
    const invoice = {
      Line: [lineItem],
      CustomerRef: {
        value: customerId
      },
      DueDate: formattedDueDate,
      DocNumber: `INV-${Date.now()}`, // Generate a unique invoice number
      PrivateNote: invoiceData.notes || ''
    };
    
    return invoice;
  }

  /**
   * Get headers for QuickBooks API requests
   * 
   * @param {String} accessToken - OAuth access token
   * @returns {Object} Headers for API requests
   */
  getHeaders(accessToken) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Ensure the token is valid, refresh if necessary
   * 
   * @param {Object} tokenInfo - Token information
   * @returns {Promise<Object>} Valid token
   */
  async ensureValidToken(tokenInfo) {
    try {
      // Check if the token is expired or about to expire (within 5 minutes)
      const expirationTime = new Date(tokenInfo.token.expires_at);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (expirationTime - now < fiveMinutes) {
        // Token is expired or about to expire, refresh it
        return await refreshToken(tokenInfo);
      }
      
      return tokenInfo;
    } catch (error) {
      console.error('Error ensuring valid token:', error.message);
      throw error;
    }
  }
}

module.exports = new QuickBooksService(); 