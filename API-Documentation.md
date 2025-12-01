# Task Management Backend API with WebSocket Support

A secure REST API for task management with JWT authentication, role-based access control, real-time updates via WebSocket, automated task reminders via cron jobs, and MongoDB database.

## Features

- JWT Authentication
- Role-based Authorization (User/Admin)
- Task CRUD Operations
- Real-time WebSocket Updates
- Automated Task Reminders (Cron Jobs)
- MongoDB Database with Mongoose
- Security Best Practices
- Clean Architecture

## Installation

```bash
npm install
```

## Database Setup

### MongoDB Local Setup

1. **Install MongoDB:**
   - Download from [MongoDB Official Website](https://www.mongodb.com/try/download/community)
   - Or use Docker: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

2. **Start MongoDB:**
   ```bash
   # If installed locally
   mongod
   
   # If using Docker
   docker start mongodb
   ```

3. **Update .env file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/ocreateo_db
   ```

### MongoDB Atlas (Cloud) Setup

1. **Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**

2. **Create a cluster and get connection string**

3. **Update .env file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ocreateo_db?retryWrites=true&w=majority
   ```

### Seed Database (Optional)

Populate database with sample data:

```bash
npm run seed
```

This creates:
- 1 Admin user (admin@example.com / admin123)
- 2 Regular users (user1@example.com / user123, user2@example.com / user123)
- Sample tasks including old tasks for cron testing

## Running the Application

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

Server will start at: `http://localhost:3000`

---

## API Documentation with CURL Examples

### Base URL
```
http://localhost:3000
```

### 1. Health Check

**Check if server is running**

```bash
curl -X GET http://localhost:3000/health
```

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "websocket": "active",
  "database": "connected",
  "cronJobs": [
    {
      "name": "Task Reminder",
      "schedule": "0 8 * * *",
      "running": true
    }
  ]
}
```

---

## Authentication Endpoints

### 2. Register User

**Create a new user account**

```bash
# Register as regular user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "role": "user"
  }'
```

```bash
# Register as admin
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 3. Login

**Authenticate and get JWT token**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Save the token for authenticated requests:**
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Task Endpoints (Authenticated Users)

### 4. Get User Tasks

**Retrieve all tasks for the logged-in user**

```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "taskId": "660e8400-e29b-41d4-a716-446655440001",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Complete project",
        "description": "Finish the backend API",
        "completed": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 5. Create Task

**Create a new task (emits `newTask` WebSocket event)**

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API docs"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "task": {
      "taskId": "770e8400-e29b-41d4-a716-446655440002",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Complete project documentation",
      "description": "Write comprehensive README and API docs",
      "completed": false,
      "createdAt": "2024-01-01T01:00:00.000Z",
      "updatedAt": "2024-01-01T01:00:00.000Z"
    }
  }
}
```

### 6. Update Task

**Update an existing task (emits `taskUpdated` WebSocket event)**

```bash
# Update title and description
curl -X PUT http://localhost:3000/api/tasks/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated: Complete project documentation",
    "description": "Write comprehensive README, API docs, and examples"
  }'
```

```bash
# Mark task as completed
curl -X PUT http://localhost:3000/api/tasks/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "task": {
      "taskId": "770e8400-e29b-41d4-a716-446655440002",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Updated: Complete project documentation",
      "description": "Write comprehensive README, API docs, and examples",
      "completed": true,
      "createdAt": "2024-01-01T01:00:00.000Z",
      "updatedAt": "2024-01-01T02:00:00.000Z"
    }
  }
}
```

### 7. Delete Task

**Delete a task (emits `taskDeleted` WebSocket event)**

```bash
curl -X DELETE http://localhost:3000/api/tasks/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## Admin Endpoints (Admin Only)

### 8. Get All Tasks (Admin)

**Retrieve all tasks from all users**

```bash
# First, login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# Save admin token
export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Get all tasks
curl -X GET http://localhost:3000/api/admin/tasks \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "taskId": "660e8400-e29b-41d4-a716-446655440001",
        "userId": "550e8400-e29b-41d4-a716-446655440000",
        "title": "User 1 Task",
        "description": "Description",
        "completed": false,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "taskId": "770e8400-e29b-41d4-a716-446655440002",
        "userId": "880e8400-e29b-41d4-a716-446655440003",
        "title": "User 2 Task",
        "description": "Description",
        "completed": true,
        "createdAt": "2024-01-01T01:00:00.000Z",
        "updatedAt": "2024-01-01T02:00:00.000Z"
      }
    ],
    "total": 2
  }
}
```

---

## WebSocket Endpoints (Admin Only)

### 9. Get Connected Clients

**View all WebSocket clients currently connected**

```bash
curl -X GET http://localhost:3000/api/websocket/clients \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClients": 3,
    "clients": [
      {
        "id": "socket_id_1",
        "rooms": ["socket_id_1", "admins"]
      },
      {
        "id": "socket_id_2",
        "rooms": ["socket_id_2", "user:550e8400-e29b-41d4-a716-446655440000"]
      }
    ]
  }
}
```

### 10. Test WebSocket Broadcast

**Manually trigger a WebSocket event (for testing)**

```bash
curl -X POST http://localhost:3000/api/websocket/test-broadcast \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "taskUpdated",
    "data": {
      "message": "This is a test broadcast",
      "testData": true
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Test broadcast sent to admins"
}
```

---

## Cron Job Endpoints (Admin Only)

### 11. Manually Trigger Task Reminders

**Manually run the task reminder cron job**

```bash
curl -X POST http://localhost:3000/api/cron/trigger-reminders \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Task reminders triggered successfully",
  "timestamp": "2024-01-01T08:00:00.000Z"
}
```

### 12. Get Cron Jobs Status

**View status of all scheduled cron jobs**

```bash
curl -X GET http://localhost:3000/api/cron/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cronEnabled": true,
    "jobs": [
      {
        "name": "Task Reminder",
        "schedule": "0 8 * * *",
        "running": true
      }
    ]
  }
}
```

---

## WebSocket Integration

### Client Connection

Connect to WebSocket server with JWT token:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### Available Events

**For All Authenticated Users:**
- `newTask` - Emitted when a new task is created
- `taskUpdated` - Emitted when a task is updated
- `taskDeleted` - Emitted when a task is deleted
- `taskCompleted` - Emitted when a task is marked as completed

**For Admins Only:**
- `taskReminders` - Emitted when cron job finds incomplete tasks

**Event Payload Examples:**

```javascript
// newTask
{
  message: "New task created",
  task: {
    taskId: "uuid",
    userId: "uuid",
    title: "Task Title",
    description: "Description",
    completed: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  }
}

// taskUpdated
{
  message: "Task updated",
  task: {
    taskId: "uuid",
    userId: "uuid",
    title: "Updated Title",
    description: "Updated Description",
    completed: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T01:00:00.000Z",
    changes: { /* previous state */ }
  }
}

// taskCompleted
{
  message: "Task marked as completed",
  task: { /* task details */ }
}

// taskDeleted
{
  message: "Task deleted",
  data: {
    taskId: "uuid",
    userId: "uuid",
    deletedAt: "2024-01-01T00:00:00.000Z"
  }
}

// taskReminders (Admin only)
{
  message: "5 incomplete tasks need attention",
  count: 5,
  tasks: [
    {
      taskId: "uuid",
      userId: "uuid",
      title: "Task Title",
      description: "Description",
      createdAt: "2024-01-01T00:00:00.000Z",
      age: "2 day(s) 5 hour(s)"
    }
  ],
  timestamp: "2024-01-03T08:00:00.000Z"
}
```

### WebSocket Client Example (JavaScript)

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('newTask', (data) => {
  console.log('New task created:', data);
});

socket.on('taskUpdated', (data) => {
  console.log('Task updated:', data);
});

socket.on('taskCompleted', (data) => {
  console.log('Task completed:', data);
});

socket.on('taskDeleted', (data) => {
  console.log('Task deleted:', data);
});

// Admin only
socket.on('taskReminders', (data) => {
  console.log('Task reminders:', data);
  console.log(`${data.count} tasks need attention`);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

---

## Cron Job Configuration

### Task Reminder Cron Job

The system automatically runs a cron job to check for incomplete tasks and send reminders.

**Default Configuration:**
- **Schedule:** Daily at 8:00 AM (`0 8 * * *`)
- **Threshold:** Tasks older than 24 hours
- **Actions:**
  - Logs incomplete tasks to console
  - Sends WebSocket notification to all connected admins
  - Includes task details and age

**Environment Variables:**
```env
CRON_ENABLED=true
CRON_REMINDER_SCHEDULE=0 8 * * *
TASK_REMINDER_THRESHOLD_HOURS=24
```

**Cron Schedule Format:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

**Examples:**
- `0 8 * * *` - Every day at 8:00 AM
- `0 */2 * * *` - Every 2 hours
- `0 9 * * 1` - Every Monday at 9:00 AM
- `30 14 * * *` - Every day at 2:30 PM

**Console Output Example:**
```
[INFO] 2024-01-03T08:00:00.000Z - Running task reminder cron job...
[INFO] 2024-01-03T08:00:00.000Z - === TASK REMINDERS ===
[INFO] 2024-01-03T08:00:00.000Z - Total incomplete tasks older than 24 hours: 3
[INFO] 2024-01-03T08:00:00.000Z - =====================
[INFO] 2024-01-03T08:00:00.000Z - 
Task ID: 660e8400-e29b-41d4-a716-446655440001
User: user@example.com
Title: Complete project documentation
Description: Write comprehensive README and API docs
Created At: 2024-01-01T00:00:00.000Z
Age: 2 day(s) 8 hour(s)
Status: Incomplete
-------------------
[INFO] 2024-01-03T08:00:00.000Z - === END REMINDERS ===
```

---

## Complete Testing Flow

### Step 1: Register Users

```bash
# Register regular user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"test123","role":"user"}'

# Register admin
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123","role":"admin"}'
```

### Step 2: Login and Get Tokens

```bash
# Login as user
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"test123"}')

USER_TOKEN=$(echo $USER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Login as admin
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
```

### Step 3: Create Tasks

```bash
# Create task as user
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My First Task","description":"Learning the API"}'
```

### Step 4: Update Task

```bash
# Get task ID from previous response, then update
curl -X PUT http://localhost:3000/api/tasks/TASK_ID_HERE \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'
```

### Step 5: Admin Views All Tasks

```bash
# Admin can see all users' tasks
curl -X GET http://localhost:3000/api/admin/tasks \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Step 6: Test Cron Job Manually

```bash
# Manually trigger task reminders
curl -X POST http://localhost:3000/api/cron/trigger-reminders \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Check cron job status
curl -X GET http://localhost:3000/api/cron/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Step 7: Test WebSocket (Open client-test.html)

1. Start the server: `npm run dev`
2. Open `client-test.html` in your browser
3. Paste your JWT token (USER_TOKEN or ADMIN_TOKEN)
4. Click "Connect"
5. Create/update tasks via curl and watch real-time updates!
6. Wait for scheduled cron job or trigger manually to see reminders

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Email and password are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Task not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "error": "User already exists"
}
```

---

## Architecture

```
src/
├── config/
│   ├── config.ts        # App configuration
│   └── socket.ts        # WebSocket configuration
├── controllers/         # Request handlers
│   ├── authController.ts
│   ├── taskController.ts
│   ├── adminController.ts
│   └── cronController.ts
├── database/           # Database layer
│   ├── connection.ts
│   ├── index.ts
│   ├── repositories/
│   │   ├── userRepository.ts
│   │   └── taskRepository.ts
│   └── schemas/
│       ├── User.schema.ts
│       └── Task.schema.ts
├── middleware/         # Express & Socket.IO middleware
│   ├── auth.ts
│   ├── validator.ts
│   └── errorHandler.ts
├── models/            # Data models
│   ├── User.ts
│   └── Task.ts
├── routes/            # API routes
│   ├── auth.routes.ts
│   ├── task.routes.ts
│   ├── admin.routes.ts
│   ├── websocket.routes.ts
│   └── cron.routes.ts
├── services/          # Business logic
│   ├── authService.ts
│   ├── taskService.ts
│   └── cronService.ts
└── utils/
    ├── logger.ts      # Logging utility
    ├── responses.ts   # Response helpers
    └── socketEvents.ts # WebSocket event emitters
```

---

## Technologies

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** - NoSQL Database
- **Mongoose** - MongoDB ODM
- **Socket.IO** - Real-time communication
- **node-cron** - Task scheduling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Request validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

---

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation
- Security headers with Helmet
- CORS configuration
- WebSocket authentication
- Secure cron job execution

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [node-cron Documentation](https://github.com/node-cron/node-cron)
- [JWT Documentation](https://jwt.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Mongoose Documentation](https://mongoosejs.com/)

---

## License

ISC

---

## Development

**Install dependencies:**
```bash
npm install
```

**Run in development mode:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Start production server:**
```bash
npm start
```

**Lint code:**
```bash
npm run lint
```

---

## Troubleshooting

**Port already in use:**
```bash
# Change PORT in .env file
PORT=3001
```

**WebSocket connection issues:**
- Ensure CORS_ORIGIN in .env matches your client URL
- Check if JWT token is valid and not expired
- Verify WebSocket server is initialized (check server logs)

**Authentication errors:**
- Ensure token is included in Authorization header
- Format: `Authorization: Bearer YOUR_TOKEN`
- Check token hasn't expired (default: 24h)

**Cron job not running:**
- Ensure `CRON_ENABLED=true` in .env file
- Verify cron schedule format is valid
- Check server logs for cron job initialization messages
- Manually trigger cron job via API to test

**MongoDB connection errors:**
```bash
# Check if MongoDB is running
mongosh

# If using Docker
docker ps
docker logs mongodb

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/ocreateo_db
```

**Seed data:**
```bash
npm run seed
```

**Clear database:**
```javascript
// In MongoDB shell
use ocreateo_db
db.dropDatabase()
```

---

Made with love using Express.js, TypeScript, Socket.IO, node-cron, and MongoDB