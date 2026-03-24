import { BarChart3, Database, LayoutDashboard, LogOut, PanelLeft, ShieldCheck } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase.ts';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  {
    to: '/overview',
    label: 'Overview',
    icon: LayoutDashboard,
  },
  {
    to: '/technical',
    label: 'Technical Data Quality',
    icon: Database,
  },
  {
    to: '/kri-analytics',
    label: 'KRI Analytics',
    icon: BarChart3,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <aside className="border-b border-sidebar-border bg-sidebar/95 lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-[280px] lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4 lg:justify-start lg:gap-3">
          <Link to="/overview" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-[0_0_0_1px_rgba(124,92,255,0.25)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-[0.18em] text-white">KRI Factory</div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Data Quality</div>
            </div>
          </Link>

          <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 lg:hidden">
            <PanelLeft className="h-4 w-4" />
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-5">
          <div className="px-2 pb-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
            Dashboard
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-white shadow-[0_10px_30px_rgba(124,92,255,0.25)]'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Session</p>
            <p className="mt-2 text-sm font-medium text-white">Offline mock data</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Use the overview, technical page, and KRI analytics to inspect the dataset from different angles.</p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-white/15"
            >
              <LogOut className="h-3.5 w-3.5" />
              Back to login
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-[280px]">
        <main className="mx-auto max-w-[1400px] px-4 py-5 lg:px-6 lg:py-6">{children}</main>
      </div>
    </div>
  );
}