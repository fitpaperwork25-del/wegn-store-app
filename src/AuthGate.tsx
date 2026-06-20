import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import App from "./App";

export default function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) return;
    setSubmitting(true);

    if (mode === "signup") {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (signUpErr) {
        setError(signUpErr.message);
        setSubmitting(false);
        return;
      }
      if (signUpData.user) {
        const { data: existing } = await supabase
          .from("businesses")
          .select("id, owner_id")
          .is("owner_id", null)
          .limit(1)
          .maybeSingle();
        if (existing) {
          await supabase
            .from("businesses")
            .update({ owner_id: signUpData.user.id })
            .eq("id", existing.id);
        }
      }
      setSubmitting(false);
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInErr) {
      setError(signInErr.message);
    }
    setSubmitting(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ color: "#64748b", fontSize: "16px" }}>Loading...</p>
      </div>
    );
  }

  if (user) {
    return <App userId={user.id} userEmail={user.email ?? ""} onSignOut={handleSignOut} />;
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
      <div style={{ width: "100%", maxWidth: "380px", padding: "40px 32px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img src="/logo.png" alt="" style={{ height: "56px", marginBottom: "12px" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Wegn-Store</h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0" }}>
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ padding: "8px 12px", marginBottom: "14px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", padding: "10px", background: "#1d4ed8", color: "#fff", border: "none",
              borderRadius: "6px", fontSize: "15px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: "16px" }}>
          {mode === "login" ? (
            <>No account? <button onClick={() => { setMode("signup"); setError(""); }} style={{ background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontWeight: 600, fontSize: "13px", padding: 0 }}>Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode("login"); setError(""); }} style={{ background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontWeight: 600, fontSize: "13px", padding: 0 }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
