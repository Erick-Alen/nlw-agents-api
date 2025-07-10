# NLW Agents - Server

This project was developed during the **NLW Agents** week immersion provided by [Rocketseat](https://rocketseat.com.br). The event focused on building AI-powered applications using modern web technologies.

## 🚀 Technologies

This project is built with the following main technologies and libraries:

### Core Framework
- **[Fastify](https://fastify.dev/)** `^5.4.0` - High-performance web framework for Node.js
- **[@fastify/cors](https://github.com/fastify/fastify-cors)** `^11.0.1` - CORS plugin for Fastify

### Type Safety & Validation
- **[TypeScript](https://www.typescriptlang.org/)** `^5.8.3` - Static type checking
- **[Zod](https://zod.dev/)** `^4.0.0` - TypeScript-first schema validation
- **[fastify-type-provider-zod](https://github.com/turkerdev/fastify-type-provider-zod)** `^5.0.2` - Zod integration for Fastify

### Database
- **[Drizzle ORM](https://orm.drizzle.team/)** `^0.44.2` - Type-safe SQL ORM for TypeScript
- **[drizzle-kit](https://github.com/drizzle-team/drizzle-kit)** `^0.31.4` - CLI for Drizzle ORM migrations
- **[drizzle-seed](https://github.com/drizzle-team/drizzle-seed)** `^0.3.1` - Database seeding utilities
- **[postgres](https://github.com/porsager/postgres)** `^3.4.7` - PostgreSQL client for Node.js
- **[pgvector/pgvector](https://github.com/pgvector/pgvector)** - PostgreSQL extension for vector similarity search

### Development Tools
- **[@biomejs/biome](https://biomejs.dev/)** `2.0.6` - Fast formatter, linter, and more for JavaScript/TypeScript
- **[ultracite](https://github.com/unjs/ultracite)** `5.0.32` - Performance optimization and development utilities

## 🗂️ Project Structure

```
src/
├── server.ts              # Main application entry point
├── config/
│   └── env.ts             # Environment variables configuration
├── db/
│   ├── connection.ts      # Database connection setup
│   ├── seed.ts           # Database seeding script
│   ├── migrations/       # Database migration files
│   └── schema/
│       ├── index.ts      # Schema exports
│       └── rooms.ts      # Rooms table schema
└── http/
    └── routes/
        └── get-rooms.ts  # API routes
```

## 🛠️ Prerequisites

Before running this project, make sure you have:

- **Node.js** `>=20.6.0` (required for `--env-file` flag support)
- **Docker** and **Docker Compose** (for PostgreSQL database)
- **npm** or **yarn** package manager

## ⚙️ Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd server

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp example.env .env
```

Add the following environment variables to your `.env` file:

```env
DATABASE_URL="postgresql://docker:docker@localhost:5432/agents"
PORT=3333
```

### 3. Database Setup

Start the PostgreSQL database using Docker Compose:

```bash
docker-compose up -d
```

This will start a PostgreSQL 17 container with pgvector extension enabled.

### 4. Database Migration and Seeding

Run database migrations:

```bash
npx drizzle-kit push
```

Seed the database with initial data:

```bash
npm run seed
```

### 5. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3333` with hot-reload enabled.

## 📋 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm run seed` - Run database seeding script
- `npm test` - Run tests (currently not implemented)

## 🔍 API Endpoints

### Health Check
- `GET /health` - Returns server status

### Rooms
- `GET /rooms` - Retrieve all rooms

## 🐳 Docker

The project includes a Docker Compose configuration for PostgreSQL with pgvector extension. The database is configured with:

- **User:** `docker`
- **Password:** `docker`
- **Database:** `agents`
- **Port:** `5432`

## 🚦 Database Schema

The application uses Drizzle ORM with PostgreSQL. The main entities include:

### Rooms Table
- `id` - UUID primary key
- `name` - Room name (required)
- `description` - Room description (optional)
- `createdAt` - Timestamp of creation

## 📝 Notes

- The project uses Node.js experimental TypeScript support (`--experimental-strip-types`)
- CORS is configured to allow requests from `http://localhost:5173` (likely a frontend development server)
- Environment variables are loaded using Node.js `--env-file` flag
- The database uses snake_case naming convention through Drizzle ORM configuration

## 🎓 About NLW Agents

This project was created during Rocketseat's NLW Agents event, which focuses on:
- Building AI-powered applications
- Modern web development practices
- Real-time features and integrations
- Full-stack development with TypeScript

## 🤝 Contributing

This project was created for educational purposes during the NLW Agents immersion. Feel free to explore, learn, and adapt the code for your own projects.

---

**Made with ❤️ during NLW Agents by [Rocketseat](https://rocketseat.com.br)**
