import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import Spinner from '../components/Spinner';

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ preset_name: '', display_name: '', start_time: '', end_time: '', is_default: false });

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const data = await apiFetch('/presets');
      setPresets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/presets', { method: 'POST', body: formData });
      setShowModal(false);
      setFormData({ preset_name: '', display_name: '', start_time: '', end_time: '', is_default: false });
      fetchPresets();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await apiFetch(`/presets/${id}`, { method: 'PATCH', body: { is_default: true } });
      fetchPresets();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('common.confirm') + ' ' + t('common.delete') + '?')) return;
    try {
      await apiFetch(`/presets/${id}`, { method: 'DELETE' });
      fetchPresets();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('nav.dashboard')}
        </Link>
        <span style={{ color: 'var(--border-highlight)' }}>/</span>
        <h2 className="text-2xl font-heading" style={{ color: 'var(--text-primary)' }}>{t('nav.settings')}</h2>
      </div>

      <div className="glass-card mb-8 flex items-center gap-4">
        <img src={user?.picture} alt="" className="w-16 h-16 rounded-full border border-border-color" />
        <div>
          <p className="text-xl font-semibold">{user?.name}</p>
          <p className="text-text-secondary">{user?.email}</p>
        </div>
      </div>

      <div className="glass-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">{t('presets.title') || '班次预设'}</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ 新增预设</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map(p => (
            <div key={p.id} className="border border-border-color rounded-lg p-4 bg-bg-main relative overflow-hidden group">
              {p.is_default === 1 && (
                <div className="absolute top-0 right-0 text-white text-xs px-2 py-1 rounded-bl-lg" style={{ background: 'var(--primary)' }}>{t('presets.setDefault_badge')}</div>
              )}
              <h4 className="font-semibold">{p.preset_name}</h4>
              <p className="text-sm text-text-secondary mb-1">显示名: {p.display_name}</p>
              <p className="text-sm text-text-secondary mb-4">{p.start_time} - {p.end_time}</p>
              
              <div className="flex justify-between text-xs pt-3 border-t border-border-color/50">
                {p.is_default === 0 ? (
                  <button className="text-primary hover:underline" onClick={() => handleSetDefault(p.id)}>设为默认</button>
                ) : <span className="text-text-muted">已是默认</span>}
                <button className="text-danger hover:underline" onClick={() => handleDelete(p.id)}>{t('common.delete')}</button>
              </div>
            </div>
          ))}
          {presets.length === 0 && <p className="text-text-muted">暂无预设</p>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm">
            <h3 className="text-xl mb-4">新增预设</h3>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">预设名称</label>
                  <input required className="input" placeholder="例如: 晚班" value={formData.preset_name} onChange={e => setFormData({...formData, preset_name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm mb-1">日历显示名</label>
                  <input required className="input" placeholder="例如: 您的姓名/昵称" value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm mb-1">开始时间</label>
                    <input required type="time" className="input" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm mb-1">结束时间</label>
                    <input required type="time" className="input" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm">
                  <input type="checkbox" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} />
                  设为默认
                </label>
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
