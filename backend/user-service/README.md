# User Management Service

## Overview
This microservice handles user registration, authentication, and role-based access control (RBAC) for the WubLand Portfolio platform. It supports roles such as user, broker, admin, and support_agent, with broker verification by admins.

## Features
- User registration with email, password, and role.
- User login with JWT token generation.
- Broker verification by admins.
- RBAC for access control.

## API Endpoints
- `POST /api/user/register` - Register a new user.
- `POST /api/user/login` - Authenticate and get JWT.
- `PUT /api/user/verify-broker/:id` - Verify a broker (admin only).

## Setup
1. Install dependencies: `npm install`.
2. Configure `.env` with PORT, JWT_SECRET, and DB credentials.
3. Ensure MySQL database `wubland_portfolio_db` is set up with `users` table.
4. Run: `npm start`.

## Dependencies
- express
- mysql2
- jsonwebtoken
- bcrypt
- cors
- dotenv

## Notes
- Uses shared DB connection from `../shared/db.js`.
- Security: JWT for auth, bcrypt for password hashing.