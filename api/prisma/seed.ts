import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genres = [
  { name: 'Fantasy', slug: 'fantasy' },
  { name: 'Science Fiction', slug: 'science-fiction' },
  { name: 'Mystery', slug: 'mystery' },
  { name: 'Non-Fiction', slug: 'non-fiction' },
];

const books = [
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', genre: 'fantasy', copies: 4 },
  { title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', isbn: '9780547773742', genre: 'fantasy', copies: 3 },
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', isbn: '9780756404741', genre: 'fantasy', copies: 2 },
  { title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', genre: 'science-fiction', copies: 5 },
  { title: 'Neuromancer', author: 'William Gibson', isbn: '9780441569595', genre: 'science-fiction', copies: 2 },
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', isbn: '9780441478125', genre: 'science-fiction', copies: 3 },
  { title: 'Foundation', author: 'Isaac Asimov', isbn: '9780553293357', genre: 'science-fiction', copies: 4 },
  { title: 'Murder on the Orient Express', author: 'Agatha Christie', isbn: '9780062693662', genre: 'mystery', copies: 3 },
  { title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', isbn: '9780486282145', genre: 'mystery', copies: 2 },
  { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '9780307588371', genre: 'mystery', copies: 3 },
  { title: 'The Big Sleep', author: 'Raymond Chandler', isbn: '9780394758282', genre: 'mystery', copies: 2 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316110', genre: 'non-fiction', copies: 4 },
  { title: 'Educated', author: 'Tara Westover', isbn: '9780399590504', genre: 'non-fiction', copies: 3 },
  { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', genre: 'non-fiction', copies: 5 },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780135957059', genre: 'non-fiction', copies: 2 },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', genre: 'non-fiction', copies: 3 },
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
        genreId: genreIds[b.genre],
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