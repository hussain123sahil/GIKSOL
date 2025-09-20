# Student-Mentor Connection Platform

A full-stack web application built with Angular and Node.js that connects students with mentors for educational guidance and support.

## 🚀 Features

- **User Authentication**: Secure login/register system with JWT tokens
- **Role-based Access**: Separate interfaces for students and mentors
- **Mentor Discovery**: Browse and search for mentors by expertise
- **Connection System**: Request and manage mentor-student connections
- **Real-time Messaging**: Socket.io powered chat system (coming soon)
- **Profile Management**: Update user profiles and preferences
- **Responsive Design**: Mobile-friendly interface

## 🛠️ Tech Stack

### Frontend
- **Angular 20** - Modern web framework
- **TypeScript** - Type-safe JavaScript
- **SCSS** - Enhanced CSS styling
- **Angular Material** - UI component library
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Socket.io** - Real-time bidirectional communication
- **bcryptjs** - Password hashing

## 📋 Prerequisites

- Node.js (v20.19+ or v22.12+)
- npm (comes with Node.js)
- MongoDB (local installation or MongoDB Atlas)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd student-mentor-platform
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the backend directory:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/student-mentor-platform

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:4200
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

### 5. Start the Application

#### Start Backend Server
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd frontend
ng serve
```
The frontend will run on `http://localhost:4200`

## 📁 Project Structure

```
student-mentor-platform/
├── backend/                 # Node.js/Express API
│   ├── models/             # Mongoose schemas
│   │   ├── User.js
│   │   ├── Mentor.js
│   │   ├── Student.js
│   │   └── Connection.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── mentors.js
│   │   ├── students.js
│   │   ├── connections.js
│   │   └── messages.js
│   ├── middleware/         # Custom middleware
│   │   └── auth.js
│   ├── config/             # Configuration files
│   ├── server.js           # Main server file
│   └── package.json
├── frontend/               # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # Angular components
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── dashboard/
│   │   │   │   └── mentor-list/
│   │   │   ├── services/  # Angular services
│   │   │   │   └── auth.ts
│   │   │   ├── app.ts
│   │   │   ├── app.routes.ts
│   │   │   └── app.config.ts
│   │   └── styles.scss     # Global styles
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile

### Mentors
- `GET /api/mentors` - Get all mentors
- `GET /api/mentors/:id` - Get mentor by ID
- `POST /api/mentors` - Create mentor profile
- `PUT /api/mentors/profile` - Update mentor profile
- `GET /api/mentors/search/expertise` - Search mentors by expertise

### Students
- `GET /api/students/profile` - Get student profile
- `POST /api/students` - Create student profile
- `PUT /api/students/profile` - Update student profile

### Connections
- `POST /api/connections/request` - Send connection request
- `GET /api/connections/mentor/requests` - Get mentor requests
- `PUT /api/connections/:id/respond` - Respond to connection request
- `GET /api/connections/student/connections` - Get student connections

## 🎯 Usage

### For Students
1. Register as a student
2. Complete your profile with learning goals
3. Browse available mentors
4. Send connection requests
5. Communicate with accepted mentors

### For Mentors
1. Register as a mentor
2. Complete your mentor profile with expertise and rates
3. Set your availability
4. Review and respond to student requests
5. Manage your student connections

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Protected routes with middleware
- Input validation and sanitization
- CORS configuration

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or use a cloud MongoDB service
2. Update environment variables for production
3. Deploy to platforms like Heroku, AWS, or DigitalOcean

### Frontend Deployment
1. Build the Angular app: `ng build --prod`
2. Deploy the `dist/` folder to platforms like Netlify, Vercel, or AWS S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## 🔮 Future Enhancements

- [ ] Real-time messaging system
- [ ] Video call integration
- [ ] Payment processing for paid sessions
- [ ] Advanced search and filtering
- [ ] Mobile app development
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Session recording and notes
- [ ] Rating and review system
- [ ] Group mentoring sessions

---

**Happy Learning! 🎓**
