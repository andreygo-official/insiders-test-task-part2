import nodemailer from "nodemailer";

interface BookForEmail {
  name: string;
  author: string;
}

interface ExchangeEmailData {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  senderEmail: string;
  requestedBook: BookForEmail;
  offeredBooks: BookForEmail[];
}

export async function sendExchangeEmail(
  data: ExchangeEmailData
): Promise<void> {
  const {
    SMTP_HOST,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
  } = process.env;

  if (
    !SMTP_HOST ||
    !SMTP_USER ||
    !SMTP_PASS ||
    !SMTP_FROM
  ) {
    throw new Error("SMTP is not configured");
  }

  const port = Number(process.env.SMTP_PORT || 587);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const bookList = data.offeredBooks.length
    ? data.offeredBooks
        .map(
          (book, index) =>
            `${index + 1}. ${book.name} — ${book.author}`
        )
        .join("\n")
    : "У відправника поки немає власних книг.";

  await transporter.sendMail({
    from: SMTP_FROM,
    to: data.recipientEmail,
    replyTo: data.senderEmail,
    subject: `BookSwap: запит на обмін книги «${data.requestedBook.name}»`,
    text: `
Вітаємо, ${data.recipientName}!

${data.senderName} (${data.senderEmail})
хоче обміняти вашу книгу:

${data.requestedBook.name}
Автор: ${data.requestedBook.author}

Книги відправника для обміну:

${bookList}

Відповідайте на цей лист, щоб домовитися
про обмін.

Команда BookSwap
`,
  });
}