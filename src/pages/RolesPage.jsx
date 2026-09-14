import React, { useState } from 'react';
import { api } from '../api/client';
import AuditReasonModal from '../components/AuditReasonModal';
import './RolesPage.css';

const AVAILABLE_ROLES = [
  'support', 
  'compliance', 
  'treasury_operator', 
  'treasury_approver', 
  'auditor', 
  'platform_administrator'
];

export default function RolesPage() {
  const [userId, setUserId] = useState('');
  const [searchedUser, setSearchedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [auditAction, setAuditAction] = useState(null); // { action: 'add' | 'remove', role }
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setLoading(true);
    setError('');
    setSearchedUser(null);
    setRoles([]);
    
    try {
      const res = await api(`/v1/admin/users/${userId.trim()}/roles`);
      setRoles(res.roles || []);
      setSearchedUser(userId.trim());
    } catch (err) {
      setError(err.message || 'Failed to fetch roles for user');
    } finally {
      setLoading(false);
    }
  };

  const initiateRoleChange = (action, role) => {
    if (action === 'remove' && role === 'platform_administrator' && roles.filter(r => r === 'platform_administrator').length <= 1) {
      // Note: Backend prevents removing final admin, but we can also warn early
      // Actually backend handles it, but let's just proceed.
    }
    setAuditAction({ action, role });
    setIsModalOpen(true);
  };

  const handleConfirmAudit = async (reason) => {
    setIsModalOpen(false);
    if (!auditAction || !searchedUser) return;

    const { action, role } = auditAction;
    const endpoint = `/v1/admin/users/${searchedUser}/roles/${role}`;
    
    try {
      if (action === 'add') {
        await api(endpoint, {
          method: 'PUT',
          body: JSON.stringify({ reason })
        });
        setRoles([...roles, role]);
      } else {
        await api(endpoint, {
          method: 'DELETE',
          body: JSON.stringify({ reason })
        });
        setRoles(roles.filter(r => r !== role));
      }
    } catch (err) {
      setError(`Failed to ${action} role: ${err.message}`);
    }
    setAuditAction(null);
  };

  return (
    <div className="roles-page">
      <h2 className="page-title">Role Management</h2>
      
      <div className="card">
        <h3 className="card-title">Lookup User Roles</h3>
        <form onSubmit={handleSearch} className="search-form">
          <input 
            type="text" 
            value={userId} 
            onChange={e => setUserId(e.target.value)} 
            placeholder="Enter User ID (UUID)..." 
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Lookup'}
          </button>
        </form>
        {error && <div className="error-banner" style={{marginTop: '1rem'}}>{error}</div>}
      </div>

      {searchedUser && (
        <div className="card">
          <h3 className="card-title">Roles for {searchedUser}</h3>
          <div className="roles-grid">
            {AVAILABLE_ROLES.map(role => {
              const hasRole = roles.includes(role);
              return (
                <div key={role} className="role-item">
                  <div className="role-info">
                    <h4>{role}</h4>
                  </div>
                  {hasRole ? (
                    <button className="btn-remove" onClick={() => initiateRoleChange('remove', role)}>
                      Revoke
                    </button>
                  ) : (
                    <button className="btn-add" onClick={() => initiateRoleChange('add', role)}>
                      Grant
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AuditReasonModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmAudit}
        title={`${auditAction?.action === 'add' ? 'Grant' : 'Revoke'} role '${auditAction?.role}'`}
        actionLabel={auditAction?.action === 'add' ? 'Grant Role' : 'Revoke Role'}
      />
    </div>
  );
}
