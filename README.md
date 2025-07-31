
# SmartBudget Canada - Personal Financial Planning Platform

## Project Overview

SmartBudget Canada is a comprehensive personal financial planning platform that helps Canadians create budgets, track expenses, and receive AI-powered financial coaching. The platform features a sophisticated guest-to-user migration system that ensures seamless data preservation during account creation.

## Key Features

- **Budget Creation**: Guided budget wizard with province-specific tax calculations
- **Guest System**: Allow anonymous users to create budgets before signing up
- **Data Migration**: Comprehensive guest-to-user budget migration on account creation
- **AI Coaching**: Personalized financial recommendations and audit system
- **Multi-User Support**: Couple budgeting with individual tax calculations
- **Financial Tools**: Mortgage calculator, debt management, net worth tracking

## Local Development Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Environment variables (see below)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd smartbudget-canada

# Navigate to app directory
cd app

# Install dependencies
yarn install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (optional)
npx prisma db seed

# Start development server
yarn dev
```

The application will be available at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the `app` directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/smartbudget"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AI Features (optional)
ABACUSAI_API_KEY="your-abacus-ai-key"
```

## Guest-to-User Migration System

The platform implements a comprehensive guest-to-user migration system that ensures zero data loss during user registration.

### System Architecture

```mermaid
sequenceDiagram
    participant G as Guest User
    participant B as Browser
    participant API as Budget API
    participant DB as Database
    participant A as Auth System

    G->>B: Create Budget (No Auth)
    B->>API: POST /api/budgets
    API->>DB: Store with guestSessionId
    DB-->>API: Budget Created
    API->>B: Set sb_guest cookie
    B-->>G: Budget Saved Successfully

    G->>B: Sign Up
    B->>A: POST /api/auth/signup
    A->>DB: Create User Account
    A->>API: POST /api/auth/migrate
    API->>DB: Transfer budgets (guestSessionId → userId)
    API->>B: Clear sb_guest cookie
    B-->>G: Account Created + Budgets Migrated

    G->>B: Access Dashboard
    B->>API: GET /api/budgets
    API->>DB: Fetch user budgets
    DB-->>API: User's Budgets (including migrated)
    API-->>B: Budget List
    B-->>G: Dashboard with All Budgets
```

### Migration Flow

1. **Guest Budget Creation**:
   - Guest creates budget without authentication
   - System generates `guestSessionId` and stores in HTTP-only `sb_guest` cookie
   - Budget stored with `guestSessionId` but no `userId`

2. **User Registration**:
   - User signs up with email/password
   - System automatically detects guest data via cookie
   - Migration API transfers all guest budgets to new user account
   - Guest cookies are cleared after successful migration

3. **Data Preservation**:
   - Zero data loss during migration process
   - Backward compatibility with legacy `guestId` system
   - Transactional updates ensure data integrity

### API Endpoints

#### Budget Management
- `GET /api/budgets` - Fetch user/guest budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/[id]` - Update existing budget
- `DELETE /api/budgets/[id]` - Delete budget

#### Migration System
- `GET /api/auth/migrate` - Check for guest data
- `POST /api/auth/migrate` - Migrate guest data to authenticated user

#### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/[...nextauth]` - NextAuth.js endpoints

## Testing

The application includes comprehensive unit tests covering the migration system:

### Running Tests

```bash
# Run all tests
npx jest

# Run specific test file
npx jest tests/guest-migration.test.ts

# Run with coverage
npx jest --coverage

# Run in watch mode
npx jest --watch
```

### Test Coverage

The test suite covers:

1. **Guest Budget Creation**: Validates `guestSessionId` generation and storage
2. **Migration Logic**: Tests budget transfer from guest to authenticated user
3. **Authenticated Creation**: Ensures proper `userId` assignment
4. **Error Handling**: Validates graceful error handling and recovery
5. **Edge Cases**: Tests scenarios with missing data or failed operations
6. **Data Retrieval**: Validates correct budget fetching for mixed data types

### Test Files

- `tests/guest-migration.test.ts` - Guest-to-user migration system tests
- `tests/budgetCoupleIncome.test.ts` - Couple budgeting functionality tests
- `tests/debt-management.test.ts` - Debt management system tests
- `tests/mortgage-budget-cards.test.ts` - Mortgage calculator tests

## Database Schema

### Key Models

```prisma
model Budget {
  id               String       @id @default(cuid())
  userId           String?      // Authenticated user ID
  guestId          String?      // Legacy guest tracking
  guestSessionId   String?      // New guest session tracking
  name             String
  province         String
  lifeSituation    String?
  grossIncome      Float        @default(0)
  netIncome        Float        @default(0)
  totalExpenses    Float        @default(0)
  disposableIncome Float        @default(0)
  federalTax       Float        @default(0)
  provincialTax    Float        @default(0)
  totalTax         Float        @default(0)
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  user             User?        @relation(fields: [userId], references: [id])
  budgetItems      BudgetItem[]
  
  @@index([guestId])
  @@index([guestSessionId])
}

model BudgetItem {
  id            String    @id @default(cuid())
  budgetId      String
  type          ItemType  // INCOME or EXPENSE
  category      String
  name          String
  amount        Float
  frequency     Frequency
  monthlyAmount Float
  owner         String?   // For couple budgeting
  budget        Budget    @relation(fields: [budgetId], references: [id])
}
```

## Technology Stack

### Backend
- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v4
- **API**: RESTful APIs with TypeScript

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui components
- **Charts**: Recharts for data visualization
- **State Management**: React hooks + NextAuth session

### Infrastructure
- **Deployment**: Vercel (recommended)
- **Database**: PostgreSQL (production)
- **Storage**: Local file system (development)

## Security Features

- **HTTP-Only Cookies**: Guest session tracking via secure cookies
- **Password Hashing**: bcryptjs for password security
- **Session Management**: NextAuth.js secure session handling
- **CSRF Protection**: Built-in Next.js CSRF protection
- **Input Validation**: Server-side validation for all inputs

## Performance Optimizations

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Next.js automatic caching and static generation
- **Code Splitting**: Automatic code splitting for optimal loading
- **Image Optimization**: Next.js Image component for optimized images

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode requirements
- Add unit tests for new features
- Update documentation for API changes
- Ensure mobile responsiveness for UI changes
- Follow existing code style and patterns

## Error Handling

The application implements comprehensive error handling:

- **API Errors**: Proper HTTP status codes and error messages
- **Frontend Errors**: Toast notifications for user feedback
- **Database Errors**: Graceful degradation and error recovery
- **Migration Errors**: Safe rollback and data integrity preservation

## Support

For questions or issues:

1. Check the [Issues](./issues) section
2. Review the documentation above
3. Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.
