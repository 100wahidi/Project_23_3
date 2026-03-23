import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Database, ShieldCheck, Sparkles } from 'lucide-react';
import { onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase.ts';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/overview', { replace: true });
      }
    });

    return unsubscribe;
  }, [navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/overview', { replace: true });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Unable to sign in with Firebase.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[28px] border border-border bg-card/90 shadow-2xl shadow-black/30">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,92,255,0.20),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_26%)]" />
        <div className="relative grid gap-8 p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              Data quality console
            </div>

            <div className="space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <Database className="h-7 w-7 text-cyan-300" />
              </div>
              <div>
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white lg:text-5xl">
                  Technical quality dashboard with a left navigation panel.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 lg:text-base">
                  The app now keeps the requested structure: login, overview, and technical data quality.
                  It stays offline-first and uses the same dark blue palette as the reference interface.
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="font-medium text-white">Navigation</p>
                <p className="mt-1">Overview and Technical Data Quality</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="font-medium text-white">Data source</p>
                <p className="mt-1">Local mock data, no backend required</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="name@company.com"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0b132a] px-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                  Password
                </label>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0b132a] px-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/60"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in with Firebase'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="flex items-stretch">
            <div className="w-full rounded-[24px] border border-white/10 bg-[#101a37]/90 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.32)]">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Mode</span>
                <span>ready</span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-white/6 p-4">
                  <p className="text-sm text-slate-400">Session</p>
                  <p className="mt-2 text-2xl font-semibold text-white">Login page</p>
                  <p className="mt-2 text-sm text-slate-300">The sidebar appears after Firebase authentication succeeds.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#7c5cff]/15 p-4 ring-1 ring-[#7c5cff]/20">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Overview</p>
                    <p className="mt-2 text-xl font-semibold text-white">Unique vs duplicate</p>
                  </div>
                  <div className="rounded-2xl bg-cyan-500/10 p-4 ring-1 ring-cyan-400/20">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Technical</p>
                    <p className="mt-2 text-xl font-semibold text-white">Rows and validation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
