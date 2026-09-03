/**
 * User Management Page
 * Paginated user list with admin actions (delete, reset baseline).
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminSidebar } from '../components/AdminSidebar';
import { MOCK_USERS } from '../data/mockData';
import type { AdminUser } from '../data/mockData';
import './UserManagement.css';

export function UserManagement() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        // Use centralized mock data
        setUsers(MOCK_USERS);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Delete all data for this user? This cannot be undone.')) return;
        if (userId === currentUser?.uid) {
            alert('Cannot delete your own account.');
            return;
        }

        setActionLoading(userId);
        try {
            // Mock simulation
            await new Promise(resolve => setTimeout(resolve, 1000));
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            alert('User deleted (Mock)');
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetBaseline = async (userId: string) => {
        if (!confirm('Reset baseline for this user? Their trend analysis will restart.')) return;

        setActionLoading(userId);
        try {
            // Mock simulation
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('Baseline reset successfully (Mock)');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-content">
                <header className="admin-header">
                    <h1>User Management</h1>
                    <span className="user-count">{users.length} users loaded</span>
                </header>

                <div className="user-table-container">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>User ID (Hashed)</th>
                                <th>Name</th>
                                <th>Sessions</th>
                                <th>Last Active</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((userRecord) => (
                                <tr key={userRecord.id}>
                                    <td className="monospace">{userRecord.hashedId}</td>
                                    <td>{userRecord.displayName}</td>
                                    <td>{userRecord.sessionCount}</td>
                                    <td>
                                        {userRecord.lastActive
                                            ? userRecord.lastActive.toLocaleDateString()
                                            : 'Never'}
                                    </td>
                                    <td>
                                        <span className={`role-badge ${userRecord.role}`}>
                                            {userRecord.role}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button
                                            className="action-btn reset"
                                            onClick={() => handleResetBaseline(userRecord.id)}
                                            disabled={actionLoading === userRecord.id}
                                        >
                                            Reset
                                        </button>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => handleDeleteUser(userRecord.id)}
                                            disabled={actionLoading === userRecord.id || userRecord.id === currentUser?.uid}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {loading && <div className="table-loading">Loading...</div>}


                </div>
            </main>
        </div>
    );
}
