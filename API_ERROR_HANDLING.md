# API Error Handling Documentation

## Issue: HTML Response Instead of JSON

### Problem

The application was experiencing an issue where the server sometimes returned HTML responses instead of JSON during API calls, particularly during authentication. This caused client-side errors with the error message:

```
Unexpected token '<', "<html>\r\n<h"... is not valid JSON
```

This error occurred because:

1. The frontend JavaScript code was making fetch requests to the API endpoints expecting JSON responses
2. In some error scenarios, the server was responding with HTML content instead of properly formatted JSON
3. When the frontend tried to parse the HTML response as JSON using `response.json()`, it caused a parsing error

### Root Causes

1. **Incomplete Error Handling**: The Express error handling middleware wasn't properly configured to always return JSON responses in all error scenarios.

2. **Missing Content Type Header**: The error handlers didn't explicitly set the Content-Type header to 'application/json'.

3. **Uncaught Exceptions**: Some server-side errors weren't being caught properly, causing Express to return its default HTML error page instead of a JSON response.

4. **No Handling for JSON Parsing Errors**: When invalid JSON was sent to the server, it couldn't parse the request body correctly, leading to HTML error responses.

5. **Ineffective Client-Side Error Handling**: The frontend didn't properly check the content type of the response before attempting to parse it as JSON.

## Solution

### Backend Changes

1. **Enhanced Error Middleware**: Updated the global error handling middleware to:
   - Always set Content-Type to 'application/json'
   - Return proper JSON-formatted error responses
   - Include appropriate status codes

2. **Added JSON Parsing Error Handler**: Added specific middleware to catch JSON syntax errors in request bodies and return proper JSON responses.

3. **Improved Global Error Handling**: Added handlers for uncaught exceptions and unhandled promise rejections to prevent the application from crashing and to ensure proper JSON error responses.

```javascript
// Handle JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ 
      error: {
        message: 'Invalid JSON in request body',
        status: 400
      }
    });
  }
  next(err);
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Always set content type to application/json
  res.setHeader('Content-Type', 'application/json');
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});
```

### Frontend Changes

1. **Better Response Type Checking**: Updated the fetch handlers to check the content-type of responses before attempting to parse them as JSON.

2. **Improved Error Messages**: Added more user-friendly error messages when non-JSON responses are received.

3. **Enhanced JSON Parsing Error Handling**: Added specific handling for JSON parsing errors to provide clearer feedback.

4. **Added Accept Header**: Added 'Accept: application/json' header to all API requests to indicate the expected response format.

```javascript
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'  // Explicitly request JSON responses
  },
  body: JSON.stringify(data)
})
.then(response => {
  // Check content type before parsing
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server returned an invalid response format');
  }
  
  return response.json().catch(error => {
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new Error('Server returned an invalid response');
    }
    throw error;
  });
})
```

## Best Practices for API Error Handling

### Backend (Express)

1. **Always Return JSON from API Routes**: API endpoints should always return JSON responses, even for errors.

2. **Set Content-Type Header**: Always set the 'Content-Type: application/json' header explicitly for all API responses.

3. **Use Consistent Error Format**: Use a consistent error response format:
   ```json
   {
     "error": {
       "message": "Human-readable error message",
       "status": 400,
       "code": "ERROR_CODE", // Optional
       "details": {} // Optional additional details
     }
   }
   ```

4. **Handle JSON Parsing Errors**: Add middleware to catch JSON syntax errors in request bodies.

5. **Catch Unhandled Exceptions**: Set up global handlers for uncaught exceptions and unhandled promise rejections.

### Frontend (Fetch API)

1. **Validate Response Type**: Always check the Content-Type header before parsing a response as JSON.

2. **Handle Parsing Errors**: Add specific handling for JSON parsing errors.

3. **Set Accept Header**: Always include 'Accept: application/json' in request headers.

4. **User-Friendly Error Messages**: Display user-friendly error messages rather than raw error details.

5. **Log Detailed Errors**: Log detailed error information to the console or an error reporting service for debugging.

## Testing API Error Handling

To ensure that your API error handling is working correctly:

1. Test with invalid JSON in the request body
2. Test with invalid routes or endpoints
3. Test with server-side errors (e.g., database connection failure)
4. Test with network errors (e.g., timeout, connection refused)
5. Test with authentication errors

For each test case, verify that:
- The response has Content-Type: application/json
- The response body is valid JSON with appropriate error details
- The frontend displays a user-friendly error message 