
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Pencil, Plus, Trash2 } from "lucide-react";

import { api } from "../api/client";
import { BookForm } from "../components/BookForm";
import type { Book, BookInput } from "../types";

export function MyBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadBooks() {
    const items = await api<Book[]>("/me/books");
    setBooks(items);
  }

  useEffect(() => {
    let active = true;

    api<Book[]>("/me/books")
      .then((items) => {
        if (active) setBooks(items);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Помилка завантаження"
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function saveBook(data: BookInput) {
    setSaving(true);
    setError("");
    setMessage("");

    const isEditing = Boolean(editing);

    try {
      await api<Book>(
        editing ? `/me/books/${editing.id}` : "/me/books",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(data),
        }
      );

      await loadBooks();
      closeForm();
      setMessage(
        isEditing ? "Книгу оновлено" : "Книгу успішно додано"
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не вдалося зберегти книгу"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteBook(id: string) {
    if (!window.confirm("Видалити цю книгу?")) return;

    setError("");
    setMessage("");

    try {
      await api<void>(`/me/books/${id}`, {
        method: "DELETE",
      });
      await loadBooks();
      setMessage("Книгу видалено");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Помилка видалення"
      );
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
            Моя бібліотека
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-emerald-950">
            Мої книги
          </h1>
          <p className="mt-2 text-stone-500">
            Керуйте власною колекцією та діліться книгами.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
            setError("");
          }}
          className="btn-primary"
        >
          <Plus size={19} />
          Додати книгу
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">
          {message}
        </p>
      )}

      {formOpen && (
        <div className="mb-8">
          <BookForm
            initial={editing}
            onSubmit={saveBook}
            onCancel={closeForm}
            saving={saving}
          />
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-stone-500">Завантаження...</p>
      ) : books.length === 0 ? (
        <div className="card-surface py-20 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-emerald-800" />
          <h2 className="text-2xl font-bold">Ваша бібліотека порожня</h2>
          <p className="mt-2 text-stone-500">
            Додайте першу книгу, щоб почати обмін.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {books.map((book) => (
            <div key={book.id} className="card-surface flex items-center gap-4 p-4">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#e8e9dc]">
                {book.photoUrl ? (
                  <img
                    src={book.photoUrl}
                    alt={book.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <BookOpen size={30} className="text-emerald-700" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/books/${book.id}`}
                  className="block truncate font-bold text-stone-900 hover:text-emerald-800"
                >
                  {book.name}
                </Link>

                <p className="mt-1 truncate text-sm text-stone-500">
                  {book.author}
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(book);
                      setFormOpen(true);
                      setError("");
                    }}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline"
                  >
                    <Pencil size={15} />
                    Редагувати
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteBook(book.id)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-red-700 hover:underline"
                  >
                    <Trash2 size={15} />
                    Видалити
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
