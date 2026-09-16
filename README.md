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
- Book cards with cover images
- Search by title or creator
- Filter books by reading status
- Add, edit, and delete books
- Reading statuses:
  - Want to read
  - Reading
  - Read
  - Abandoned

- Current page and total pages tracking
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

### Database

- **PostgreSQL 16**
- **Prisma 7**
- **Supabase**

### Infrastructure & Services

- **Docker Compose** — local development environment
- **Vercel** — production hosting and deployment
- **Cloudinary** — book cover image storage and management
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
                ▼           ▼
           Supabase     Cloudinary
           PostgreSQL   Book Covers
```

The application source code is hosted on GitHub and automatically deployed to Vercel.

Next.js handles the application, server-side rendering, and server actions. Prisma provides database access, while Supabase hosts the production PostgreSQL database.

Cloudinary is used to store and manage uploaded book covers instead of storing image files directly in the application or database.

## Production Deployment

The production environment is hosted using **Vercel**, **Supabase**, and **Cloudinary**.

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

## Environment Variables

Create a local `.env` file with the required environment variables:

```env
DATABASE_URL=
DIRECT_URL=

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
├── books/              Book pages and server actions
└── ...

components/             Reusable UI components

lib/
├── prisma.ts            Prisma client configuration
├── upload.ts            Cloudinary integration
└── ...

prisma/
├── schema.prisma        Database schema
└── migrations/          Database migrations

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
- Reading goals
- Statistics and reading insights
- More advanced library filters
- Reading streaks
- Custom shelves and collections

## License

This project is intended for personal and portfolio use.
