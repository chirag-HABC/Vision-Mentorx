import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, Loader2, User, Calendar, Globe, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { useDemoAuth, DEMO_EMAIL, DEMO_PASSWORD } from "@/contexts/DemoAuthContext";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

const COUNTRIES = ["United States", "India", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "Singapore", "Other"];

function AuthPage() {
  const navigate = useNavigate();
  const { user, ready, signIn, signUp } = useDemoAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);

  // Sign in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign up
  const [name, setName] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/" });
  }, [ready, user, navigate]);

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  const onSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suPassword !== suConfirm) return toast.error("Passwords don't match");
    if (!agree) return toast.error("Please accept the Terms");
    setBusy(true);
    try {
      await signUp({
        name: name.trim(),
        email: suEmail,
        password: suPassword,
        dob: dob || undefined,
        country: country || undefined,
      });
      toast.success("Account created");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 text-foreground">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, var(--gradient-glow), transparent 70%)" }} />
        <div className="absolute inset-0 grid-bg opacity-40" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-strong rounded-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center glow-primary mb-3" style={{ background: "var(--gradient-aurora)" }}>
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl text-gradient">VISION MENTOR X</h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
            {mode === "login" ? "Sign in to continue" : "Create your account"}
          </p>
        </div>

        <div className="flex gap-1 p-1 rounded-lg glass mb-6">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-xs uppercase tracking-widest font-display rounded-md transition-all ${
                mode === m ? "bg-primary text-primary-foreground glow-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <>
            <div className="glass rounded-lg p-3 mb-4 text-xs flex items-start gap-2">
              <KeyRound className="w-4 h-4 mt-0.5 text-cyber shrink-0" />
              <div className="flex-1">
                <div className="font-display uppercase tracking-widest text-[10px] text-muted-foreground">Demo account</div>
                <div className="font-mono mt-0.5 break-all">{DEMO_EMAIL} / {DEMO_PASSWORD}</div>
              </div>
              <button onClick={fillDemo} className="text-primary text-[11px] hover:underline shrink-0">Use demo</button>
            </div>

            <form onSubmit={onSignIn} className="space-y-3">
              <Field icon={<Mail className="w-4 h-4 text-muted-foreground" />}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="flex-1 bg-transparent outline-none py-3 text-sm" />
              </Field>
              <Field icon={<Lock className="w-4 h-4 text-muted-foreground" />}>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="flex-1 bg-transparent outline-none py-3 text-sm" />
              </Field>
              <Button type="submit" disabled={busy} className="w-full glow-primary" style={{ background: "var(--gradient-aurora)" }}>
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </>
        ) : (
          <form onSubmit={onSignUp} className="space-y-3">
            <Field icon={<User className="w-4 h-4 text-muted-foreground" />}>
              <input required minLength={2} maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="flex-1 bg-transparent outline-none py-3 text-sm" />
            </Field>
            <Field icon={<Mail className="w-4 h-4 text-muted-foreground" />}>
              <input type="email" required value={suEmail} onChange={(e) => setSuEmail(e.target.value)} placeholder="you@example.com" className="flex-1 bg-transparent outline-none py-3 text-sm" />
            </Field>
            <Field icon={<Lock className="w-4 h-4 text-muted-foreground" />}>
              <input type="password" required minLength={8} value={suPassword} onChange={(e) => setSuPassword(e.target.value)} placeholder="Password (8+ chars, letter & number)" className="flex-1 bg-transparent outline-none py-3 text-sm" />
            </Field>
            <Field icon={<Lock className="w-4 h-4 text-muted-foreground" />}>
              <input type="password" required minLength={8} value={suConfirm} onChange={(e) => setSuConfirm(e.target.value)} placeholder="Confirm password" className="flex-1 bg-transparent outline-none py-3 text-sm" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field icon={<Calendar className="w-4 h-4 text-muted-foreground" />}>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="flex-1 bg-transparent outline-none py-3 text-sm" />
              </Field>
              <Field icon={<Globe className="w-4 h-4 text-muted-foreground" />}>
                <select value={country} onChange={(e) => setCountry(e.target.value)} className="flex-1 bg-transparent outline-none py-3 text-sm">
                  <option value="">Country</option>
                  {COUNTRIES.map((c) => <option key={c} value={c} className="bg-background">{c}</option>)}
                </select>
              </Field>
            </div>
            <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
              <span>I agree to the <span className="text-primary">Terms</span> and <span className="text-primary">Privacy Policy</span>.</span>
            </label>
            <Button type="submit" disabled={busy} className="w-full glow-primary" style={{ background: "var(--gradient-aurora)" }}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center pt-1">
              Your details are saved locally (data/users.json) until you wire up MongoDB.
            </p>
          </form>
        )}
      </motion.div>

      <Toaster position="top-right" />
    </div>
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass rounded-lg flex items-center px-3 gap-2">
      {icon}
      {children}
    </div>
  );
}
