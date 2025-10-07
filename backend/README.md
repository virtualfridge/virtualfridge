# Backend Setup

## Requirements

- [Node.js](https://nodejs.org/en/download/) 18+ installed on your machine
- [MongoDB](https://www.mongodb.com/) instance running locally or remotely

## Setup

1. **Install dependencies**:

   ```
   npm install
   ```

2. **Environment Configuration**: Create a `.env` file in the root directory using the following format:

   ```
    PORT=3000
    JWT_SECRET=your_generated_secret_value
    GOOGLE_CLIENT_ID=google_web_client_id
    MONGODB_URI=mongodb_uri
   ```

3. **Start development server**: Start development server with ts-node with auto-reload
   ```
   npm run dev
   ```

## Build and Run

- **Build**: Compile TypeScript to JavaScript
  ```
  npm run build
  ```
- **Start production**: Run compiled JavaScript
  ```
  npm start
  ```

## API Endpoints

The server runs on port 3000 (configurable via PORT env var) with the following routes:

- `/api/auth/*` - Authentication
- `/api/user/*` - User management
- `/api/hobbies/*` - Hobby management
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
