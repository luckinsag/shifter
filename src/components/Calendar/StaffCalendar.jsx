import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import Calendar from './index';
import { apiFetch } from '../../utils/api';
import { useTranslation } from 'react-i18next';

export default function StaffCalendar({ tableId }) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [assignments, setAssignments] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  
  const [formData, setFormData] = useState({
    preset_id: '',
    check_in_time: '',
    check_out_time: '',
    note: ''
  });

  useEffect(() => {
    if (tableId) {
      fetchData();
    }
  }, [tableId, currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignData, attData, presetData] = await Promise.all([
        apiFetch(`/assignments?shift_table_id=${tableId}&month=${currentMonth}`),
        apiFetch(`/attendance?shift_table_id=${tableId}&month=${currentMonth}`),
        apiFetch('/presets')
      ]);
      setAssignments(assignData);
      setAttendances(attData);
      setPresets(presetData);
      
      const defaultPreset = presetData.find(p => p.is_default === 1);
      if (defaultPreset) {
        setFormData(prev => ({
          ...prev,
          preset_id: defaultPreset.id,
          check_in_time: defaultPreset.start_time,
          check_out_time: defaultPreset.end_time
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (dateStr) => {
    const existingAtt = attendances.find(a => a.date === dateStr);
    if (existingAtt) {
      // Editing existing attendance
      if (existingAtt.status !== 'pending') {
        toast.error('该出勤记录已处理，无法修改');
        return;
      }
      setFormData({
        preset_id: existingAtt.preset_id || '',
        check_in_time: existingAtt.check_in_time,
        check_out_time: existingAtt.check_out_time,
        note: existingAtt.note || '',
        id: existingAtt.id
      });
    } else {
      // Create new
      const defaultPreset = presets.find(p => p.is_default === 1);
      setFormData({
        preset_id: defaultPreset ? defaultPreset.id : (presets[0]?.id || ''),
        check_in_time: defaultPreset ? defaultPreset.start_time : '',
        check_out_time: defaultPreset ? defaultPreset.end_time : '',
        note: '',
        id: null
      });
    }
    setSelectedDate(dateStr);
    setShowModal(true);
  };

  const handlePresetChange = (pid) => {
    const p = presets.find(x => x.id === pid);
    if (p) {
      setFormData(prev => ({ ...prev, preset_id: pid, check_in_time: p.start_time, check_out_time: p.end_time }));
    } else {
      setFormData(prev => ({ ...prev, preset_id: pid }));
    }
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!formData.check_in_time || !formData.check_out_time) return toast.error('请填写时间');
    try {
      if (formData.id) {
        await apiFetch(`/attendance/${formData.id}`, { method: 'PATCH', body: formData });
      } else {
        await apiFetch('/attendance', { 
          method: 'POST', 
          body: { ...formData, shift_table_id: tableId, date: selectedDate } 
        });
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteAttendance = async () => {
    if (!formData.id) return;
    if (!confirm('确认删除出勤记录?')) return;
    try {
      await apiFetch(`/attendance/${formData.id}`, { method: 'DELETE' });
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const [yearStr, monthStr] = currentMonth.split('-');
  
  // Merge assignments and attendances into calendar items
  const calendarItems = [];
  
  assignments.forEach(a => {
    calendarItems.push({
      id: `assign-${a.id}`,
      date: a.date,
      color: a.color,
      label: `排班: ${a.shift_name} ${a.start_time}-${a.end_time}`
    });
  });

  attendances.forEach(a => {
    let color = '#22c55e'; // Green for pending/approved
    if (a.status === 'rejected') color = '#ef4444'; // Red for rejected
    
    calendarItems.push({
      id: `att-${a.id}`,
      date: a.date,
      color,
      label: `出勤: ${a.check_in_time}-${a.check_out_time} (${a.actual_hours}h)`
    });
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">兼职排班与出勤</h3>
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
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm">
            <h3 className="text-xl mb-4">{formData.id ? '修改出勤' : '添加出勤'} - {selectedDate}</h3>
            <form onSubmit={handleSaveAttendance}>
              <div className="space-y-4">
                {presets.length > 0 && (
                  <div>
                    <label className="block text-sm mb-1">快速选择预设</label>
                    <select className="input" value={formData.preset_id} onChange={e => handlePresetChange(e.target.value)}>
                      <option value="">自定义时间</option>
                      {presets.map(p => <option key={p.id} value={p.id}>{p.preset_name} ({p.start_time}-{p.end_time})</option>)}
                    </select>
                  </div>
                )}
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm mb-1">上班时间</label>
                    <input required type="time" className="input" value={formData.check_in_time} onChange={e => setFormData({...formData, check_in_time: e.target.value})} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm mb-1">下班时间</label>
                    <input required type="time" className="input" value={formData.check_out_time} onChange={e => setFormData({...formData, check_out_time: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">备注 (选填)</label>
                  <input className="input" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                {formData.id ? (
                  <button type="button" className="btn btn-secondary text-danger border-danger/30" onClick={handleDeleteAttendance}>删除记录</button>
                ) : <div></div>}
                <div className="flex gap-3">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
                  <button type="submit" className="btn btn-primary">{t('common.save')}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
