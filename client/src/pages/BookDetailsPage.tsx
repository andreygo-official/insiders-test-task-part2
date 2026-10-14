
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Mail,
  Trash2,
  UserRound,
} from "lucide-react";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { Book } from "../types";

export function BookDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBook() {
      setLoading(true);
      setError("");
      setSuccess("");
      setBook(null);

      try {
        const data = await api<Book>(`/books/${id}`);
        if (active) setBook(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Не вдалося завантажити книгу"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBook();

    return () => {
      active = false;
    };
  }, [id]);

  async function requestExchange() {
    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const result = await api<{ message: string }>(
        `/books/${id}/exchange`,
        { method: "POST" }
      );
      setSuccess(result.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося відправити запит"
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteBook() {
    if (!window.confirm("Справді видалити цю книгу?")) return;

    setBusy(true);
    setError("");

    try {
      await api<void>(`/books/${id}`, {
        method: "DELETE",
      });
      navigate("/books");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Помилка видалення"
      );
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-12 text-center text-stone-500">
        Завантаження книги...
      </main>
    );
  }

  if (!book) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-2xl font-bold">Книгу не знайдено</h1>
        <p className="mt-3 text-red-700">{error}</p>
        <Link to="/books" className="mt-5 inline-block text-emerald-800 underline">
          Повернутися до каталогу
        </Link>
      </main>
    );
  }

  const isOwner = user?.id === book.ownerId;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <Link
        to="/books"
        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-emerald-800"
      >
        <ArrowLeft size={17} />
        До каталогу
      </Link>

      <div className="grid gap-10 md:grid-cols-[1fr_1.1fr]">
        <div className="flex min-h-96 items-center justify-center rounded-3xl bg-gradient-to-br from-[#e7e9dd] to-[#e9d6bb] p-10">
          {book.photoUrl ? (
            <img
              src={book.photoUrl}
              alt={book.name}
              className="max-h-[460px] w-full object-contain drop-shadow-2xl"
            />
          ) : (
            <div className="flex h-80 w-60 items-center justify-center rounded-r-xl border-l-14 border-emerald-950 bg-emerald-800 text-white shadow-2xl">
              <BookOpen size={84} strokeWidth={1} />
            </div>
          )}
        </div>

        <section className="flex flex-col justify-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-700">
            Книга для обміну
          </p>

          <h1 className="text-4xl font-extrabold leading-tight text-emerald-950 md:text-5xl">
            {book.name}
          </h1>

          <p className="mt-4 text-xl text-stone-500">
            {book.author}
          </p>

          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4">
            <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-900">
              <UserRound size={23} />
            </span>

            <div>
              <p className="text-xs text-stone-500">Власник книги</p>
              <p className="font-bold">
                {book.owner?.name || "Користувач"}
              </p>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}

          {success && (
            <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              {success}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {!user ? (
              <Link to="/login" className="btn-primary">
                <Mail size={18} />
                Увійти для обміну
              </Link>
            ) : isOwner ? (
              <span className="rounded-xl bg-stone-100 px-5 py-3 text-sm text-stone-600">
                Це ваша книга
              </span>
            ) : (
              <button
                type="button"
                disabled={busy || Boolean(success)}
                onClick={requestExchange}
                className="btn-primary"
              >
                <Mail size={18} />
                {busy
                  ? "Відправлення..."
                  : success
                    ? "Запит надіслано"
                    : "Запросити обмін"}
              </button>
            )}

            {user?.role === "ADMIN" && (
              <button
                type="button"
                disabled={busy}
                onClick={deleteBook}
                className="btn-secondary text-red-700"
              >
                <Trash2 size={18} />
                Видалити книгу
              </button>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-stone-500">
            Після запиту власник отримає email з вашим ім'ям,
            email-адресою та переліком книг, які ви пропонуєте.
          </p>
        </section>
      </div>
    </main>
  );
}
