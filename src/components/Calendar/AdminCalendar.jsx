import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import Calendar from './index';
import { apiFetch } from '../../utils/api';
import { useTranslation } from 'react-i18next';

export default function AdminCalendar({ tableId, shifts }) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [assignments, setAssignments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [assignForm, setAssignForm] = useState({ shift_id: '', user_id: '', note: '' });

  useEffect(() => {
    if (tableId) {
      fetchAssignments();
      fetchStaff();
    }
  }, [tableId, currentMonth]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/assignments?shift_table_id=${tableId}&month=${currentMonth}`);
      setAssignments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await apiFetch(`/staff?shift_table_id=${tableId}`);
      setStaff(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setAssignForm({ shift_id: shifts[0]?.id || '', user_id: staff[0]?.id || '', note: '' });
    setShowModal(true);
  };

  const handleItemClick = async (item) => {
    if (confirm(`删除 ${item.user_name} 的排班？`)) {
      try {
        await apiFetch(`/assignments/${item.id}`, { method: 'DELETE' });
        fetchAssignments();
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.shift_id || !assignForm.user_id) return toast.error('请选择兼职和班次');
    try {
      await apiFetch('/assignments', {
        method: 'POST',
        body: { ...assignForm, date: selectedDate }
      });
      setShowModal(false);
      fetchAssignments();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const [yearStr, monthStr] = currentMonth.split('-');
  
  const calendarItems = assignments.map(a => ({
    id: a.id,
    date: a.date,
    color: a.color,
    label: `${a.user_name} (${a.shift_name})`,
    user_name: a.user_name
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">排班表</h3>
        <input 
          type="month" 
          className="input w-40 py-1" 
          value={currentMonth}
          onChange={e => setCurrentMonth(e.target.value)}
        />
      </div>

      <div className="flex-1 min-h-[500px] relative">
        {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm text-slate-600">加载中...</div>}
        <Calendar 
          year={parseInt(yearStr, 10)} 
          month={parseInt(monthStr, 10)} 
          items={calendarItems} 
          onDateClick={handleDateClick}
          onItemClick={handleItemClick}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm">
            <h3 className="text-xl mb-4">添加排班 - {selectedDate}</h3>
            {shifts.length === 0 || staff.length === 0 ? (
              <div>
                <p className="text-warning mb-4">请先确保有【班次类型】和已加入的【兼职员工】</p>
                <button type="button" className="btn btn-secondary w-full" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
              </div>
            ) : (
              <form onSubmit={handleAssign}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-1">兼职员工</label>
                    <select className="input" value={assignForm.user_id} onChange={e => setAssignForm({...assignForm, user_id: e.target.value})}>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">班次</label>
                    <select className="input" value={assignForm.shift_id} onChange={e => setAssignForm({...assignForm, shift_id: e.target.value})}>
                      {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time}-{s.end_time})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm mb-1">备注 (选填)</label>
                    <input className="input" value={assignForm.note} onChange={e => setAssignForm({...assignForm, note: e.target.value})} />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                  <button type="submit" className="btn btn-primary">{t('common.confirm')}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
