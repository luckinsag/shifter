import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import { useTranslation } from 'react-i18next';
import Spinner from '../../components/Spinner';

export default function ShiftTableStaff() {
  const { id } = useParams();
  const { t } = useTranslation();
  
  const [staff, setStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [staffData, invData] = await Promise.all([
        apiFetch(`/staff?shift_table_id=${id}`),
        apiFetch(`/invitations?shift_table_id=${id}`)
      ]);
      setStaff(staffData);
      setInvitations(invData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await apiFetch('/invitations', { method: 'POST', body: { email: inviteEmail, shift_table_id: id } });
      setInviteEmail('');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = async (invId) => {
    try {
      await apiFetch(`/invitations/${invId}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveStaff = async (staffId) => {
    if (!confirm(t('common.confirm') + ' ' + t('common.delete') + '?')) return;
    try {
      await apiFetch(`/staff/${staffId}?shift_table_id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRoleChange = async (staffId, newRole) => {
    try {
      await apiFetch(`/staff/${staffId}?shift_table_id=${id}`, { method: 'PATCH', body: { role: newRole } });
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <Spinner fullscreen />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading mb-2">员工管理</h2>
          <Link to={`/admin/shift-tables/${id}`} className="text-primary text-sm hover:underline">
            &larr; 返回班次表详情
          </Link>
        </div>
      </div>

      <div className="glass-card mb-8">
        <h3 className="text-lg font-semibold mb-4">邀请成员</h3>
        <form onSubmit={handleInvite} className="flex gap-4 max-w-md">
          <input 
            type="email" 
            required 
            placeholder="输入 Gmail 邮箱" 
            className="input flex-1"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
          />
          <button type="submit" disabled={inviteLoading} className="btn btn-primary whitespace-nowrap">
            发送邀请
          </button>
        </form>

        {invitations.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm text-text-secondary mb-3">等待加入的邀请 ({invitations.length})</h4>
            <div className="space-y-2">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-bg-main border border-border-color rounded">
                  <div>
                    <p className="text-sm">{inv.email}</p>
                    <p className="text-xs text-text-muted">过期: {new Date(inv.expires_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleRevoke(inv.id)} className="text-danger text-xs hover:underline">撤销</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card">
        <h3 className="text-lg font-semibold mb-4">已加入成员 ({staff.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-color text-text-secondary">
              <tr>
                <th className="py-2">头像/姓名</th>
                <th className="py-2">邮箱</th>
                <th className="py-2">角色</th>
                <th className="py-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.user_id} className="border-b border-border-highlight last:border-0 hover:bg-slate-50">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img src={member.avatar_url} className="w-8 h-8 rounded-full" alt="" />
                      <span>{member.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-text-secondary">{member.email}</td>
                  <td className="py-3">
                    <select 
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="bg-transparent border border-border-color rounded px-2 py-1 outline-none cursor-pointer"
                    >
                      <option value="staff" className="bg-bg-main">兼职 (Staff)</option>
                      <option value="admin" className="bg-bg-main">管理员 (Admin)</option>
                    </select>
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => handleRemoveStaff(member.id)} className="text-danger hover:underline text-xs">
                      移出
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
