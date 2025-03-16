# QuickBooks Voice-to-Invoice Application Issues

## Issues Identified and Fixed

### 1. Port Conflict (Frontend Server)
- **Issue**: The frontend server was configured to use port 3000, but this port was already in use by a Docker process.
- **Fix**: Updated the `serve.js` file to use port 3001 instead.
- **File Changed**: `serve.js`

### 2. Content Security Policy (CSP) Configuration
- **Issue**: The Content Security Policy in the HTML file was not allowing connections to the frontend server.
- **Fix**: Updated the CSP to include `http://localhost:3001` in the allowed connections and made it more permissive for testing.
- **File Changed**: `frontend/index.html`

### 3. API Response Format Mismatch
- **Issue**: The test API server was returning responses in a nested format with a `data` wrapper, but the frontend was expecting a flatter structure.
- **Fix**: Updated the following endpoints in the test server to match the expected format:
  - `/api/signup` - Changed from `{data: {user: {...}, token: '...'}}` to `{user: {...}, token: '...'}`
  - `/api/login` - Changed from `{data: {user: {...}, token: '...'}}` to `{user: {...}, token: '...'}`
  - `/api/profile` - Changed from `{data: {user: {...}}}` to `{user: {...}}`
  - `/api/process-voice` - Changed from `{data: {field: '...', text: '...'}}` to `{field: '...', text: '...'}`
  - `/api/refine-text` - Changed from `{data: {field: '...', original: '...', refined: '...'}}` to `{field: '...', original: '...', refined: '...'}`
  - `/api/invoices` (GET) - Changed from `{data: {invoices: [...]}}` to `{invoices: [...]}`
  - `/api/invoices` (POST) - Changed from `{data: newInvoice}` to `newInvoice`
- **File Changed**: `backend/test-apis.js`

### 4. CORS Issues with Credentials
- **Issue**: The `credentials: 'include'` setting in fetch requests was causing CORS issues.
- **Fix**: 
  - Updated the CORS configuration in the test API server to explicitly allow credentials.
  - Removed the `credentials: 'include'` setting from the CORSProxy.js file.
  - Created test pages without the credentials setting to verify that this was the issue.
- **Files Changed**: 
  - `backend/test-apis.js`
  - `frontend/js/cors-proxy.js`
  - Created test files: `frontend/cors-test.html`, `frontend/cors-test-no-credentials.html`, `frontend/test-signup-no-credentials.html`, `frontend/test-app-signup-no-credentials.html`

### 5. CORSProxy Usage in Auth.js
- **Issue**: The `auth.js` file was using the CORSProxy module for all API calls, which was causing issues with the fetch requests.
- **Fix**: Updated the `auth.js` file to use direct fetch calls instead of going through the CORSProxy module.
- **File Changed**: `frontend/js/auth.js`

### 6. Error Handling in Auth.js
- **Issue**: The error handling in the `auth.js` file was not properly extracting error messages from the API responses.
- **Fix**: Updated the error handling to properly extract error messages from the API responses.
- **File Changed**: `frontend/js/auth.js`

### 7. Debug Tools
- **Issue**: It was difficult to diagnose issues with the application without proper debugging tools.
- **Fix**: Created a debug version of the application with more detailed logging and a simplified interface for testing.
- **File Created**: `frontend/debug.html`, `frontend/browser-test.html`

## How to Run the Application

1. Start the test API server:
   ```
   node backend/test-apis.js
   ```
   This will run on port 3030.

2. Start the frontend server:
   ```
   node serve.js
   ```
   This will run on port 3001.

3. Access the application at:
   ```
   http://localhost:3001/index.html
   ```

4. Debug pages are available at:
   ```
   http://localhost:3001/debug.html
   http://localhost:3001/browser-test.html
   ```

5. Test pages are available at:
   ```
   http://localhost:3001/test-signup.html
   http://localhost:3001/test-app-signup.html
   http://localhost:3001/test-signup-no-credentials.html
   http://localhost:3001/test-app-signup-no-credentials.html
   http://localhost:3001/cors-test.html
   http://localhost:3001/cors-test-no-credentials.html
   ```

## Additional Notes

- The application uses an in-memory database for testing purposes.
- The test API server provides mock responses for all endpoints.
- The frontend server serves static files from the `frontend` directory.
- CORS is configured to allow requests from any origin.
- When using `credentials: 'include'` with CORS, the server must specify a specific origin rather than using the wildcard `*`. This can cause issues when testing locally.
- The debug pages provide more detailed logging and a simplified interface for testing.
- The browser test page provides tools to test browser capabilities, network connectivity, and API server functionality.

## Troubleshooting

If you're still experiencing issues with the login and registration functionality, try the following:

1. Clear your browser's cache and cookies.
2. Use the debug page at `http://localhost:3001/debug.html` to test the login and registration functionality with more detailed logging.
3. Use the browser test page at `http://localhost:3001/browser-test.html` to test browser capabilities, network connectivity, and API server functionality.
4. Check the browser's developer console for any errors.
5. Make sure both the frontend server and the test API server are running.
6. Try using a different browser to rule out browser-specific issues.
7. Check if there are any network restrictions or firewall settings that might be blocking the requests.
8. Verify that the API server is returning the expected response format by using the curl command:
   ```
   curl -v -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}' http://localhost:3030/api/signup
   ``` 