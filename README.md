# Library Management System

A full-stack library management system built with React and NestJS.

## Assignment Verification

All required files are committed on the `main` branch, inside the `api/` folder:

```
library-management-system/
├── README.md
└── api/
    ├── .env.example                  <- DATABASE_URL placeholder
    ├── prisma/
    │   ├── schema.prisma             <- Role enum, User, Genre, Book, Review
    │   ├── seed.ts                   <- 4 genres, 16 books
    │   └── migrations/
    │       ├── 20261107155130_init
    │       └── 20261107164536_add_review
    └── src/
        └── prisma/
            ├── prisma.module.ts
            └── prisma.service.ts     <- extends PrismaClient, OnModuleInit
```

| Requirement | File |
|---|---|
| Role enum, User, Genre, Book with `genreId` @relation | [api/prisma/schema.prisma](https://raw.githubusercontent.com/Wycliffe-M/library-management-system/main/api/prisma/schema.prisma) |
| 4 genres, 16 books seeded | [api/prisma/seed.ts](https://raw.githubusercontent.com/Wycliffe-M/library-management-system/main/api/prisma/seed.ts) |
| PrismaService extends PrismaClient, OnModuleInit, `$connect()` | [api/src/prisma/prisma.service.ts](https://raw.githubusercontent.com/Wycliffe-M/library-management-system/main/api/src/prisma/prisma.service.ts) |
| `DATABASE_URL` placeholder | [api/.env.example](https://raw.githubusercontent.com/Wycliffe-M/library-management-system/main/api/.env.example) |
| Why Book references Genre | [Schema Decisions](#schema-decisions) |
| Stretch: Review model | `Review` model in `schema.prisma`, with `@@unique([bookId, userId])` |
| Stretch: Prisma vs. a document database | [Prisma vs. a document database](#prisma-vs-a-document-database) |

Migrations are also committed: `api/prisma/migrations/20261107155130_init` and `20261107164536_add_review`.

### How the seed links books to genres

The seed links each book to its genre through the `genreId` foreign key. It first upserts the genres and records each genre's `id`, keyed by slug. Each book then carries a `genreSlug` (a lookup key only, not a database field), and the seed uses it to find the right id and set `genreId` when creating the book.

### How to verify

From the repo root:

```
cd api
npm install
cp .env.example .env     # then put your own PostgreSQL credentials in DATABASE_URL
npx prisma migrate dev
npx prisma db seed
```

Expected seed output:

```
Seeded 4 genres and 16 books.
```

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
- **`Review` model.** Links `Book` and `User`. `@@unique([bookId, userId])` limits each user to one review per book, and `comment` is optional.

### Prisma vs. a document database

One difference I noticed while modeling:

In MongoDB I would probably have stored a book's reviews as an array inside the book document. In Prisma, a `Review` is its own table with `bookId` and `userId` foreign keys, and `Book.reviews` and `User.reviews` are only the "other side" of the relation. The relation is declared in the schema and the database enforces it, whereas in MongoDB that link would be a convention my code had to keep consistent.

## Assignment Files

### api/prisma/schema.prisma

[View file](https://github.com/Wycliffe-M/library-management-system/blob/main/api/prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  PATRON
  LIBRARIAN
}

model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(PATRON)
  createdAt DateTime @default(now())
  reviews   Review[]
}

model Genre {
  id    Int    @id @default(autoincrement())
  name  String @unique
  slug  String @unique
  books Book[]
}

model Book {
  id              Int    @id @default(autoincrement())
  title           String
  author          String
  isbn            String @unique
  totalCopies     Int    @default(1)
  availableCopies Int    @default(1)
  genreId         Int
  genre           Genre  @relation(fields: [genreId], references: [id])
  reviews         Review[]
}

model Review {
  id        Int      @id @default(autoincrement())
  rating    Int
  comment   String?
  createdAt DateTime @default(now())
  bookId    Int
  userId    Int
  book      Book     @relation(fields: [bookId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([bookId, userId])
}
```

### api/prisma/seed.ts

[View file](https://github.com/Wycliffe-M/library-management-system/blob/main/api/prisma/seed.ts)

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genres = [
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Science Fiction', slug: 'science-fiction' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Non-Fiction', slug: 'non-fiction' },
];

const books = [
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', genreSlug: 'fantasy', copies: 4 },
  { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: '9780547773742', genreSlug: 'fantasy', copies: 3 },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '9780756404741', genreSlug: 'fantasy', copies: 2 },
  { title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', genreSlug: 'science-fiction', copies: 5 },
  { title: 'Neuromancer', author: 'William Gibson', isbn: '9780441569595', genreSlug: 'science-fiction', copies: 2 },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '9780441478125', genreSlug: 'science-fiction', copies: 3 },
  { title: 'Foundation', author: 'Isaac Asimov', isbn: '9780553293357', genreSlug: 'science-fiction', copies: 4 },
  { title: 'Murder on the Orient Express', author: 'Agatha Christie', isbn: '9780062693662', genreSlug: 'mystery', copies: 3 },
  { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', isbn: '9780486282145', genreSlug: 'mystery', copies: 2 },
  { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '9780307588371', genreSlug: 'mystery', copies: 3 },
  { title: 'The Big Sleep', author: 'Raymond Chandler', isbn: '9780394758282', genreSlug: 'mystery', copies: 2 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316110', genreSlug: 'non-fiction', copies: 4 },
  { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', genreSlug: 'non-fiction', copies: 3 },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', genreSlug: 'non-fiction', copies: 5 },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780135957059', genreSlug: 'non-fiction', copies: 2 },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', genreSlug: 'non-fiction', copies: 3 },
];

async function main() {
  // Create each genre (or reuse it if it already exists), and remember its id
  const genreIds: Record<string, number> = {};
  for (const g of genres) {
    const genre = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: {},
      create: g,
    });
    genreIds[g.slug] = genre.id;
  }

  // Create each book, linked to its genre by genreId
  for (const b of books) {
    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        totalCopies: b.copies,
        availableCopies: b.copies,
        genreId: genreIds[b.genreSlug],
      },
    });
  }

  console.log(`Seeded ${genres.length} genres and ${books.length} books.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### api/src/prisma/prisma.service.ts

[View file](https://github.com/Wycliffe-M/library-management-system/blob/main/api/src/prisma/prisma.service.ts)

```ts
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

### api/.env.example

[View file](https://github.com/Wycliffe-M/library-management-system/blob/main/api/.env.example)

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/library"
```