import { type FormEvent, useState } from "react";

import { useAuth } from "@/hooks/useAuth";

import styles from "./Login.module.css";

const TEXT = {
  brand: "cou$in",
  signIn: "Sign in",
  subtitle: "Personal finance",
};

export function Login() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.brand}>{TEXT.brand}</div>
        <div className={styles.subtitle}>{TEXT.subtitle}</div>

        {error && <div className={styles.error}>{error}</div>}

        <input
          autoComplete="email"
          className={styles.input}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          type="email"
          value={email}
        />

        <input
          autoComplete="current-password"
          className={styles.input}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />

        <button className={styles.button} disabled={loading} type="submit">
          {loading ? "…" : TEXT.signIn}
        </button>
      </form>
    </div>
  );
}
