import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiFetch } from '../../utils/api';
import StaffCalendar from '../../components/Calendar/StaffCalendar';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import LangSwitcher from '../../components/LangSwitcher';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data = await apiFetch('/shift-tables');
      setTables(data);
      if (data.length > 0) {
        setSelectedTableId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="rounded-full animate-spin" style={{ width: 32, height: 32, border: '3px solid #e0e7ff', borderTopColor: '#4f46e5' }} />
    </div>
  );

  const currentTable = tables.find(t => t.id === selectedTableId);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top navbar for Dashboard */}
      <header className="bg-white border-b border-slate-200">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-heading font-bold text-primary">Shifter</h1>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            {user?.role === 'superadmin' && (
              <Link to="/admin" className="text-sm text-slate-500 hover:text-slate-900">
                进入超级管理员后台
              </Link>
            )}
            <Link to="/settings" className="text-sm text-slate-500 hover:text-slate-900">
              个人设置
            </Link>
            <LangSwitcher />
            <div className="flex items-center gap-2">
              <img src={user?.picture} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200" />
              <span className="text-sm">{user?.name}</span>
            </div>
            <button onClick={logout} className="btn btn-secondary py-1 px-3 text-sm text-slate-600">
              {t('nav.logout')}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col p-4 border-t border-slate-100 bg-slate-50 gap-4">
            <div className="flex items-center gap-3">
              <img src={user?.picture} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200" />
              <span className="font-medium text-slate-700">{user?.name}</span>
            </div>
            <div className="h-px w-full bg-slate-200"></div>
            {user?.role === 'superadmin' && (
              <Link to="/admin" className="text-sm text-slate-600 font-medium py-2">
                进入超级管理员后台
              </Link>
            )}
            <Link to="/settings" className="text-sm text-slate-600 font-medium py-2">
              个人设置
            </Link>
            <div className="py-2">
              <LangSwitcher />
            </div>
            <button onClick={logout} className="text-left text-sm text-red-600 font-medium py-2">
              {t('nav.logout')}
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 bg-slate-50">
        {/* Sidebar: Table Selection */}
        <div className="w-full md:w-64 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">我的排班表</h2>
          {tables.length === 0 ? (
            <div className="glass-card text-center p-6">
              <p className="text-text-muted text-sm">您还未加入任何排班表</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selectedTableId === table.id 
                      ? 'bg-indigo-50 border-primary text-primary shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <p className="font-medium truncate">{table.name}</p>
                  <div className="flex justify-between mt-1 text-xs opacity-80">
                    <span>{table.my_role === 'admin' ? '管理员' : '兼职'}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {currentTable && currentTable.my_role === 'admin' && (
            <button 
              onClick={() => navigate(`/admin/shift-tables/${currentTable.id}`)}
              className="mt-4 btn btn-secondary text-sm"
            >
              管理此排班表
            </button>
          )}
        </div>

        {/* Main Content: Calendar */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6 min-h-[600px] flex flex-col">
          {currentTable ? (
            <StaffCalendar tableId={selectedTableId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted">
              请选择或等待加入一个排班表
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
