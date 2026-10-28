import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { LockKeyhole, Mail, UserRound, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const destination = (() => {
    const next = params.get("next") || "/resume-parser";
    return next.startsWith("/") && !next.startsWith("//") ? next : "/resume-parser";
  })();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (!isSupabaseConfigured) {
      setMessage("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify and redeploy.");
      return;
    }
    if (password.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Account created. Check your email to confirm it, then return here to sign in.");
          toast.success("Account created; email confirmation may be required.");
          setMode("signin");
          return;
        }
        toast.success("Account created and signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Signed in.");
      }
      navigate(destination, { replace: true });
    } catch (error: any) {
      setMessage(error?.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 shadow-2xl">
        <div className="mb-6">
          <div className="mb-3 inline-flex rounded-xl bg-emerald-400/10 p-3 text-emerald-300"><LockKeyhole className="h-6 w-6" /></div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">JSS Placement Portal</p>
          <h1 className="mt-2 text-2xl font-bold">{mode === "signin" ? "Sign in to continue" : "Create your account"}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Resume profiles, private resume files, and recommendations are stored in Supabase and linked to your signed-in account.
          </p>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-slate-800 p-1">
          <button type="button" onClick={() => { setMode("signin"); setMessage(""); }} className={"rounded-md py-2 text-sm font-semibold " + (mode === "signin" ? "bg-white text-slate-900" : "text-slate-300")}>Sign in</button>
          <button type="button" onClick={() => { setMode("signup"); setMessage(""); }} className={"rounded-md py-2 text-sm font-semibold " + (mode === "signup" ? "bg-white text-slate-900" : "text-slate-300")}>Create account</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && <label className="block text-sm font-medium text-slate-200">Full name
            <span className="mt-1 flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3"><UserRound className="h-4 w-4 text-slate-400" /><input required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-transparent py-3 text-sm outline-none" autoComplete="name" placeholder="Your full name" /></span>
          </label>}
          <label className="block text-sm font-medium text-slate-200">Email
            <span className="mt-1 flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3"><Mail className="h-4 w-4 text-slate-400" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent py-3 text-sm outline-none" autoComplete="email" placeholder="you@example.com" /></span>
          </label>
          <label className="block text-sm font-medium text-slate-200">Password
            <input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-3 text-sm outline-none focus:border-emerald-400" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="At least 8 characters" />
          </label>
          {message && <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-5 text-amber-200">{message}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">
            {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Student accounts can upload resumes and see their own matches. Job publishing and cross-student matching require placement-staff access assigned by the database administrator.
        </p>
        <Link to="/" className="mt-5 block text-center text-sm font-semibold text-emerald-300 hover:text-emerald-200">Back to dashboard</Link>
      </section>
    </main>
  );
};
