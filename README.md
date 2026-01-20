# 🏦 Professional Investment Platform

A modern, full-stack investment platform built with **Next.js 15**, **Node.js**, **TypeScript**, and **PostgreSQL**. This platform provides comprehensive investment management, trading signals, user authentication, and admin controls with a professional, expert-driven approach.

## 🚀 Features

### 🎯 Core Features
- **Modern Landing Page**: Expert-driven, non-AI focused design with interactive elements
- **User Authentication**: Complete auth system with JWT tokens and refresh tokens
- **Investment Management**: Multiple investment plans with automated profit calculations
- **Trading Signals**: Premium signal subscriptions (monthly, quarterly, annual)
- **Deposit/Withdrawal System**: Multi-chain cryptocurrency support (ETH, BSC, BTC, SOL)
- **Real-time Notifications**: Toast notifications and system alerts
- **Theme Support**: Light/dark mode with system preference detection
- **Mobile-First Design**: Fully responsive across all devices

### 👤 User Features
- **Dashboard**: Portfolio overview with investment tracking
- **Profile Management**: Update personal information and security settings
- **Transaction History**: Comprehensive transaction tracking
- **Investment Plans**: Browse and purchase investment packages
- **Trading Signals**: Access premium trading insights
- **Settings**: Theme preferences, notifications, and account management

### ⚡ Admin Features
- **Admin Dashboard**: Complete system overview and analytics
- **User Management**: User accounts, roles, and status management
- **Investment Plans Management**: CRUD operations for investment packages
- **Trading Signals Management**: Create and manage premium signals
- **Deposit/Withdrawal Processing**: Approve/reject user transactions
- **Settings Management**: System configuration and wallet management
- **Comprehensive Filtering**: Advanced search and filtering across all modules

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: Redux Toolkit
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Notifications**: Sonner
- **QR Codes**: qrcode library

### Backend (Server)
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod schemas
- **Security**: bcryptjs, rate limiting, CORS
- **Email**: Nodemailer
- **Job Scheduling**: node-cron
- **Queue Management**: Bull (Redis-based)
- **Rate Limiting**: express-rate-limit

### Database & Infrastructure
- **Primary Database**: PostgreSQL
- **ORM**: Prisma with type-safe queries
- **Caching**: Redis (for queues and caching)
- **Migrations**: Prisma Migrate
- **Environment**: dotenv configuration

## 📁 Project Structure

```
investment_site/
├── client/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/              # App Router pages and layouts
│   │   │   ├── (protected)/  # Protected user routes
│   │   │   └── auth/         # Authentication pages
│   │   ├── components/       # Reusable UI components
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and configurations
│   │   ├── redux/            # State management
│   │   └── types/            # TypeScript type definitions
│   ├── public/               # Static assets
│   └── package.json
│
├── server/                   # Node.js backend application
│   ├── src/
│   │   ├── controllers/      # Route handlers and business logic
│   │   ├── middlewares/      # Express middlewares
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Business logic services
│   │   ├── cron/             # Scheduled jobs
│   │   ├── queues/           # Background job queues
│   │   ├── lib/              # Utilities and helpers
│   │   └── types/            # TypeScript type definitions
│   ├── prisma/               # Database schema and migrations
│   │   ├── schema.prisma     # Prisma schema
│   │   └── migrations/       # Database migrations
│   └── package.json
│
└── README.md                 # Project documentation
```

## 🔧 Installation & Setup

### Prerequisites
- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **Redis** 6.x or higher (for queues)
- **Git**

### 1. Clone the Repository
```bash
git clone <repository-url>
cd investment_site
```

### 2. Environment Configuration

Create environment files for both client and server:

#### Server Environment (`server/.env`)
```env
# Application
PORT=8000
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/investment_db"

# JWT Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here
REFRESH_TOKEN=your_super_secure_refresh_token_secret_here

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_if_needed

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# External APIs
COINGECKO_API_KEY=your_coingecko_api_key_if_needed
```

#### Client Environment (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME="Investment Platform"
```

### 3. Install Dependencies

#### Install Server Dependencies
```bash
cd server
npm install
```

#### Install Client Dependencies
```bash
cd ../client
npm install
```

### 4. Database Setup

#### Initialize the Database
```bash
cd ../server
npx prisma migrate deploy
npx prisma generate
```

#### Seed Initial Data (Optional)
```bash
# Run any seeding scripts if available
npx prisma db seed
```

### 5. Start Development Servers

#### Start the Backend Server
```bash
cd server
npm run dev
```

#### Start the Frontend Application (in a new terminal)
```bash
cd client
npm run dev
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Status**: http://localhost:8000/status

## 🎯 Key Features Walkthrough

### User Journey
1. **Landing Page**: Professional hero section with expert-driven messaging
2. **Registration**: Secure account creation with email verification
3. **Dashboard**: Personal investment overview and portfolio tracking
4. **Investments**: Browse and purchase investment plans
5. **Deposits**: Multi-chain cryptocurrency deposit system
6. **Trading Signals**: Access premium trading insights
7. **Profile & Settings**: Complete account management

### Admin Journey
1. **Admin Dashboard**: System-wide analytics and overview
2. **User Management**: Manage user accounts, roles, and statuses
3. **Investment Plans**: Create and manage investment packages
4. **Transaction Processing**: Approve/reject deposits and withdrawals
5. **Trading Signals**: Create and manage premium signals
6. **System Settings**: Configure wallets, notifications, and system parameters

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Refresh Tokens**: Automatic token renewal
- **Password Hashing**: bcryptjs with salt rounds
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Zod schema validation
- **CORS Protection**: Configured for production
- **SQL Injection Prevention**: Prisma ORM protection
- **XSS Protection**: Input sanitization

## 🚀 Production Deployment

### Prerequisites for Production
- **Domain**: Custom domain with SSL certificate
- **Database**: PostgreSQL instance (AWS RDS, DigitalOcean, etc.)
- **Redis**: Redis instance for queues and caching
- **Email Service**: SMTP service for notifications

### Build Commands

#### Build Frontend
```bash
cd client
npm run build
npm run start
```

#### Build Backend
```bash
cd server
npm run build
npm start
```

### Environment Variables for Production
Update environment variables with production URLs and secure secrets:

```env
# Production API URL
CLIENT_URL=https://yourdomain.com
DATABASE_URL=postgresql://prod_user:secure_password@prod-db:5432/investment_prod

# Secure secrets (use strong, unique values)
JWT_SECRET=production_jwt_secret_very_long_and_secure
REFRESH_TOKEN=production_refresh_token_very_long_and_secure
```

## 🧪 Available Scripts

### Client Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Server Scripts
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
```

### Database Scripts
```bash
npx prisma migrate dev    # Create and apply new migration
npx prisma migrate deploy # Apply migrations in production
npx prisma generate       # Generate Prisma Client
npx prisma studio         # Open Prisma Studio GUI
npx prisma db seed        # Run seed scripts
```

## 📊 Database Schema Overview

### Core Models
- **User**: Authentication, profile, and role management
- **Account**: User account details and verification
- **InvestmentPlan**: Available investment packages
- **Investment**: User investment records
- **Transaction**: Deposit, withdrawal, and investment transactions
- **TradeSignal**: Premium trading signals
- **Settings**: System configuration

### Key Relationships
- Users have multiple investments and transactions
- Investment plans define available packages
- Trading signals are subscription-based
- Settings control system behavior

## 🎨 UI/UX Design Principles

### Design System
- **Colors**: Professional blue/green palette with dark mode
- **Typography**: Modern, readable font hierarchy
- **Spacing**: Consistent 8px grid system
- **Components**: Radix UI primitives for accessibility
- **Animations**: Subtle transitions and micro-interactions

### Responsive Design
- **Mobile-First**: Designed for mobile, enhanced for desktop
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-Friendly**: Appropriate touch targets and spacing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Zod for runtime validation
- Write meaningful commit messages
- Test thoroughly before submitting
- Maintain consistent code style

## 📝 API Documentation

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/me` - Get current user
- `PUT /auth/me/password` - Update password

### Investment Endpoints
- `GET /investment-plans` - Get all investment plans
- `POST /investments` - Create new investment
- `GET /investments` - Get user investments

### Transaction Endpoints
- `POST /deposits` - Create deposit
- `GET /deposits` - Get user deposits
- `POST /withdrawals` - Create withdrawal
- `GET /transactions` - Get transaction history

### Admin Endpoints
- `GET /admin/users` - Get all users (Admin only)
- `PUT /admin/users/:id/status` - Update user status (Admin only)
- `GET /admin/transactions` - Get all transactions (Admin only)

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
psql -U postgres -l
```

#### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # or :8000

# Kill process
kill -9 <PID>
```

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **Prisma** for the excellent ORM
- **Radix UI** for accessible components
- **Tailwind CSS** for the utility-first approach
- **shadcn/ui** for the component library

## 📞 Support

For support, email support@yourplatform.com or open an issue in this repository.

---

**Built with ❤️ for professional investment management**
