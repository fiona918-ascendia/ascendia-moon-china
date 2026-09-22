"use client";

import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/brand-mark";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "无法登录。");
      window.location.assign("/admin");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "无法登录。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <BrandMark light={false} />
        <p className="admin-kicker">SECURE ADMIN ACCESS</p>
        <h1>活动 Lead 管理后台</h1>
        <p>请使用已授权的 Supabase 管理员账号登录。</p>
        <form onSubmit={submit} noValidate>
          <label>邮箱<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>密码<input type="password" required minLength={8} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <p className="admin-error" role="alert">{error}</p>
          <button className="admin-primary-button" type="submit" disabled={loading}>{loading ? "正在验证…" : "安全登录"}</button>
        </form>
      </section>
    </main>
  );
}
