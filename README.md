# Daymark

A small private to-do app built with Next.js, plain JavaScript, and SQLite. Each account has its own task list; passwords are bcrypt-hashed and session tokens are stored only as SHA-256 hashes.

## Requirements

- Node.js 18.18 or newer
- npm
- For Vercel deployment, a Turso database (Vercel's local filesystem is not persistent)

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create a local environment file:

   ```sh
   cp .env.example .env
   ```

   The default `DATABASE_URL=file:./todo.db` creates a SQLite database in the project directory. The `.db` file is ignored by git.

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Open <http://localhost:3000>, create an account, then log in.

The database tables and indexes are created automatically the first time the app accesses SQLite. Their definitions are also in `db/schema.sql`.

## Tests

Run the authentication and task ownership integration tests with:

```sh
npm test
```

The tests create temporary SQLite databases and remove them when complete.

## Deploy to Vercel

SQLite files on Vercel are ephemeral, so use Turso for persistent storage:

1. Create a Turso database and generate a database auth token.
2. In the Vercel project settings, set `TURSO_DATABASE_URL` to the database URL and `TURSO_AUTH_TOKEN` to the generated token.
3. Deploy the project. The app initializes its tables on first use.

Do not commit `.env`; it is ignored by git. Set deployment secrets in the Vercel project environment settings.

## Security behavior

- Passwords use bcrypt with a work factor of 12.
- Login errors do not reveal whether a username exists.
- Session cookies are HttpOnly and SameSite=Lax; production cookies are Secure.
- Task list, completion, and deletion queries always include the authenticated user's ID. A task owned by another account is treated as not found.
- Usernames are case-insensitive and limited to 3–32 letters, numbers, or underscores. Passwords must be 8–128 characters; task text must contain non-whitespace content and be at most 500 characters.