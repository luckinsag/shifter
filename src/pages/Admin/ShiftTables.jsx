import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { useTranslation } from 'react-i18next';
import Spinner from '../../components/Spinner';

export default function ShiftTables() {
  const { t } = useTranslation();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  const [formData, setFormData] = useState({ name: '', start_date: defaultStart, end_date: defaultEnd, description: '' });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data = await apiFetch('/shift-tables');
      setTables(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/shift-tables', { method: 'POST', body: formData });
      setShowModal(false);
      setFormData({ name: '', start_date: '', end_date: '', description: '' });
      fetchTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading">班次表管理</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + {t('shifts.createTable') || '创建班次表'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map(table => (
          <Link key={table.id} to={`/admin/shift-tables/${table.id}`} className="glass-card block">
            <h3 className="text-lg font-semibold mb-2">{table.name}</h3>
            <p className="text-sm text-text-secondary mb-4 line-clamp-2">{table.description || '无描述'}</p>
            <div className="flex justify-between text-xs text-text-muted">
              <span>{table.start_date} ~ {table.end_date}</span>
              <span>{table.member_count} 人</span>
            </div>
            {table.my_role === 'admin' && (
              <span className="badge badge-warning mt-4">管理员</span>
            )}
          </Link>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm">
            <h3 className="text-xl mb-4">创建新班次表</h3>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">名称</label>
                  <input required className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="例如: 2026年7月前台排班" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm mb-1">开始日期</label>
                    <input required type="date" className="input" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm mb-1">结束日期</label>
                    <input required type="date" className="input" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">描述</label>
                  <textarea className="input resize-none" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
