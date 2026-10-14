
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { api } from "../api/client";
import { BookCard } from "../components/BookCard";
import type { PaginatedBooks } from "../types";

export function BooksPage() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("asc");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState<PaginatedBooks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBooks() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        search,
        sort,
        page: String(page),
        limit: "8",
      });

      try {
        const data = await api<PaginatedBooks>(
          `/books?${params.toString()}`
        );

        if (active) setResult(data);
      } catch (err) {
        if (active) {
          setResult(null);
          setError(
            err instanceof Error
              ? err.message
              : "Не вдалося завантажити книги"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBooks();

    return () => {
      active = false;
    };
  }, [search, sort, page]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(draft.trim());
  }

  return (
    <>
      <section className="overflow-hidden bg-emerald-950 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 md:grid-cols-[1.4fr_1fr] md:px-8 md:py-20">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[.2em] text-emerald-300">
              Спільнота книголюбів
            </p>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
              Нові історії починаються з{" "}
              <span className="text-emerald-300">обміну.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-emerald-100/80">
              Діліться прочитаними книгами, знайомтеся з іншими
              читачами та знаходьте нові історії.
            </p>

            <Link
              to="/me/books"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-emerald-950 hover:bg-emerald-50"
            >
              Додати свою книгу
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="hidden justify-center md:flex">
            <div className="relative flex h-72 w-64 -rotate-6 items-center justify-center rounded-r-2xl border-l-16 border-amber-700 bg-amber-200 shadow-[20px_24px_0_#23664f]">
              <BookOpen size={100} strokeWidth={1} className="text-emerald-950" />
              <span className="absolute bottom-7 text-xl font-extrabold tracking-[.2em] text-emerald-950">
                BOOKSWAP
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-700">
            Каталог спільноти
          </p>
          <h2 className="text-3xl font-extrabold text-emerald-950">
            Знайдіть свою наступну книгу
          </h2>
          <p className="mt-2 text-stone-500">
            {result
              ? `Знайдено книг: ${result.total}`
              : "Завантажуємо каталог..."}
          </p>
        </div>

        <div className="card-surface mb-8 flex flex-col gap-3 p-4 md:flex-row">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-3.5 text-stone-400" />
              <input
                aria-label="Пошук книг"
                className="input pl-10!"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Назва книги або автор..."
              />
            </div>
            <button type="submit" className="btn-primary">
              Пошук
            </button>
          </form>

          <div className="flex items-center gap-2 md:border-l md:border-stone-200 md:pl-4">
            <SlidersHorizontal size={18} className="text-stone-500" />
            <select
              aria-label="Сортування"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="input min-w-44"
            >
              <option value="asc">Назва: А–Я</option>
              <option value="desc">Назва: Я–А</option>
            </select>
          </div>
        </div>

        {error && (
          <p role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <div className="py-16 text-center text-stone-500">
            Завантаження книг...
          </div>
        ) : result && result.items.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {result.items.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : !error ? (
          <div className="card-surface py-20 text-center">
            <BookOpen size={44} className="mx-auto mb-4 text-emerald-800" />
            <h3 className="text-xl font-bold">Книг не знайдено</h3>
            <p className="mt-2 text-stone-500">
              Спробуйте інший пошук або додайте власну книгу.
            </p>
          </div>
        ) : null}

        {result && result.totalPages > 1 && !loading && (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              ← Назад
            </button>

            <span className="text-sm font-medium text-stone-600">
              {page} / {result.totalPages}
            </span>

            <button
              type="button"
              className="btn-secondary"
              disabled={page >= result.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Далі →
            </button>
          </div>
        )}
      </main>
    </>
  );
}
