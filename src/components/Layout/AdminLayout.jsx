import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LangSwitcher from '../LangSwitcher';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-full z-20">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold text-primary">Shifter</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { path: '/admin', label: '班次表管理' },
            { path: '/admin/attendance', label: '出勤审核' },
            { path: '/admin/reports', label: '团队报表' },
          ].map(nav => (
            <Link
              key={nav.path}
              to={nav.path}
              className={`block px-4 py-2 rounded-md transition-colors ${
                location.pathname === nav.path || location.pathname.startsWith(nav.path + '/')
                  ? 'bg-indigo-50 text-indigo-600 font-medium'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {nav.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="mb-4 flex items-center justify-between px-2">
            <LangSwitcher />
          </div>
          <div className="flex items-center gap-2 mb-4 px-2">
            <img src={user?.picture} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-slate-700">{user?.name}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full text-sm py-2 text-slate-600 hover:text-red-600 transition-colors text-left px-2">
            {t('nav.logout')}
          </button>
          <Link to="/dashboard" className="mt-2 btn btn-secondary w-full text-sm">
            返回兼职工作台
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex justify-between items-center p-4 bg-white border-b border-slate-200 z-30">
          <h1 className="text-xl font-heading font-bold text-primary">Admin Panel</h1>
          <button 
            className="p-2 text-slate-600 hover:bg-slate-100 rounded"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[65px] left-0 right-0 bg-white border-b border-slate-200 z-20 shadow-lg max-h-[calc(100vh-65px)] overflow-y-auto">
            <nav className="p-4 space-y-2">
              {[
                { path: '/admin', label: '班次表管理' },
                { path: '/admin/attendance', label: '出勤审核' },
                { path: '/admin/reports', label: '团队报表' },
              ].map(nav => (
                <Link
                  key={nav.path}
                  to={nav.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-md transition-colors ${
                    location.pathname === nav.path || location.pathname.startsWith(nav.path + '/')
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-slate-600'
                  }`}
                >
                  {nav.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img src={user?.picture} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200" />
                <span className="font-medium text-slate-700">{user?.name}</span>
              </div>
              <div className="py-2">
                <LangSwitcher />
              </div>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-sm text-indigo-600 font-medium py-2">
                返回兼职工作台
              </Link>
              <button onClick={logout} className="text-left text-sm text-red-600 font-medium py-2">
                {t('nav.logout')}
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
