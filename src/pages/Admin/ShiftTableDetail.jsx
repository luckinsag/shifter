import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import { apiFetch } from '../../utils/api';
import { useTranslation } from 'react-i18next';
import AdminCalendar from '../../components/Calendar/AdminCalendar';

export default function ShiftTableDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [table, setTable] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({ name: '', start_time: '', end_time: '', color: '#6366f1' });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [tableData, shiftsData] = await Promise.all([
        apiFetch(`/shift-tables/${id}`),
        apiFetch(`/shift-tables/${id}/shifts`)
      ]);
      setTable(tableData);
      setShifts(shiftsData);
    } catch (err) {
      console.error(err);
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/shift-tables/${id}/shifts`, { method: 'POST', body: shiftForm });
      setShowShiftModal(false);
      setShiftForm({ name: '', start_time: '', end_time: '', color: '#6366f1' });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!confirm(t('common.confirm') + ' ' + t('common.delete') + '?')) return;
    try {
      await apiFetch(`/shifts/${shiftId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Spinner fullscreen />;
  if (!table) return <Spinner fullscreen />;

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-heading mb-2">{table.name}</h2>
          <p className="text-text-secondary text-sm">{table.start_date} ~ {table.end_date}</p>
          <p className="mt-2 text-text-primary">{table.description}</p>
        </div>
        {table.my_role === 'admin' && (
          <Link to={`/admin/shift-tables/${id}/staff`} className="btn btn-secondary text-sm">
            管理员工成员 ({table.member_count}人)
          </Link>
        )}
      </div>

      <div className="glass-card mb-8">
        <div className="h-[700px]">
          <AdminCalendar tableId={id} shifts={shifts} />
        </div>
      </div>

      <div className="glass-card mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{t('shifts.shiftType') || '班次类型'}</h3>
          {table.my_role === 'admin' && (
            <button className="btn btn-primary text-sm px-3 py-1" onClick={() => setShowShiftModal(true)}>
              + 新增类型
            </button>
          )}
        </div>
        
        {shifts.length === 0 ? (
          <p className="text-text-muted text-sm">暂无班次类型</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {shifts.map(shift => (
              <div key={shift.id} className="border border-border-color rounded p-3 flex justify-between items-center bg-bg-main">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: shift.color }}></div>
                  <div>
                    <p className="font-medium text-sm">{shift.name}</p>
                    <p className="text-xs text-text-secondary">{shift.start_time} - {shift.end_time}</p>
                  </div>
                </div>
                {table.my_role === 'admin' && (
                  <button onClick={() => handleDeleteShift(shift.id)} className="text-danger hover:text-red-400 text-sm">
                    {t('common.delete')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm">
            <h3 className="text-xl mb-4">新增班次类型</h3>
            <form onSubmit={handleCreateShift}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">名称 (如: 早班)</label>
                  <input required className="input" value={shiftForm.name} onChange={e => setShiftForm({...shiftForm, name: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm mb-1">开始时间</label>
                    <input required type="time" className="input" value={shiftForm.start_time} onChange={e => setShiftForm({...shiftForm, start_time: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm mb-1">结束时间</label>
                    <input required type="time" className="input" value={shiftForm.end_time} onChange={e => setShiftForm({...shiftForm, end_time: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">颜色</label>
                  <input type="color" className="w-full h-10 bg-transparent border-none cursor-pointer" value={shiftForm.color} onChange={e => setShiftForm({...shiftForm, color: e.target.value})} />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowShiftModal(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('common.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
