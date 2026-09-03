/**
 * Admin Sidebar Component
 * Navigation for admin panel pages.
 */

import { NavLink } from 'react-router-dom';
import './AdminSidebar.css';

export function AdminSidebar() {
    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <span className="admin-logo">🛡️</span>
                <h2>Admin Panel</h2>
            </div>
            <nav className="sidebar-nav">
                <NavLink to="/admin" end className="nav-item">
                    <span className="nav-icon">📊</span>
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/admin/users" className="nav-item">
                    <span className="nav-icon">👥</span>
                    <span>Users</span>
                </NavLink>
                <NavLink to="/admin/analytics" className="nav-item">
                    <span className="nav-icon">📈</span>
                    <span>Analytics</span>
                </NavLink>
                <NavLink to="/admin/models" className="nav-item">
                    <span className="nav-icon">🤖</span>
                    <span>Models</span>
                </NavLink>
            </nav>
            <div className="sidebar-footer">
                <NavLink to="/dashboard" className="back-link">
                    ← Back to App
                </NavLink>
            </div>
        </aside>
    );
}
