# Sea Dogs: Island Tycoon - Backend Server

Node.js backend server with Express and PostgreSQL.

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Setup PostgreSQL database:**
```bash
# Create database
createdb seadogs

# Run schema
psql seadogs < ../DATABASE_SCHEMA.sql
```

3. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. **Start server:**
```bash
npm run dev  # Development mode with auto-reload
# or
npm start    # Production mode
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Player Management
- `POST /api/players/register` - Register new player
- `POST /api/players/login` - Player login

### Island Management
- `GET /api/islands/:playerId` - Get player island data
- `POST /api/islands/:playerId/sync` - Sync game state to server

### Captains
- `GET /api/captains/:playerId` - Get player's captains

### Gacha
- `POST /api/gacha/pull` - Perform gacha pull

## Development

The server runs on `http://localhost:3001` by default.

## Production

For production deployment:
1. Set up proper environment variables
2. Use a process manager (PM2, etc.)
3. Configure reverse proxy (nginx)
4. Enable HTTPS
5. Set up database backups

