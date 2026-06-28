import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { useTranslation } from 'react-i18next';

export default function Reports() {
  const { t } = useTranslation();
  const [tables, setTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [report, setReport] = useState({ summary: {}, details: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTableId) {
      fetchReport();
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

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/reports/monthly?shift_table_id=${selectedTableId}&month=${currentMonth}`);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (report.details.length === 0) return toast.error('没有数据可导出');
    
    const headers = ['姓名', '出勤天数', '总时长(小时)'];
    const rows = report.details.map(row => [
      row.full_name,
      row.total_days,
      row.total_hours.toFixed(1)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    // add BOM for UTF-8 Excel compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `考勤报表_${currentMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-heading">月度报表</h2>
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
          className="btn btn-secondary whitespace-nowrap" 
          onClick={handleExportCSV}
          disabled={report.details.length === 0}
        >
          导出 CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card flex flex-col justify-center items-center py-6">
          <p className="text-text-secondary text-sm mb-1">本月有记录人数</p>
          <p className="text-3xl font-heading font-bold text-primary">{report.summary.total_staff || 0}</p>
        </div>
        <div className="glass-card flex flex-col justify-center items-center py-6">
          <p className="text-text-secondary text-sm mb-1">总出勤人次</p>
          <p className="text-3xl font-heading font-bold text-primary">{report.summary.total_days || 0}</p>
        </div>
        <div className="glass-card flex flex-col justify-center items-center py-6">
          <p className="text-text-secondary text-sm mb-1">总计出勤时长</p>
          <p className="text-3xl font-heading font-bold text-primary">{(report.summary.total_hours || 0).toFixed(1)} <span className="text-lg">h</span></p>
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <p className="text-center text-text-muted py-8">加载中...</p>
        ) : report.details.length === 0 ? (
          <p className="text-center text-text-muted py-8">本月暂无出勤数据</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-color text-text-secondary">
                <tr>
                  <th className="py-2">姓名</th>
                  <th className="py-2">出勤天数</th>
                  <th className="py-2">总工时</th>
                </tr>
              </thead>
              <tbody>
                {report.details.map((row, idx) => (
                  <tr key={idx} className="border-b border-border-highlight last:border-0 hover:bg-slate-50">
                    <td className="py-3 font-medium">{row.full_name}</td>
                    <td className="py-3">{row.total_days}</td>
                    <td className="py-3 text-primary font-medium">{row.total_hours.toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
