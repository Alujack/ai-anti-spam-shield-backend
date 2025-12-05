# AI Anti-Spam Shield Backend - Complete API Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### Register User
```http
POST /api/v1/users/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "USER",
      "createdAt": "2025-12-05T10:00:00.000Z"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Login
```http
POST /api/v1/users/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "USER"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### Get Profile
```http
GET /api/v1/users/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "role": "USER",
    "createdAt": "2025-12-05T10:00:00.000Z"
  }
}
```

### Update Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "phone": "+0987654321"
}
```

### Change Password
```http
POST /api/v1/users/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "oldPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

---

## 2. Message Scanning Endpoints

### Scan Text for Spam
```http
POST /api/v1/messages/scan-text
```

**Request Body:**
```json
{
  "message": "Text message to scan for spam"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Message scanned successfully",
  "data": {
    "is_spam": false,
    "confidence": 0.95,
    "prediction": "ham",
    "message": "Text message to scan for spam",
    "timestamp": "2025-12-05T10:30:00.000Z"
  }
}
```

### Get Scan History
```http
GET /api/v1/messages/history?page=1&limit=20&isSpam=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `isSpam` (optional): Filter by spam status (true/false)

**Response (200):**
```json
{
  "status": "success",
  "message": "Scan history retrieved successfully",
  "data": {
    "histories": [
      {
        "id": "uuid",
        "message": "Scanned text",
        "isSpam": true,
        "confidence": 0.87,
        "prediction": "spam",
        "scannedAt": "2025-12-05T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Get Scan History by ID
```http
GET /api/v1/messages/history/:id
Authorization: Bearer <token>
```

### Delete Scan History
```http
DELETE /api/v1/messages/history/:id
Authorization: Bearer <token>
```

### Get Scan Statistics
```http
GET /api/v1/messages/statistics
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Statistics retrieved successfully",
  "data": {
    "totalScans": 150,
    "spamCount": 45,
    "hamCount": 105,
    "spamPercentage": "30.00"
  }
}
```

---

## 3. Report Endpoints

### Create Report
```http
POST /api/v1/reports
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "messageText": "Suspicious message content",
  "reportType": "PHISHING",
  "description": "This looks like a phishing attempt"
}
```

**Report Types:** `SPAM`, `PHISHING`, `SCAM`, `SUSPICIOUS`, `OTHER`

**Response (201):**
```json
{
  "status": "success",
  "message": "Report created successfully",
  "data": {
    "id": "uuid",
    "messageText": "Suspicious message content",
    "reportType": "PHISHING",
    "description": "This looks like a phishing attempt",
    "status": "PENDING",
    "createdAt": "2025-12-05T10:30:00.000Z"
  }
}
```

### Get User's Reports
```http
GET /api/v1/reports/my-reports?page=1&limit=20&status=PENDING
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status (PENDING, REVIEWED, RESOLVED, REJECTED)

### Get Report by ID
```http
GET /api/v1/reports/:id
Authorization: Bearer <token>
```

### Update Report
```http
PUT /api/v1/reports/:id
Authorization: Bearer <token>
```

**Request Body (User):**
```json
{
  "description": "Updated description"
}
```

**Request Body (Admin):**
```json
{
  "status": "REVIEWED",
  "description": "Under investigation"
}
```

### Delete Report
```http
DELETE /api/v1/reports/:id
Authorization: Bearer <token>
```

### Get Report Statistics
```http
GET /api/v1/reports/statistics
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Statistics retrieved successfully",
  "data": {
    "total": 50,
    "byStatus": {
      "pending": 20,
      "reviewed": 15,
      "resolved": 10,
      "rejected": 5
    },
    "byType": {
      "SPAM": 20,
      "PHISHING": 15,
      "SCAM": 10,
      "SUSPICIOUS": 3,
      "OTHER": 2
    }
  }
}
```

### Get All Reports (Admin Only)
```http
GET /api/v1/reports/admin/all?page=1&limit=20&status=PENDING&reportType=SPAM
Authorization: Bearer <admin_token>
```

---

## 4. Error Responses

### 400 Bad Request
```json
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "statusCode": 401,
  "message": "Access token is required"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "statusCode": 403,
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## 5. Database Models

### User
- `id`: UUID (Primary Key)
- `email`: String (Unique)
- `password`: String (Hashed)
- `name`: String (Optional)
- `phone`: String (Optional)
- `role`: Enum (USER, ADMIN)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### ScanHistory
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key)
- `message`: Text
- `isSpam`: Boolean
- `confidence`: Float
- `prediction`: String
- `details`: JSON (Optional)
- `scannedAt`: DateTime

### Report
- `id`: UUID (Primary Key)
- `userId`: UUID (Foreign Key)
- `messageText`: Text
- `reportType`: Enum (SPAM, PHISHING, SCAM, SUSPICIOUS, OTHER)
- `description`: Text (Optional)
- `status`: Enum (PENDING, REVIEWED, RESOLVED, REJECTED)
- `createdAt`: DateTime
- `updatedAt`: DateTime

---

## 6. Setup Instructions

### Prerequisites
- Node.js v14+
- PostgreSQL database
- Yarn package manager

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run Prisma migrations:
```bash
yarn prisma:migrate
```

4. Generate Prisma Client:
```bash
yarn prisma:generate
```

5. Start the server:
```bash
# Development
yarn dev

# Production
yarn start
```

---

## 7. Environment Variables

```env
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/antispam_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=30d

# AI Service
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_KEY=your-api-key-here

# CORS
CORS_ORIGIN=*
```

---

## 8. Testing with cURL

### Register and Login
```bash
# Register
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Scan Text
```bash
curl -X POST http://localhost:3000/api/v1/messages/scan-text \
  -H "Content-Type: application/json" \
  -d '{"message":"Check this message for spam"}'
```

### Get History (with auth)
```bash
curl -X GET http://localhost:3000/api/v1/messages/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 9. Implemented Features

✅ User authentication (register, login)  
✅ JWT token-based authorization  
✅ Password hashing with bcrypt  
✅ Message spam scanning with AI integration  
✅ Scan history tracking  
✅ User scan statistics  
✅ Report submission system  
✅ Report management (CRUD)  
✅ Report statistics  
✅ Role-based access control (User/Admin)  
✅ Comprehensive error handling  
✅ Request logging  
✅ Input validation  
✅ Pagination support  
✅ Database integration with Prisma  

---

## 10. Next Steps

- [ ] Add email verification
- [ ] Implement refresh token endpoint
- [ ] Add rate limiting
- [ ] Implement caching (Redis)
- [ ] Add unit and integration tests
- [ ] Add API documentation with Swagger
- [ ] Implement file upload for bulk scanning
- [ ] Add webhook notifications
- [ ] Implement real-time updates with WebSockets

---

**Backend Development Complete** ✅

