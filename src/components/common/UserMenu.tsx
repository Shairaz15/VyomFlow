/**
 * User Menu Component
 * Dropdown menu for authenticated users showing profile and actions.
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, LayoutDashboard, Settings, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import './UserMenu.css';

export function UserMenu() {
    const { user, isAdmin, signOut } = useAuth();
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setIsOpen(false);
        navigate('/');
    };

    if (!user) return null;

    return (
        <div className="user-menu" ref={menuRef}>
            <button
                className="user-menu-trigger"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                {user.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="user-avatar"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="user-avatar-placeholder">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                )}
                <span className="user-name">{user.displayName?.split(' ')[0] || 'User'}</span>
                <svg
                    className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                >
                    <path fill="currentColor" d="M7 10l5 5 5-5z" />
                </svg>
            </button>

            {isOpen && (
                <div className="user-menu-dropdown">
                    <div className="user-info">
                        <span className="user-email">{user.email}</span>
                        {isAdmin && <span className="admin-badge">{t('common.admin')}</span>}
                    </div>
                    <div className="menu-divider" />
                    <Link to="/tests" className="menu-item" onClick={() => setIsOpen(false)}>
                        <Compass className="menu-item-icon" size={16} strokeWidth={1.75} />
                        <span>{t('common.cognitiveJourney')}</span>
                    </Link>
                    <Link to="/dashboard" className="menu-item" onClick={() => setIsOpen(false)}>
                        <LayoutDashboard className="menu-item-icon" size={16} strokeWidth={1.75} />
                        <span>{t('common.dashboard')}</span>
                    </Link>
                    <Link to="/settings" className="menu-item" onClick={() => setIsOpen(false)}>
                        <Settings className="menu-item-icon" size={16} strokeWidth={1.75} />
                        <span>{t('common.settings')}</span>
                    </Link>
                    {isAdmin && (
                        <>
                            <div className="menu-divider" />
                            <Link to="/admin" className="menu-item admin-link" onClick={() => setIsOpen(false)}>
                                <Shield className="menu-item-icon" size={16} strokeWidth={1.75} />
                                <span>{t('common.adminPanel')}</span>
                            </Link>
                        </>
                    )}
                    <div className="menu-divider" />
                    <button className="menu-item signout-button" onClick={handleSignOut}>
                        <LogOut className="menu-item-icon" size={16} strokeWidth={1.75} />
                        <span>{t('common.signOut')}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
