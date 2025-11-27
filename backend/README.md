# Backend Setup

## Requirements

- [Docker](https://www.docker.com/get-started/) installed and running on your machine. Either Docker Desktop or Docker CLI will work.
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.

## Setup

1. **Install dependencies**:
   Skip this step if you are running the backend with Docker.
   ```
   npm install
   ```

2. **Environment Configuration**: Create a `.env` file in the root directory using the following format:

   ```
   PORT=3000
   JWT_SECRET=your_generated_secret_value
   GOOGLE_CLIENT_ID=google_web_client_id
   MONGODB_URI=mongodb_uri
   MONGODB_USER=mongodb_username
   MONGODB_PASS=your_strong_password
   GEMINI_API_KEY=your_gemini_api_key
   # Optional overrides
   # GEMINI_MODEL=models/gemini-1.5-flash-latest
   # GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
   ```

3. **Start development server**: Start development server with ts-node with auto-reload
   ```
   npm run dev
   ```

## Build and Run

Start and run the Docker containers (run from this directory):
```bash
docker compose up
```
Note that on some systems `docker compose` might be installed as `docker-compose`

## API Endpoints

The server runs on port 3000 (configurable via PORT env var) with the following routes:

- `/api/auth/*` - Authentication
- `/api/user/*` - User management
- `/api/media/*` - Media uploads
  - Uploaded files are stored in the `uploads/` directory. Ensure this directory exists and has write permissions.

## Code Formatting

### Prettier Setup

Prettier is configured to automatically format your code. The configuration is in `.prettierrc`.

- **Run format checking**:
  ```
  npm run format
  ```
- **Format code**:
  ```
  npm run format:fix
  ```

**VS Code Integration**: Install the Prettier extension for automatic formatting on save.
