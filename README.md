# QuickBooks Voice-to-Invoice Tool

A web application that allows users to create invoices in QuickBooks using voice commands.

## Features

- User authentication (login/register)
- QuickBooks OAuth integration
- Voice recognition for invoice creation
- Secure API communication with QuickBooks
- Mobile-friendly responsive design

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **QuickBooks Integration**: Intuit OAuth 2.0
- **Voice Recognition**: Web Speech API

## Project Structure

```
.
├── backend/                 # Backend Node.js application
│   ├── src/                 # Source code
│   │   ├── app.js           # Main application file
│   │   ├── middleware/      # Middleware functions
│   │   ├── models/          # MongoDB models
│   │   └── routes/          # API routes
│   ├── .env                 # Environment variables
│   └── package.json         # Dependencies
├── frontend/                # Frontend web application
│   ├── css/                 # Stylesheets
│   ├── js/                  # JavaScript files
│   ├── dashboard.html       # Dashboard page
│   └── index.html           # Login/register page
└── serve.js                 # Development server
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- QuickBooks Developer Account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/quickbooks-voice-tool.git
   cd quickbooks-voice-tool
   ```

2. Install dependencies:
   ```
   npm install
   cd backend && npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/quickbooks-voice-tool
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRY=24h
   QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id_here
   QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret_here
   QUICKBOOKS_REDIRECT_URI=http://localhost:3000/auth/qbo/callback
   ```

4. Start the development server:
   ```
   node serve.js
   ```

5. Open your browser and navigate to `http://localhost:3001`

### QuickBooks Developer Setup

1. Create a developer account at [Intuit Developer](https://developer.intuit.com/)
2. Create a new app
3. Set the redirect URI to `http://localhost:3000/auth/qbo/callback`
4. Copy the Client ID and Client Secret to your `.env` file

## Usage

1. Register a new account or login
2. Connect your QuickBooks account
3. Click the microphone button on the dashboard
4. Speak your invoice details (e.g., "Create an invoice for John Doe for 2 hours of consulting at $150 per hour")
5. Review and confirm the invoice details
6. The invoice will be created in your QuickBooks account

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Intuit Developer](https://developer.intuit.com/) for the QuickBooks API
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for voice recognition

## Documentation

- [API Error Handling](./API_ERROR_HANDLING.md) - Guidelines for proper error handling in API requests and responses. 