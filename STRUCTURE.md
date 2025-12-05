# Express.js Project Structure Overview

## 📁 Project Architecture

```
ai-anti-spam-shield-backend/
│
├── src/                          # Source code directory
│   ├── app.js                    # Main application entry point
│   │
│   ├── config/                   # Configuration management
│   │   └── index.js              # Centralized configuration (env vars, DB, API keys)
│   │
│   ├── routes/                   # API route definitions
│   │   ├── index.js              # Main router that combines all routes
│   │   ├── message.routes.js    # Message-related endpoints
│   │   ├── user.routes.js       # User authentication & management
│   │   └── report.routes.js     # Report endpoints
│   │
│   ├── controllers/              # Request handlers
│   │   ├── message.controller.js # Handle message requests
│   │   ├── user.controller.js    # Handle user requests
│   │   └── report.controller.js  # Handle report requests
│   │
│   ├── services/                 # Business logic layer
│   │   ├── message.service.js    # Message business logic & AI integration
│   │   ├── user.service.js       # User management & authentication logic
│   │   └── report.service.js     # Report generation & statistics
│   │
│   ├── middlewares/              # Custom Express middlewares
│   │   ├── auth.js               # Authentication & authorization
│   │   ├── errorHandler.js       # Global error handling
│   │   └── validate.js           # Request validation
│   │
│   ├── models/                   # Database models (empty - ready for implementation)
│   │
│   └── utils/                    # Helper utilities
│       ├── apiError.js           # Custom error class with status codes
│       ├── asyncHandler.js       # Async error wrapper
│       └── logger.js             # Logging utility
│
├── prisma/                       # Database schema (existing)
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── package.json                  # Project dependencies & scripts
└── README.md                     # Project documentation

```

## 🏗️ Architecture Pattern

### Controller → Service → Model Pattern

**Routes** → **Controllers** → **Services** → **Models** → **Database**

- **Routes**: Define API endpoints and attach middleware
- **Controllers**: Handle HTTP requests/responses, validate input
- **Services**: Contain business logic, can be reused
- **Models**: Database schema and queries (to be implemented)

## 🔌 API Endpoints Structure

### Base URL: `/api/v1`

#### Health & Info
- `GET /health` - Server health check
- `GET /api/v1` - API information

#### Messages (`/api/v1/messages`)
- `POST /analyze` - Analyze message for spam (requires auth)
- `GET /` - Get all messages (requires auth)
- `GET /:id` - Get specific message (requires auth)
- `DELETE /:id` - Delete message (requires auth)

#### Users (`/api/v1/users`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get user profile (requires auth)
- `PUT /profile` - Update profile (requires auth)
- `DELETE /:id` - Delete user (requires auth + admin role)

#### Reports (`/api/v1/reports`)
- `POST /` - Create report (requires auth)
- `GET /` - Get all reports (requires auth)
- `GET /:id` - Get specific report (requires auth)
- `PUT /:id` - Update report (requires auth)
- `DELETE /:id` - Delete report (requires auth)

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Authentication**: Middleware for protected routes
- **Authorization**: Role-based access control
- **Error Handling**: Centralized error management

## 🔧 Utilities

### ApiError Class
Custom error class with convenient static methods:
- `ApiError.badRequest()` - 400
- `ApiError.unauthorized()` - 401
- `ApiError.forbidden()` - 403
- `ApiError.notFound()` - 404
- `ApiError.conflict()` - 409
- `ApiError.internal()` - 500

### Logger
Logging utility with levels:
- `logger.info()` - Info messages
- `logger.error()` - Error messages
- `logger.warn()` - Warning messages
- `logger.debug()` - Debug (dev only)

### Async Handler
Wrapper for async route handlers to automatically catch errors

## 📦 Dependencies

### Production
- `express` - Web framework
- `cors` - CORS middleware
- `helmet` - Security middleware
- `dotenv` - Environment configuration
- `morgan` - HTTP request logger

### Development
- `nodemon` - Auto-reload during development

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Run production server**:
   ```bash
   npm start
   ```

## ✅ What's Implemented

- ✅ Clean folder structure
- ✅ Route definitions with proper HTTP methods
- ✅ Controller skeleton with async/await
- ✅ Service layer skeleton (classes with methods)
- ✅ Error handling middleware
- ✅ Authentication/authorization middleware skeleton
- ✅ Configuration management
- ✅ Utility functions (logger, error classes)
- ✅ Security middleware setup
- ✅ API documentation

## 📝 Next Steps (Ready for Implementation)

1. **Database Layer**
   - Define Prisma models
   - Create database connection
   - Implement model methods

2. **Authentication**
   - Implement JWT token generation
   - Add password hashing (bcrypt)
   - Complete auth middleware

3. **Business Logic**
   - Implement service methods
   - Add AI service integration
   - Implement spam detection logic

4. **Validation**
   - Add request validation schemas
   - Implement validation middleware

5. **Testing**
   - Unit tests for services
   - Integration tests for APIs
   - E2E testing

## 💡 Design Principles

- **Separation of Concerns**: Each layer has a specific responsibility
- **DRY**: Reusable utilities and error handling
- **Scalability**: Easy to add new features/endpoints
- **Maintainability**: Clean code structure with clear naming
- **Security**: Multiple security layers implemented
- **Error Handling**: Consistent error responses throughout

---

**Status**: ✅ Structure Complete - Ready for Business Logic Implementation

