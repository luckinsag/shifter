import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { useTranslation } from 'react-i18next';

export default function AttendanceApproval() {
  const { t } = useTranslation();
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTableId) {
      fetchRecords();
    }
  }, [selectedTableId, currentMonth]);

  const fetchTables = async () => {
    try {
      const data = await apiFetch('/shift-tables');
      const adminTables = data.filter(t => t.my_role === 'admin');
      setTables(adminTables);
      if (adminTables.length > 0) {
        setSelectedTableId(adminTables[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/attendance?shift_table_id=${selectedTableId}&month=${currentMonth}`);
      // filter pending
      setRecords(data.filter(r => r.status === 'pending'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await apiFetch(`/attendance/${id}?shift_table_id=${selectedTableId}`, { 
        method: 'PATCH', 
        body: { status: 'approved' } 
      });
      fetchRecords();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/attendance/${rejectId}?shift_table_id=${selectedTableId}`, { 
        method: 'PATCH', 
        body: { status: 'rejected', rejection_reason: rejectReason } 
      });
      setShowRejectModal(false);
      setRejectReason('');
      fetchRecords();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleBatchApprove = async () => {
    if (records.length === 0) return;
    if (!confirm(`确认批量通过当前 ${records.length} 条待审核记录？`)) return;
    
    setLoading(true);
    try {
      for (const record of records) {
        await apiFetch(`/attendance/${record.id}?shift_table_id=${selectedTableId}`, { 
          method: 'PATCH', 
          body: { status: 'approved' } 
        });
      }
      fetchRecords();
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading">出勤审核</h2>
      </div>

      <div className="glass-card mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <select 
          className="input flex-1" 
          value={selectedTableId} 
          onChange={e => setSelectedTableId(e.target.value)}
        >
          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          {tables.length === 0 && <option value="">暂无管理的班次表</option>}
        </select>
        <input 
          type="month" 
          className="input w-40" 
          value={currentMonth} 
          onChange={e => setCurrentMonth(e.target.value)} 
        />
        <button 
          className="btn btn-primary whitespace-nowrap" 
          onClick={handleBatchApprove}
          disabled={records.length === 0 || loading}
        >
          批量通过
        </button>
      </div>

      <div className="glass-card">
        {loading ? (
          <p className="text-center text-text-muted py-8">加载中...</p>
        ) : records.length === 0 ? (
          <p className="text-center text-text-muted py-8">没有待审核的出勤记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-color text-text-secondary">
                <tr>
                  <th className="py-2">姓名</th>
                  <th className="py-2">日期</th>
                  <th className="py-2">时间</th>
                  <th className="py-2">时长</th>
                  <th className="py-2">备注</th>
                  <th className="py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id} className="border-b border-border-highlight last:border-0 hover:bg-slate-50">
                    <td className="py-3">{record.user_name}</td>
                    <td className="py-3">{record.date}</td>
                    <td className="py-3">{record.check_in_time} - {record.check_out_time}</td>
                    <td className="py-3">{record.actual_hours.toFixed(1)}h</td>
                    <td className="py-3 max-w-[200px] truncate text-text-secondary" title={record.note}>
                      {record.note || '-'}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(record.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
                          style={{ background: '#d1fae5', color: '#065f46' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#a7f3d0'}
                          onMouseLeave={e => e.currentTarget.style.background = '#d1fae5'}
                        >
                          ✓ 通过
                        </button>
                        <button
                          onClick={() => { setRejectId(record.id); setShowRejectModal(true); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors"
                          style={{ background: '#fee2e2', color: '#991b1b' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fecaca'}
                          onMouseLeave={e => e.currentTarget.style.background = '#fee2e2'}
                        >
                          ✕ 驳回
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
          <div className="glass-card w-full max-w-sm">
            <h3 className="text-xl mb-4 text-danger">驳回出勤</h3>
            <form onSubmit={handleReject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">驳回原因 (必填)</label>
                  <textarea 
                    required 
                    className="input resize-none" 
                    rows="3" 
                    value={rejectReason} 
                    onChange={e => setRejectReason(e.target.value)} 
                    placeholder="请输入原因以便兼职人员修改..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowRejectModal(false); setRejectReason(''); }}>取消</button>
                <button type="submit" className="btn btn-primary bg-danger text-white border-danger/30 hover:bg-red-600">确认驳回</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
