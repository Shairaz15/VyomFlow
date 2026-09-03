import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Icon, UserMenu, GoogleSignInButton, VyomFlowLogo } from "../common";
import { ThemeToggle } from "../common/ThemeToggle";
import { useAuth } from "../../contexts/AuthContext";
import { FOOTER_DISCLAIMER } from "../../ethics/disclaimer";
import "./PageWrapper.css";

interface PageWrapperProps {
    children: React.ReactNode;
    showHeader?: boolean;
    showFooter?: boolean;
}

export function PageWrapper({
    children,
    showHeader = true,
    showFooter = true,
}: PageWrapperProps) {
    const location = useLocation();
    const currentPath = location.pathname;

    // Scroll to top on route change so the page always starts at the top
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPath]);
    const { isAuthenticated, loading } = useAuth();

    const isActive = (path: string) => currentPath === path;

    const isTestRoute = 
        currentPath.startsWith("/test/") || 
        currentPath.startsWith("/tests/") || 
        currentPath.startsWith("/activities/");

    const shouldShowHeader = showHeader && !isTestRoute;
    const shouldShowFooter = showFooter && !isTestRoute;
    const shouldShowMobileNav = !isTestRoute;

    return (
        <div className={`page-wrapper ${isTestRoute ? "is-test-mode" : ""}`}>
            {shouldShowHeader && (
                <header className="page-header">
                    <div className="container">
                        <a href="/" className="logo" aria-label="VyomFlow Home">
                            <VyomFlowLogo size="md" theme="auto" />
                        </a>
                        <nav className="nav desktop-nav">
                            <a
                                href="/dashboard"
                                className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
                            >
                                Dashboard
                            </a>
                            <a
                                href="/tests"
                                className={`nav-link ${isActive("/tests") ? "active" : ""}`}
                            >
                                Tests
                            </a>
                        </nav>
                        {/* User Profile Menu or Sign In Button */}
                        <div className="header-auth" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <ThemeToggle />
                            {loading ? (
                                <div className="auth-loading" />
                            ) : isAuthenticated ? (
                                <UserMenu />
                            ) : currentPath !== "/tests" ? (
                                <GoogleSignInButton />
                            ) : null}
                        </div>
                    </div>
                </header>
            )}

            <main className={`page-main ${isTestRoute ? "test-main-viewport" : ""}`}>
                {children}
            </main>

            {shouldShowFooter && (
                <footer className="page-footer">
                    <div className="container">
                        <p className="footer-disclaimer">{FOOTER_DISCLAIMER}</p>
                    </div>
                </footer>
            )}

            {/* Mobile Bottom Navigation (Hidden during active test assessments) */}
            {shouldShowMobileNav && (
                <nav className="mobile-nav">
                    <a
                        href="/"
                        className={`mobile-nav-item ${isActive("/") ? "active" : ""}`}
                    >
                        <span className="mobile-nav-icon">
                            <Icon name="insight" size={20} />
                        </span>
                        <span className="mobile-nav-label">Home</span>
                    </a>
                    <a
                        href="/dashboard"
                        className={`mobile-nav-item ${isActive("/dashboard") ? "active" : ""}`}
                    >
                        <span className="mobile-nav-icon">
                            <Icon name="chart-line-up" size={20} />
                        </span>
                        <span className="mobile-nav-label">Dashboard</span>
                    </a>
                    <a
                        href="/tests"
                        className={`mobile-nav-item ${isActive("/tests") ? "active" : ""}`}
                    >
                        <span className="mobile-nav-icon">
                            <Icon name="assess" size={20} />
                        </span>
                        <span className="mobile-nav-label">Tests</span>
                    </a>
                </nav>
            )}
        </div>
    );
}
