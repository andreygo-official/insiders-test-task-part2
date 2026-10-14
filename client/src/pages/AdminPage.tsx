
import { useEffect, useState, type FormEvent } from "react";
import {
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import type { AdminUser, Role } from "../types";

type UserForm = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

const emptyForm: UserForm = {
  name: "",
  email: "",
  password: "",
  role: "USER",
};

export function AdminPage() {
  const { user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadUsers() {
    const result = await api<AdminUser[]>("/admin/users");
    setUsers(result);
  }

  useEffect(() => {
    let active = true;

    api<AdminUser[]>("/admin/users")
      .then((result) => {
        if (active) setUsers(result);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Помилка завантаження"
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
    setForm(emptyForm);
  }

  function createUser() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
    setError("");
  }

  function editUser(account: AdminUser) {
    setEditing(account);
    setForm({
      name: account.name,
      email: account.email,
      password: "",
      role: account.role,
    });
    setFormOpen(true);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const isEditing = Boolean(editing);
    const { password, ...otherFields } = form;

    try {
      await api<AdminUser>(
        editing ? `/admin/users/${editing.id}` : "/admin/users",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify({
            ...otherFields,
            ...(password ? { password } : {}),
          }),
        }
      );

      await loadUsers();
      closeForm();
      setMessage(
        isEditing
          ? "Дані користувача оновлено"
          : "Користувача створено"
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Помилка збереження"
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("Видалити користувача разом з його книгами?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api<void>(`/admin/users/${id}`, { method: "DELETE" });
      await loadUsers();
      setMessage("Користувача видалено");
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
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-700">
            <ShieldCheck size={17} />
            Адміністрування
          </p>
          <h1 className="mt-2 text-4xl font-extrabold text-emerald-950">
            Керування користувачами
          </h1>
          <p className="mt-2 text-stone-500">
            Створення, редагування та видалення акаунтів.
          </p>
        </div>

        <button type="button" onClick={createUser} className="btn-primary">
          <Plus size={18} />
          Додати користувача
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
        <form
          onSubmit={handleSubmit}
          className="card-surface mb-8 grid gap-4 p-6 md:grid-cols-2"
        >
          <h2 className="text-xl font-bold text-emerald-950 md:col-span-2">
            {editing ? "Редагувати користувача" : "Новий користувач"}
          </h2>

          <div>
            <label htmlFor="admin-name" className="field-label">Ім'я</label>
            <input
              id="admin-name"
              className="input"
              minLength={2}
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="admin-email" className="field-label">Email</label>
            <input
              id="admin-email"
              type="email"
              className="input"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="field-label">
              {editing ? "Новий пароль (необов'язково)" : "Пароль"}
            </label>
            <input
              id="admin-password"
              type="password"
              className="input"
              minLength={8}
              required={!editing}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="admin-role" className="field-label">Роль</label>
            <select
              id="admin-role"
              className="input"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 md:col-span-2">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? "Збереження..." : "Зберегти"}
            </button>
            <button type="button" onClick={closeForm} className="btn-secondary">
              Скасувати
            </button>
          </div>
        </form>
      )}

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[660px] text-left">
          <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
            <tr>
              <th className="px-5 py-4">Користувач</th>
              <th className="px-5 py-4">Роль</th>
              <th className="px-5 py-4">Книг</th>
              <th className="px-5 py-4 text-right">Дії</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100">
            {users.map((account) => (
              <tr key={account.id} className="hover:bg-stone-50">
                <td className="px-5 py-4">
                  <p className="font-semibold text-stone-900">
                    {account.name}
                  </p>
                  <p className="text-sm text-stone-500">{account.email}</p>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      account.role === "ADMIN"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    {account.role}
                  </span>
                </td>

                <td className="px-5 py-4 text-stone-600">
                  {account._count.books}
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      aria-label={`Редагувати ${account.name}`}
                      onClick={() => editUser(account)}
                      className="text-emerald-800 hover:text-emerald-950"
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      type="button"
                      aria-label={`Видалити ${account.name}`}
                      disabled={account.id === user?.id}
                      onClick={() => deleteUser(account.id)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-30"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <p className="p-8 text-center text-stone-500">
            Завантаження користувачів...
          </p>
        )}

        {!loading && users.length === 0 && (
          <div className="flex items-center justify-center gap-2 p-12 text-stone-500">
            <Users size={21} />
            Користувачів не знайдено
          </div>
        )}
      </div>
    </main>
  );
}
