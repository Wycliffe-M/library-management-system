# Library Management System

A full-stack library management system built with React and NestJS.

## Setup (API)

1. `cd api`
2. `npm install`
3. Copy `.env.example` to `.env` and put your own PostgreSQL credentials in `DATABASE_URL`
4. `npx prisma migrate dev`
5. `npx prisma db seed`
6. `npm run start:dev`

## Schema Decisions

### Why Book references Genre instead of embedding it

Each `Book` stores a `genreId` foreign key that points to a row in the `Genre` table, rather than carrying its own copy of the genre's name and slug.

- **One source of truth.** A genre's name lives in exactly one row. Renaming "Science Fiction" is a single update, and every book reflects it. If each book embedded its own copy, I would have to find and edit every book, and a missed one would leave inconsistent data.
- **No typos or duplicates.** Books can only point to a genre that exists, because the database enforces the foreign key. Embedded text could end up as "Sci-Fi", "SciFi" and "Science Fiction" on different books.
- **Easy queries.** Listing all books in a genre is a simple filter on `genreId`, and listing all genres is a simple read of the `Genre` table.
- **A natural fit for relational data.** Genres are shared by many books, and PostgreSQL is built to express this kind of one-to-many relationship.

### Other decisions

- **`Role` enum (`PATRON`, `LIBRARIAN`).** A user's role can only be one of these two values, so invalid roles are rejected by the database.
- **`totalCopies` and `availableCopies`.** Separate fields let the system track how many copies exist and how many can currently be borrowed.
- **Unique fields.** `isbn` on `Book`, `email` on `User`, and `name` and `slug` on `Genre` are unique, to prevent duplicate records.
