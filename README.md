# Inday

A small full-stack web app where registered users post about an incident from
their day, and everyone can read a public feed. Built as a single Next.js app
(frontend + backend).

## Features

- **Auth** — email/password sign up, log in, log out (NextAuth / Auth.js,
  Credentials provider, JWT sessions, bcrypt-hashed passwords).
- **Public feed** — all posts, newest first, with author, relative time, like
  count and comment count. Cursor pagination (10 per page, "Load more").
- **Create / edit / delete posts** — max 500 chars; edit and delete are
  restricted to the post owner (enforced server-side).
- **Likes** — like/unlike with optimistic UI; a unique constraint prevents
  double-likes.
- **Comments** — max 300 chars; delete your own comments.
- **Profiles** — `/profile/[id]` shows a user, their join date and their posts.
- **Polish** — loading skeletons, error boundary, 404, empty states, toasts,
  responsive layout with a mobile hamburger menu, accessible forms.

## Tech stack

- **Next.js (App Router)** + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** components
- **Prisma ORM** + **PostgreSQL**
- **NextAuth / Auth.js v5** (Credentials, JWT) + **bcryptjs**
- **Zod** validation (shared client/server) + **React Hook Form**
- **sonner** toasts, **date-fns** for relative time

## Project structure

```
app/
  api/              Route handlers (signup, posts, likes, comments, auth)
  (pages)/          /, /login, /signup, /new, /post/[id], /profile, /profile/[id]
  loading.tsx error.tsx not-found.tsx
components/         Navbar, PostCard, Feed, forms, CommentSection, ui/ (shadcn)
lib/
  prisma.ts         Prisma client singleton
  auth.ts           NextAuth configuration
  session.ts        Server-side session helpers
  posts.ts          Feed/post queries + serialization (never leaks passwordHash)
  validations/      Zod schemas
  rate-limit.ts http.ts format.ts api-client.ts
prisma/
  schema.prisma     User / Post / Comment / Like
  seed.ts           2 demo users + 8 sample posts
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example and fill in values:

```bash
cp .env.example .env
```

- `DATABASE_URL` — Postgres connection string.
- `AUTH_SECRET` / `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`.
- `NEXTAUTH_URL` — `http://localhost:3000` in development.

### 3. Create a local database (example)

```bash
sudo -u postgres psql \
  -c "CREATE ROLE dailylog WITH LOGIN PASSWORD 'dailylog';" \
  -c "CREATE DATABASE dailylog OWNER dailylog;"
```

Then set in `.env`:

```
DATABASE_URL="postgresql://dailylog:dailylog@localhost:5432/dailylog?schema=public"
```

### 4. Run migrations and seed

```bash
npm run db:migrate     # creates tables (prisma migrate dev)
npm run db:seed        # 2 demo users + 8 posts
```

Demo accounts (password for both: `password123`):

- `ada@example.com`
- `grace@example.com`

### 5. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script             | Purpose                              |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the dev server                 |
| `npm run build`    | Production build                     |
| `npm run start`    | Start the production server          |
| `npm run lint`     | Lint                                 |
| `npm run db:migrate` | `prisma migrate dev`               |
| `npm run db:deploy`  | `prisma migrate deploy` (prod)     |
| `npm run db:seed`    | Seed demo data                     |
| `npm run db:studio`  | Open Prisma Studio                 |

## Security notes

- Passwords are bcrypt-hashed (cost 12) and `passwordHash` is never selected
  into any API response or server-component prop.
- Every mutating route checks the session and verifies ownership server-side;
  `authorId` / `userId` is always derived from the session, never the client.
- All input is validated and length-capped with Zod on the server.
- User text is rendered through React (auto-escaped); no `dangerouslySetInnerHTML`.
- Basic in-memory rate limiting guards signup, post and comment creation.
- Secrets come from environment variables only.

## Deployment (Vercel + Neon/Supabase)

1. Create a Postgres database on **Neon** or **Supabase** and copy its pooled
   connection string.
2. Push this repo to GitHub and import it into **Vercel**.
3. In Vercel project settings → Environment Variables, set:
   - `DATABASE_URL` (the Neon/Supabase string)
   - `AUTH_SECRET` and `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` (your production URL, e.g. `https://your-app.vercel.app`)
4. Run migrations against the production database:
   ```bash
   DATABASE_URL="<prod-url>" npx prisma migrate deploy
   ```
   (optionally `npm run db:seed` once for demo data).
5. Deploy. `prisma generate` runs automatically via the `postinstall` script.
