# AI Anti-Spam Shield Backend

Express.js backend API for the AI Anti-Spam Shield application.

## Project Structure

```
ai-anti-spam-shield-backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── index.js      # Main configuration
│   ├── controllers/      # Request handlers
│   │   ├── message.controller.js
│   │   ├── user.controller.js
│   │   └── report.controller.js
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.js       # Authentication middleware
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── models/           # Database models (to be implemented)
│   ├── routes/           # API routes
│   │   ├── index.js
│   │   ├── message.routes.js
│   │   ├── user.routes.js
│   │   └── report.routes.js
│   ├── services/         # Business logic
│   │   ├── message.service.js
│   │   ├── user.service.js
│   │   └── report.service.js
│   ├── utils/            # Utility functions
│   │   ├── apiError.js
│   │   ├── asyncHandler.js
│   │   └── logger.js
│   └── app.js            # Express app setup
├── .env.example          # Environment variables example
├── .gitignore
├── package.json
└── README.md
```

## Features

- ✅ Clean architecture with separation of concerns
- ✅ Organized route structure
- ✅ Controller-Service pattern
- ✅ Centralized error handling
- ✅ Authentication and authorization middleware (skeleton)
- ✅ Environment-based configuration
- ✅ Security middleware (helmet, cors)
- ✅ Request logging (morgan)
- ✅ Custom error classes
- ✅ Async error handling

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your configuration

### Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /health` - Server health check

### API Info
- `GET /api/v1` - API information and available endpoints

### Messages
- `POST /api/v1/messages/analyze` - Analyze message for spam
- `GET /api/v1/messages` - Get all messages
- `GET /api/v1/messages/:id` - Get message by ID
- `DELETE /api/v1/messages/:id` - Delete message

### Users
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `DELETE /api/v1/users/:id` - Delete user (admin only)

### Reports
- `POST /api/v1/reports` - Create new report
- `GET /api/v1/reports` - Get all reports
- `GET /api/v1/reports/:id` - Get report by ID
- `PUT /api/v1/reports/:id` - Update report
- `DELETE /api/v1/reports/:id` - Delete report

## Next Steps

The structure is ready for implementation. You need to:

1. Implement database models (Prisma schema already exists)
2. Add business logic to service files
3. Implement authentication and authorization
4. Add validation schemas
5. Integrate with AI service
6. Add unit and integration tests

## License

ISC

