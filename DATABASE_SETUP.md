# Database Setup Guide

## Overview
The Provn platform requires a PostgreSQL database to function properly. If you're seeing "Failed to load profile" errors, it's likely because the database isn't set up yet.

## Prerequisites
- PostgreSQL 12+ installed and running
- Node.js and npm/pnpm installed

## Quick Setup

### 1. Install PostgreSQL
- **macOS**: `brew install postgresql && brew services start postgresql`
- **Ubuntu/Debian**: `sudo apt-get install postgresql postgresql-contrib`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE provn;

# Create user (optional)
CREATE USER provn_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE provn TO provn_user;

# Exit
\q
```

### 3. Set Environment Variables
Copy `.env.example` to `.env` and update the database configuration:

```bash
# Copy environment file
cp env.example .env

# Edit with your database details
DATABASE_URL=postgresql://username:password@localhost:5432/provn
# OR use individual settings:
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=provn
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
```

### 4. Run Database Schema
```bash
# Connect to your database
psql -U divyanshu -d provn

# Run the schema file
\i scripts/database-schema.sql

# Exit
\q
```

**Important**: If you're using macOS with Homebrew PostgreSQL, use your system username instead of `postgres`.

### 5. Test Connection
```bash
# Start your development server
npm run dev
# or
pnpm dev

# Check the console for database connection messages
```

## Troubleshooting

### Common Issues

#### macOS Homebrew PostgreSQL Issues
1. **"role 'username' does not exist" error**
   - **Cause**: `.env.local` file has incorrect `DATABASE_URL` with placeholder credentials
   - **Solution**: Update `.env.local` to use your actual username: `DATABASE_URL=postgresql://your_username@localhost:5432/provn`
   - **Note**: No password needed for local connections with `trust` authentication

2. **Missing columns in tables**
   - **Cause**: Database schema not fully applied
   - **Solution**: Run the complete schema script and check for missing columns like `is_public`

3. **UUID extension missing**
   - **Cause**: PostgreSQL extensions not created
   - **Solution**: Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` in your database

1. **"Failed to load profile" error**
   - Database not running
   - Wrong connection credentials
   - Tables don't exist

2. **"Database connection failed" error**
   - Check if PostgreSQL is running
   - Verify connection string in `.env`
   - Check firewall settings

3. **"User not found" error**
   - Database tables not created
   - Run the schema script

### Connection Test
```bash
# Test database connection manually
psql -U divyanshu -d provn -c "SELECT NOW();"

# Verify required extensions
psql -U divyanshu -d provn -c "SELECT gen_random_uuid();"

# Check table structure
psql -U divyanshu -d provn -c "\d users"
```

### Logs
Check your terminal/console for database connection messages:
- ✅ Database connected successfully
- ❌ Database connection error: [details]

## Development vs Production

### Development
- Use local PostgreSQL instance
- SSL disabled
- Simple authentication

### Production
- Use managed database service (e.g., AWS RDS, Heroku Postgres)
- SSL enabled
- Strong authentication and firewall rules

## Next Steps
Once the database is connected:
1. Create your first profile through the dashboard
2. Upload videos
3. Test the full application flow

## Support
If you continue to have issues:
1. Check the console logs for specific error messages
2. Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
3. Test connection manually with `psql`
4. Check the database logs: `tail -f /var/log/postgresql/postgresql-*.log`
