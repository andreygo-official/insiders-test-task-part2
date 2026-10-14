
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || "/books", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка входу");
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
          З поверненням!
        </h1>
        <p className="mt-2 text-stone-500">
          Увійдіть, щоб обмінюватися книгами
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-surface space-y-5 p-7">
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="login-email" className="field-label">Email</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password" className="field-label">Пароль</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Вхід..." : "Увійти"}
          <ArrowRight size={18} />
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600">
        Ще немає акаунта?{" "}
        <Link to="/register" className="font-semibold text-emerald-800 hover:underline">
          Зареєструватися
        </Link>
      </p>
    </main>
  );
}
