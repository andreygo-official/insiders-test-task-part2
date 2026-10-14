
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Mail, UserRound } from "lucide-react";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { ProfileOverview, User } from "../types";

export function ProfilePage() {
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");

  const [overview, setOverview] = useState<ProfileOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatarUrl(user.avatarUrl ?? "");
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    api<ProfileOverview>("/me/overview")
      .then((result) => {
        if (active) setOverview(result);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Не вдалося завантажити профіль"
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const updated = await api<User>("/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, email, avatarUrl }),
      });
      setUser(updated);
      setMessage("Профіль успішно оновлено");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Помилка збереження профілю"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 md:px-8">
      <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
        Особистий кабінет
      </p>

      <h1 className="mt-2 text-4xl font-extrabold text-emerald-950">
        Мій профіль
      </h1>

      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">
          {message}
        </p>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <form onSubmit={saveProfile} className="card-surface space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-emerald-900">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Аватар"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound size={28} />
              )}
            </div>
            <h2 className="text-xl font-bold">Особисті дані</h2>
          </div>

          <div>
            <label htmlFor="profile-name" className="field-label">Ім'я</label>
            <input
              id="profile-name"
              className="input"
              minLength={2}
              maxLength={100}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="field-label">Email</label>
            <input
              id="profile-email"
              type="email"
              className="input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="profile-avatar" className="field-label">
              URL аватара
            </label>
            <input
              id="profile-avatar"
              type="url"
              className="input"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Збереження..." : "Зберегти зміни"}
          </button>
        </form>

        <section className="space-y-6">
          <div className="card-surface flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-stone-500">
                Книг у моїй бібліотеці
              </p>
              <p className="mt-2 text-4xl font-extrabold text-emerald-950">
                {overview?.bookCount ?? "—"}
              </p>
            </div>

            <Link
              to="/me/books"
              className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800"
            >
              <BookOpen size={28} />
            </Link>
          </div>

          <div className="card-surface p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-950">
              <Mail size={19} />
              Отримані запити ({overview?.received.length ?? 0})
            </h2>

            {overview?.received.length ? (
              <div className="space-y-3">
                {overview.received.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl bg-stone-50 p-4 text-sm"
                  >
                    <p>
                      <strong>{request.sender?.name}</strong>
                      {" "}({request.sender?.email}) хоче обміняти книгу{" "}
                      <Link
                        to={`/books/${request.book.id}`}
                        className="font-semibold text-emerald-800 underline"
                      >
                        {request.book.name}
                      </Link>
                    </p>
                    <p className="mt-2 text-xs text-stone-500">
                      {new Date(request.createdAt).toLocaleString("uk-UA")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">
                Отриманих запитів поки немає.
              </p>
            )}
          </div>

          <div className="card-surface p-6">
            <h2 className="mb-4 text-lg font-bold text-emerald-950">
              Надіслані запити ({overview?.sent.length ?? 0})
            </h2>

            {overview?.sent.length ? (
              <div className="space-y-3">
                {overview.sent.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-xl bg-stone-50 p-4 text-sm"
                  >
                    <p>
                      <strong>{request.book.name}</strong>
                      {" — "}
                      {request.recipient?.name}
                    </p>
                    <p className="mt-2 text-xs text-stone-500">
                      {new Date(request.createdAt).toLocaleString("uk-UA")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-500">
                Ви ще не надсилали запитів.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
