# Student-Mentor Connection Platform

A comprehensive full-stack web application built with Angular 20 and Node.js that connects students with mentors for educational guidance and support. This platform facilitates meaningful mentor-student relationships through an intuitive interface and robust backend API.

## 🚀 Features

### ✅ Implemented Features
- **User Authentication**: Secure login/register system with JWT tokens
- **Role-based Access**: Separate interfaces for students, mentors, and admin
- **Mentor Discovery**: Browse and search for mentors by expertise, company, and hourly rate
- **Connection System**: Request and manage mentor-student connections
- **Profile Management**: Complete user profiles with education, certifications, and availability
- **Booking System**: Schedule mentoring sessions with preferred dates and times
- **Admin Dashboard**: Manage user approvals and platform oversight
- **Responsive Design**: Mobile-friendly interface with modern UI/UX
- **Real-time Ready**: Socket.io integration prepared for messaging

### 🔄 Coming Soon
- **Real-time Messaging**: Socket.io powered chat system
- **Video Call Integration**: Direct video calling within the platform
- **Payment Processing**: Secure payment handling for paid sessions

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
│   │   ├── User.js         # User model with authentication
│   │   ├── Mentor.js       # Mentor profile and expertise
│   │   ├── Student.js      # Student profile and goals
│   │   └── Connection.js   # Mentor-student connections
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── users.js        # User management
│   │   ├── mentors.js      # Mentor operations
│   │   ├── students.js     # Student operations
│   │   ├── connections.js  # Connection management
│   │   └── messages.js     # Messaging (placeholder)
│   ├── middleware/         # Custom middleware
│   │   └── auth.js         # JWT authentication middleware
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variables template
├── frontend/               # Angular 20 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/ # Angular standalone components
│   │   │   │   ├── home/           # Landing page
│   │   │   │   ├── login/          # User login
│   │   │   │   ├── register/       # User registration
│   │   │   │   ├── mentor-listings/# Mentor discovery
│   │   │   │   ├── mentor-profile/ # Individual mentor view
│   │   │   │   ├── mentor-dashboard/# Mentor management
│   │   │   │   ├── student-dashboard/# Student dashboard
│   │   │   │   ├── booking/        # Session booking
│   │   │   │   └── admin/          # Admin panel
│   │   │   ├── services/   # Angular services
│   │   │   │   └── auth.ts # Authentication service
│   │   │   ├── app.ts      # Main app component
│   │   │   ├── app.routes.ts # Routing configuration
│   │   │   └── app.config.ts # App configuration
│   │   ├── styles.scss     # Global styles
│   │   └── main.ts         # Application bootstrap
│   ├── angular.json        # Angular CLI configuration
│   └── package.json        # Frontend dependencies
└── README.md               # Project documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (student/mentor/admin)
- `POST /api/auth/login` - User login with JWT token
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout (client-side token removal)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/deactivate` - Deactivate user account

### Mentors
- `GET /api/mentors` - Get all mentors with filtering (expertise, rate, availability)
- `GET /api/mentors/:id` - Get mentor by ID with full profile
- `POST /api/mentors` - Create mentor profile (mentor role required)
- `PUT /api/mentors/profile` - Update mentor profile
- `GET /api/mentors/search/expertise` - Search mentors by expertise

### Students
- `GET /api/students/profile` - Get student profile
- `POST /api/students` - Create student profile (student role required)
- `PUT /api/students/profile` - Update student profile
- `GET /api/students` - Get all students (admin only)

### Connections
- `POST /api/connections/request` - Send connection request to mentor
- `GET /api/connections/mentor/requests` - Get mentor's pending requests
- `PUT /api/connections/:id/respond` - Accept/reject connection request
- `GET /api/connections/student/connections` - Get student's connections
- `PUT /api/connections/:id/cancel` - Cancel connection request

### Messages (Placeholder)
- `GET /api/messages/conversation/:mentorId` - Get conversation history
- `POST /api/messages/send` - Send message (coming soon)

### Health Check
- `GET /api/health` - API health status

## 🎯 Usage

### For Students
1. **Register** as a student with basic information
2. **Complete Profile** with learning goals, interests, and budget preferences
3. **Discover Mentors** by browsing listings or searching by expertise
4. **View Mentor Profiles** to see experience, rates, and availability
5. **Send Connection Requests** to mentors you'd like to work with
6. **Book Sessions** once connections are accepted
7. **Track Progress** through your student dashboard

### For Mentors
1. **Register** as a mentor with professional information
2. **Create Mentor Profile** with expertise areas, experience, and hourly rates
3. **Set Availability** for different days and time slots
4. **Add Credentials** including education and certifications
5. **Review Requests** from students wanting to connect
6. **Manage Connections** and respond to booking requests
7. **Track Sessions** through your mentor dashboard

### For Administrators
1. **Monitor Platform** through the admin dashboard
2. **Approve Users** and manage user accounts
3. **Review Applications** from mentors and students
4. **Oversee Connections** and platform activity
5. **Manage Content** and platform settings

## 🔒 Security Features

- **Password Security**: bcryptjs hashing with salt rounds
- **JWT Authentication**: Secure token-based authentication with expiration
- **Role-based Access Control**: Different permissions for students, mentors, and admins
- **Protected Routes**: Middleware protection for sensitive endpoints
- **Input Validation**: Comprehensive validation and sanitization
- **CORS Configuration**: Secure cross-origin resource sharing
- **Environment Variables**: Sensitive data stored in environment variables
- **Error Handling**: Secure error responses without sensitive data exposure

## 🚀 Deployment

### Backend Deployment
1. **Database Setup**: Configure MongoDB Atlas or local MongoDB instance
2. **Environment Variables**: Set production environment variables
3. **Build**: Ensure all dependencies are installed (`npm install`)
4. **Deploy**: Deploy to platforms like Heroku, AWS, DigitalOcean, or Railway
5. **Health Check**: Verify API endpoints are accessible

### Frontend Deployment
1. **Build**: Create production build with `ng build --configuration production`
2. **Optimize**: The build process includes optimization and minification
3. **Deploy**: Deploy the `dist/frontend/` folder to platforms like:
   - **Netlify**: Drag and drop deployment
   - **Vercel**: Git-based deployment
   - **AWS S3 + CloudFront**: Static website hosting
   - **GitHub Pages**: Free hosting for public repositories

### Environment Configuration
Create a `.env` file in the backend directory with:
```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

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

### Phase 2 - Communication & Payments
- [ ] **Real-time Messaging**: Socket.io powered chat system
- [ ] **Video Call Integration**: Direct video calling within the platform
- [ ] **Payment Processing**: Stripe/PayPal integration for paid sessions
- [ ] **Email Notifications**: Automated email alerts and reminders

### Phase 3 - Advanced Features
- [ ] **Advanced Search**: AI-powered mentor matching
- [ ] **Calendar Integration**: Google Calendar/Outlook sync
- [ ] **Session Recording**: Record and store mentoring sessions
- [ ] **Rating & Review System**: Post-session feedback and ratings
- [ ] **Group Mentoring**: Multi-participant sessions
- [ ] **Mobile App**: React Native or Flutter mobile application

### Phase 4 - Analytics & AI
- [ ] **Analytics Dashboard**: Platform usage and performance metrics
- [ ] **AI Recommendations**: Smart mentor-student matching
- [ ] **Progress Tracking**: Learning milestone tracking
- [ ] **Content Management**: Educational resource library

## 🛠️ Development Status

### ✅ Completed Features
- **Complete Authentication System**: JWT-based login/register with role management
- **User Management**: Student, Mentor, and Admin role-based access control
- **Mentor Discovery**: Advanced search and filtering by expertise, rate, and availability
- **Profile Management**: Comprehensive profiles with education, certifications, and preferences
- **Connection System**: Request/accept/reject mentor-student connections
- **Booking System**: Session scheduling with date/time preferences
- **Admin Dashboard**: User approval and platform management interface
- **Responsive Design**: Mobile-friendly UI with modern SCSS styling
- **RESTful API**: Complete backend with all CRUD operations
- **Database Models**: MongoDB schemas for all entities with proper validation

### 🔧 Issues Resolved
- **White Screen Issue**: Fixed by installing missing `@angular/animations` dependency
- **Template Errors**: Resolved complex expressions in Angular templates
- **TypeScript Errors**: Fixed property initialization and import issues
- **Build Errors**: All compilation errors have been resolved
- **Project Structure**: Cleaned up duplicate directories and organized codebase
- **Dependencies**: All required packages properly installed and configured

### 📊 Project Statistics
- **Frontend Components**: 9 standalone Angular components
- **Backend Routes**: 6 API route modules with 20+ endpoints
- **Database Models**: 4 Mongoose schemas with full validation
- **Authentication**: JWT-based security with role-based access
- **UI/UX**: Modern responsive design with SCSS styling

### 🚀 Quick Start
1. Clone the repository
2. Install dependencies: `npm install` in both frontend and backend directories
3. Set up environment variables in backend
4. Start backend: `npm run dev` (port 5000)
5. Start frontend: `ng serve` (port 4200)
6. Access the application at `http://localhost:4200`

## 🔧 Troubleshooting

### Common Issues

#### Frontend Issues
- **White Screen**: Ensure `@angular/animations` is installed (`npm install @angular/animations`)
- **Build Errors**: Check TypeScript errors and fix property initializations
- **Component Not Loading**: Verify routing configuration in `app.routes.ts`

#### Backend Issues
- **Database Connection**: Ensure MongoDB is running and connection string is correct
- **Port Already in Use**: Change PORT in `.env` file or kill existing process
- **JWT Errors**: Verify JWT_SECRET is set in environment variables

#### Development Issues
- **Hot Reload Not Working**: Restart the development server
- **Dependencies Issues**: Delete `node_modules` and run `npm install` again
- **TypeScript Errors**: Check for proper type definitions and imports

### Getting Help
1. Check the browser console for frontend errors
2. Check the terminal for backend errors
3. Verify all environment variables are set correctly
4. Ensure all dependencies are installed

---

**Happy Learning! 🎓**

*Built with ❤️ using Angular 20 and Node.js*
