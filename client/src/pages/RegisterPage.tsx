
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await register(name, email, password);
      navigate("/me/books", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка реєстрації");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-5 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-emerald-900 text-white">
          <BookOpen size={28} />
        </div>
        <h1 className="text-3xl font-extrabold text-emerald-950">
          Приєднуйтесь до BookSwap
        </h1>
        <p className="mt-2 text-stone-500">
          Створіть акаунт і почніть обмінюватися книгами
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-surface space-y-5 p-7">
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="register-name" className="field-label">Ім'я</label>
          <input
            id="register-name"
            className="input"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше ім'я"
            required
          />
        </div>

        <div>
          <label htmlFor="register-email" className="field-label">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="register-password" className="field-label">Пароль</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            className="input"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Мінімум 8 символів"
            required
          />
          <p className="mt-2 text-xs text-stone-500">
            Використовуйте пароль щонайменше з 8 символів.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Створення..." : "Створити акаунт"}
          <ArrowRight size={18} />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Вже маєте акаунт?{" "}
        <Link to="/login" className="font-semibold text-emerald-800 hover:underline">
          Увійти
        </Link>
      </p>
    </main>
  );
}
