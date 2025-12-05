# /scan-text Endpoint Testing Guide

## Endpoint Details

**URL:** `POST /api/v1/messages/scan-text`  
**Authentication:** Not required  
**Content-Type:** `application/json`

## Request Format

```json
{
  "message": "Your text message to scan for spam"
}
```

## Response Format

### Success Response (200 OK)

```json
{
  "status": "success",
  "message": "Message scanned successfully",
  "data": {
    "is_spam": false,
    "confidence": 0.95,
    "prediction": "ham",
    "message": "Your text message to scan for spam",
    "timestamp": "2025-12-05T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Missing message field
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Message field is required"
}
```

#### 400 Bad Request - Empty message
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Message cannot be empty"
}
```

#### 500 Internal Server Error - AI service unavailable
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "AI service is unavailable. Please try again later."
}
```

## Testing with cURL

### Test 1: Valid message (Ham)
```bash
curl -X POST http://localhost:3000/api/v1/messages/scan-text \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you doing today?"}'
```

### Test 2: Valid message (Potential Spam)
```bash
curl -X POST http://localhost:3000/api/v1/messages/scan-text \
  -H "Content-Type: application/json" \
  -d '{"message": "CONGRATULATIONS! You won $1,000,000. Click here NOW!"}'
```

### Test 3: Missing message field
```bash
curl -X POST http://localhost:3000/api/v1/messages/scan-text \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Test 4: Empty message
```bash
curl -X POST http://localhost:3000/api/v1/messages/scan-text \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'
```

## Testing with JavaScript (fetch)

```javascript
// Test function
async function scanText(message) {
  try {
    const response = await fetch('http://localhost:3000/api/v1/messages/scan-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    console.log('Response:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test examples
scanText('Hello, this is a normal message');
scanText('WIN FREE MONEY NOW! Click here!!!');
```

## AI Service Integration

The endpoint sends requests to: `http://localhost:8000/predict`

### AI Service Request Format:
```json
{
  "message": "text to analyze"
}
```

### Expected AI Service Response:
```json
{
  "is_spam": true,
  "confidence": 0.87,
  "prediction": "spam"
}
```

Or:

```json
{
  "prediction": "spam",
  "probability": 0.87
}
```

## Error Handling

The endpoint handles the following error scenarios:

1. **Missing/Invalid Input**
   - Missing message field
   - Empty message
   - Non-string message type

2. **AI Service Errors**
   - Service unavailable (ECONNREFUSED)
   - Request timeout (ETIMEDOUT)
   - Bad request from AI service (400)
   - Service unavailable (503)
   - Other HTTP errors

3. **Network Errors**
   - Connection issues
   - DNS resolution failures

## Implementation Details

### Files Modified:
1. `src/routes/message.routes.js` - Added `/scan-text` route
2. `src/controllers/message.controller.js` - Added `scanText` controller
3. `src/services/message.service.js` - Added `scanTextForSpam` method with AI integration
4. `package.json` - Added `axios` dependency

### Features:
- ✅ Input validation (required, non-empty, string type)
- ✅ AI service integration with proper error handling
- ✅ Timeout handling (30 seconds)
- ✅ Detailed logging for debugging
- ✅ Consistent error responses
- ✅ Success/error status codes
- ✅ Flexible AI response format support

## Starting the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000` by default.

Make sure the AI model service is running on `http://localhost:8000` before testing!

