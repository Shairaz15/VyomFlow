/**
 * Admin Route Component
 * Redirects non-admin users to dashboard.
 * Uses role from JWT Custom Claims.
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminRouteProps {
    children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
