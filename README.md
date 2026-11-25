# Rainbound

<p align="center">
  <strong>A personal space for your books and reading journey.</strong>
</p>

<p align="center">
  A full-stack book management application built with Next.js, Prisma, PostgreSQL, and Cloudinary.
</p>

<p align="center">
  <a href="https://rainbound.vercel.app">Live Demo</a>
  &nbsp;&middot;&nbsp;
  <a href="https://www.figma.com/design/kVktZSQ9hyPnLbTLgkpAA4/Rainbound?node-id=77-667&t=mSs14KiP1G4yguAA-1">Figma Prototype</a>
</p>

---

## About

Rainbound is a personal book manager designed to make organizing and keeping track of a reading library simple and enjoyable.

The application allows users to catalog their books, track reading progress, manage reading statuses, add personal notes, and rate completed or ongoing reads.

A book can be used simply as a library entry or as an active reading space where its progress and information can be updated over time.

The project was built as a full-stack application, combining a responsive frontend with server-side rendering, server actions, persistent PostgreSQL data, and cloud-based image storage.

## Features

- Responsive personal book library
- Accounts with username or email login; open sign-up with manual approval
  (each approved user has their own shelf)
- Book cards with cover images
- Spine view: every spine has a bookmark ribbon whose color (the same status
  colors as the cover view) and tip show the status (flat: want to read,
  V: reading, round: read, torn: abandoned); spines avoid the status colors so
  the ribbon always stands out, and the status filter buttons show the same
  ribbons as a legend
- Search by title or creator
- Filter books by reading status
- Reader bookmarks: forward-only "where I stopped" plus named bookmarks
- Reading session: clock, stopwatch and timer (presets or a typed time) in the
  reader footer and in a home widget, sharing the same session (stored in the
  browser only); an on-screen notice when the timer ends; each part can be
  hidden in the reader settings
- Reading streak: consecutive days reading a daily goal (10 min by default,
  adjustable). Counts the reader while in use and the session stopwatch/timer
  (for books read outside the app); a calendar day without the goal resets it.
  Shown in a home widget and in the reader footer, with a notice when the day
  is secured. The admin has a "Sequência" tab to test it on their own account
- Preferences that follow the account on any device: reader theme, EPUB text
  size and footer items, and the library view and sort (PDF/CBZ zoom and the
  home widget layout stay per device)
- Customizable home widgets: two carousels with tabs; each widget has a wide
  (top) and a side-by-side (bottom) version; layout saved per device. Widgets:
  books by status, reading now, recently added, queue, session, streak, almost
  there (over 70%), stalled (no progress for 30+ days, with resume/abandon),
  year activity (one square per day) and minutes this week. Book widgets
  (reading now, recently added, queue, almost there, stalled) can show covers
  or spines, chosen per tab in the editor
- Add, edit, and delete books
- Storage limit per user for book files (1 GB by default, adjustable per user
  by the admin in "Users and storage": presets or a custom value, plus the
  total used against the 10 GB free R2 tier); deleting a book, replacing its file or removing only the file
  (the book stays on the shelf with its status and progress) frees the space in R2
- Reading statuses:
  - Want to read
  - Reading
  - Read
  - Abandoned

- Current page and total pages tracking
- Books without a file (physical, Kindle, other apps): log the current page
  (or a percentage) by hand on the book page; status moves to "Reading" on the
  first entry and to "Read" on the last page
- Status follows the in-app reader too: the first page turned moves the book to
  "Reading" and reaching 100% moves it to "Read"
- Reading progress indicator
- Book ratings
- Categories
- Personal notes
- Book cover uploads
- Responsive forms for desktop and mobile
- Persistent PostgreSQL database
- Server-side operations with Next.js Server Actions

## Tech Stack

### Frontend & Backend

- **Next.js 16** — App Router, SSR, and Server Actions
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Lucide Icons**
- **lucide-react-motion**
- **Motion** — scroll animations (home)
- **DOMPurify** — sanitizes EPUB chapters before rendering
- **Better Auth** — authentication (users and sessions stored in PostgreSQL via Prisma)

### Database

- **PostgreSQL 16**
- **Prisma 7**
- **Supabase**

### Infrastructure & Services

- **Docker Compose** — local development environment
- **Vercel** — production hosting and deployment
- **Cloudinary** — book cover image storage and management
- **Cloudflare R2** — book file storage (EPUB, PDF, CBZ)
- **GitHub** — source control and CI/CD integration

## Architecture

Rainbound uses different infrastructure for local development and production.

### Local Development

```text
Docker Compose
      │
      ├── Next.js
      │
      └── PostgreSQL
```

Docker provides an isolated development environment containing both the application and database.

### Production

```text
                  GitHub
                     │
                     ▼
                  Vercel
                     │
              Next.js Application
                │           │
                ▼           ▼            ▼
           Supabase     Cloudinary   Cloudflare R2
           PostgreSQL   Book Covers  Book Files
```

The application source code is hosted on GitHub and automatically deployed to Vercel.

Next.js handles the application, server-side rendering, and server actions. Prisma provides database access, while Supabase hosts the production PostgreSQL database.

Cloudinary is used to store and manage uploaded book covers instead of storing image files directly in the application or database.

Book files (EPUB, PDF, CBZ) live in Cloudflare R2. They never pass through the Next.js server: the browser uploads and downloads them directly with short-lived presigned URLs generated by the server.

## Production Deployment

The production environment is hosted using **Vercel**, **Supabase**, **Cloudinary**, and **Cloudflare R2**.

### Vercel

Vercel hosts the Next.js application and handles production deployments directly from the GitHub repository.

Every new commit pushed to the configured production branch can trigger a new deployment, making the deployment workflow simple and integrated with source control.

Environment variables such as database credentials and Cloudinary API credentials are configured directly in the Vercel project rather than being committed to the repository.

### Supabase

Supabase provides the production PostgreSQL database used by Rainbound.

Prisma connects to Supabase PostgreSQL through its connection poolers, allowing the application to work with the database in a serverless production environment.

The database schema and migrations are managed with Prisma.

### Cloudinary

Cloudinary handles book cover storage.

When a book cover is uploaded, the image is sent to Cloudinary and the resulting URL and public identifier are stored with the book record in PostgreSQL.

This keeps image files separate from the application server while allowing covers to be efficiently delivered through Cloudinary's infrastructure.

### Authentication

Authentication uses **Better Auth** with the Prisma adapter, so users, sessions and passwords live in the app's own database (local Docker Postgres in development, Supabase in production). No extra service or project is needed.

- Sign in with **username or email** and password (username plugin).
- Anyone can request access at `/cadastro`; the account starts as `PENDING` and only sees the waiting screen until the admin approves it at `/admin`.
- The account created with `ADMIN_EMAIL` is approved and made admin automatically, and receives the books created before authentication existed.
- Every page, Server Action and API route checks the session and only touches the current user's books. `proxy.ts` only redirects visitors without a session cookie to `/login`.
- Login and sign-up attempts are rate limited (stored in the database, so it works across serverless instances).
- Password reset by email is not available yet; the admin resets it manually.

### Cloudflare R2

R2 stores the book files (up to 200 MB each) under `books/<uuid>.<ext>`. Downloads from R2 have no egress fees.

- Use one bucket for local development and another for production.
- Create an API token with **Object Read & Write** limited to the bucket.
- Configure the bucket CORS policy so the browser can upload and read files:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["Content-Length", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Environment Variables

Create a local `.env` file with the required environment variables:

```env
DATABASE_URL=
DIRECT_URL=

BETTER_AUTH_SECRET=   # openssl rand -base64 32
BETTER_AUTH_URL=      # http://localhost:3000 locally, the site URL in production
ADMIN_EMAIL=          # account created with this email is approved as admin

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

For production, these variables should be configured through the hosting platform rather than committed to the repository.

A `.env.example` file is included as a reference without exposing credentials.

## Running Locally

### Requirements

- Node.js
- Docker Desktop
- Docker Compose
- Git

### Start the development environment

From the project root:

```bash
docker compose up --build
```

The application will be available at:

```text
http://localhost:3000
```

Docker Compose starts both the Next.js application and the PostgreSQL database.

### Database Commands

Create and apply a migration after changing `prisma/schema.prisma`:

```bash
docker compose exec app npx prisma migrate dev --name describe-your-change
```

Regenerate the Prisma Client:

```bash
docker compose exec app npx prisma generate
```

Check running services:

```bash
docker compose ps
```

Stop the development environment:

```bash
docker compose down
```

To also remove the PostgreSQL Docker volume:

```bash
docker compose down -v
```

## Available Scripts

```bash
npm run dev       # Start the development server
npm run lint      # Run ESLint
npm run build     # Generate Prisma Client and create a production build
npm run start     # Start the production server
```

## Project Structure

```text
app/
├── (auth)/             Login, sign-up (access request) and waiting screen
├── (main)/             Pages with Navbar and Footer
│   ├── admin/          Admin only: access requests (approve / reject), users' storage (?aba=usuarios) and streak tests (?aba=sequencia)
│   ├── dashboard/      Dashboard
│   ├── library/        Library list, new book, book details and server actions
│   └── u/[username]/   Public profile (avatar, bio, follow, numbers; private profiles show only the header), plus seguidores/ and seguindo/ lists (open as a modal over the profile via @modal intercepted routes; full page when opened directly)
├── api/auth/[...all]/  Better Auth endpoints
├── api/reading-progress/  Saves progress sent by sendBeacon when the reader tab closes
├── api/reading-time/   Receives reading time for the streak (fetch every minute, sendBeacon on close)
├── read/[id]/          In-app reader
├── read/actions.ts     Reading progress and bookmark server actions
└── streak/actions.ts   Daily reading goal server action

components/             Reusable UI components (folders in lowercase kebab-case)
├── reader/             In-app reader (see components/reader/README.md): engines/, panels/, hooks/
├── reading-session/    Clock, stopwatch and timer shared by the reader and the home widget
├── reading-streak/     Reading streak: time tracker, footer button, widgets (streak, year activity, week), goal picker, notice
├── profile/            Profile: avatar (color + letter), header, numbers and editors
├── widgets/            Home widgets (registry.tsx) and carousel
│   ├── editor/         Layout editor: home map, widget options panel, catalog with previews, layout edits
│   └── parts/          Shared book pieces: card row, spine shelf, lying stack, featured book, list
├── books/              Book display: poster, spine, bookcase, status ribbon, progress, actions menu
│   └── forms/          Book forms: edit, log reading, cover and file inputs, Open Library search
├── library/            Library controls: filters, search, pagination, view toggle, storage meter
├── home/               Public home page sections
├── rain-window/        Animated rain window (home hero)
├── layout/             Navbar and footer
├── auth/               Login, sign-up and sign-out
├── admin/              Admin controls (storage limit picker)
└── common/             Generic pieces: submit/back buttons, scroll reveal, NoSsr, field styles

lib/
├── auth/
│   ├── server.ts         Better Auth configuration (username plugin, approval, rate limit)
│   ├── client.ts         Browser auth client and translated error messages
│   └── session.ts        Current user helpers (requireApprovedUser, requireAdmin...)
├── books/
│   ├── files.ts          Book file formats and size limits
│   ├── labels.ts         Status/type labels and colors, default cover, page count, book page tabs
│   ├── library.ts        Library listing: sort, view, pagination and filter links
│   ├── upload.ts         Cover and book file uploads (server)
│   ├── clientUpload.ts   Browser upload straight to R2 (presigned URL)
│   ├── quota.ts          Per-user storage usage and limit checks
│   ├── cache.ts          Browser cache of downloaded PDF/CBZ/EPUB files
│   ├── comicFiles.ts     CBZ page rules (image types, ordering, unzip)
│   ├── comicCompression.ts  Browser-side CBZ page compression before upload
│   ├── spine.ts          Bookshelf spine look (color, width, height)
│   └── utils.ts          Book file read URL and id parsing
├── reading/
│   ├── progress.ts       Reading progress (forward-only), manual log and bookmark validation
│   └── pages.ts          Current/total pages from a progress locator ("pág. X de Y" on hover)
├── streak/
│   ├── rules.ts          Reading streak rules and dates (shared by server and browser)
│   ├── server.ts         Reading streak in the database (summary, recording time, goal)
│   └── admin.ts          Reading streak test helpers for the admin "Sequência" tab
├── profile/
│   ├── avatar.ts         Profile avatar: 12-color palette, letter, defaults from the account
│   ├── rules.ts          Profile rules shared by server and browser (bio length, username)
│   ├── server.ts         Profile by username and the header numbers
│   └── follow.ts         Follow / unfollow (free, no approval) and the followers / following lists
├── preferences/
│   ├── rules.ts          Account preferences (reader, library view and sort): shape and validation
│   └── server.ts         Account preferences in the database (User.preferences)
├── services/
│   ├── prisma.ts         Prisma client configuration
│   ├── r2.ts             Cloudflare R2 client (presigned URLs, book file storage)
│   └── cloudinary.ts     Cloudinary configuration
├── dashboardLayout.ts    Home widget layout (tabs, widgets, cookie parsing)
├── swipe.ts              Touch swipe gesture (reader and widget carousel)
└── useNow.ts             Current time hook, one shared 1 s tick (clocks and reading session)

prisma/
├── schema.prisma        Database schema
└── migrations/          Database migrations

proxy.ts                 Redirects to /login when there is no session cookie

public/                  Static assets

generated/
└── prisma/              Generated Prisma Client
```

The Prisma Client inside `generated/prisma` is generated automatically during the build process and is not required to be committed to the repository.

## Design & Prototyping

The interface, layout, and navigation flows were designed and prototyped in Figma before implementation.

Explore the complete prototype:

<p align="center">
  <a href="https://www.figma.com/design/kVktZSQ9hyPnLbTLgkpAA4/Rainbound?node-id=77-667&t=mSs14KiP1G4yguAA-1">
    <img src="https://img.shields.io/badge/View%20Figma%20Prototype-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="View Figma Prototype">
  </a>
</p>

## Future Plans

Some ideas planned for future versions include:

- In-app book reading
- Reading sessions and history
- Statistics and reading insights
- More advanced library filters
- Custom shelves and collections

## License

This project is intended for personal and portfolio use.
