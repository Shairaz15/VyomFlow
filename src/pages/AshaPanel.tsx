import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsha } from '../contexts/AshaContext';
import { BeneficiaryCard } from '../components/asha/BeneficiaryCard';
import { CreateBeneficiaryModal } from '../components/asha/CreateBeneficiaryModal';
import { BeneficiaryClinicalModal } from '../components/asha/BeneficiaryClinicalModal';
import { INDIAN_LANGUAGES } from '../components/common/OnboardingModal';
import type { AshaBeneficiary } from '../services/supabaseService';
import './AshaPanel.css';

export function AshaPanel() {
    const navigate = useNavigate();
    const {
        beneficiaries,
        loading,
        pendingSyncCount,
        startBeneficiarySession,
        syncPendingRecords,
        registerBeneficiary
    } = useAsha();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedBeneficiaryForReport, setSelectedBeneficiaryForReport] = useState<AshaBeneficiary | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'TESTED' | 'PENDING'>('ALL');
    const [notification, setNotification] = useState<string | null>(null);

    const handleStartTest = (beneficiary: AshaBeneficiary) => {
        startBeneficiarySession(beneficiary);
        // Navigate directly to the interactive assessment journey
        navigate('/journey');
    };

    const handleCreated = (name: string) => {
        setNotification(`Successfully registered ${name}! You can now start their assessment.`);
        setTimeout(() => setNotification(null), 4000);
    };

    // Quick seed demo beneficiaries for rapid hackathon testing/presentation
    const handleSeedDemoData = async () => {
        try {
            await registerBeneficiary({
                full_name: 'Lakshmi Devi',
                age: 64,
                education_years: 4,
                preferred_language: 'hi',
                gender: 'female',
                village_name: 'Chandpur Village'
            });
            await registerBeneficiary({
                full_name: 'Kuppusamy Raman',
                age: 71,
                education_years: 0,
                preferred_language: 'ta',
                gender: 'male',
                village_name: 'Vellore Ward 3'
            });
            await registerBeneficiary({
                full_name: 'Anjali Mondal',
                age: 58,
                education_years: 7,
                preferred_language: 'bn',
                gender: 'female',
                village_name: 'Sundarban Block'
            });
            setNotification('Added 3 demo village beneficiaries across Hindi, Tamil, and Bengali!');
            setTimeout(() => setNotification(null), 4000);
        } catch {
            // Ignore error
        }
    };

    // Filter & Search
    const filteredBeneficiaries = useMemo(() => {
        return beneficiaries.filter(b => {
            const matchesQuery =
                !searchQuery.trim() ||
                b.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (b.village_name && b.village_name.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesLang =
                selectedLanguage === 'ALL' ||
                b.preferred_language === selectedLanguage ||
                b.preferred_language?.startsWith(selectedLanguage);

            const hasAssessed = (b.assessments_count ?? 0) > 0;
            const matchesStatus =
                selectedStatus === 'ALL' ||
                (selectedStatus === 'TESTED' && hasAssessed) ||
                (selectedStatus === 'PENDING' && !hasAssessed);

            return matchesQuery && matchesLang && matchesStatus;
        });
    }, [beneficiaries, searchQuery, selectedLanguage, selectedStatus]);

    // Statistics
    const totalCount = beneficiaries.length;
    const testedCount = beneficiaries.filter(b => (b.assessments_count ?? 0) > 0).length;
    const pendingCount = totalCount - testedCount;

    return (
        <div className="asha-portal-page">
            {/* Header / Hero */}
            <header className="asha-portal-header">
                <div className="asha-portal-header-content">
                    <div className="asha-header-badge-row">
                        <span className="asha-portal-pill">ASHA COMMUNITY FIELD WORKER PORTAL</span>
                        <div className="asha-online-status">
                            <span className={`status-dot ${navigator.onLine ? 'online' : 'offline'}`} />
                            <span>{navigator.onLine ? 'Cloud Online' : 'Offline Mode Active'}</span>
                            {pendingSyncCount > 0 && (
                                <button
                                    className="asha-sync-chip"
                                    onClick={syncPendingRecords}
                                    title="Click to sync pending offline records to Supabase"
                                >
                                    🔄 {pendingSyncCount} Pending Sync
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="asha-title-action-row">
                        <div>
                            <h1 className="asha-portal-h1">Grassroots Cognitive Screening</h1>
                            <p className="asha-portal-lead">
                                Conduct AI digital biomarker assessments for rural residents who have no access to technology.
                                Native language tutorials, offline caching, and instant Supabase syncing.
                            </p>
                        </div>
                        <div className="asha-header-btns">
                            <button
                                className="asha-btn asha-btn-primary asha-btn-lg"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                <span className="asha-btn-icon">+</span>
                                <span>Register Beneficiary</span>
                            </button>
                        </div>
                    </div>

                    {/* Metric Cards */}
                    <div className="asha-metrics-grid">
                        <div className="asha-metric-card">
                            <span className="asha-metric-icon">👥</span>
                            <div>
                                <span className="asha-metric-num">{totalCount}</span>
                                <span className="asha-metric-text">Total Beneficiaries</span>
                            </div>
                        </div>

                        <div className="asha-metric-card">
                            <span className="asha-metric-icon">✅</span>
                            <div>
                                <span className="asha-metric-num">{testedCount}</span>
                                <span className="asha-metric-text">Screened & Profiled</span>
                            </div>
                        </div>

                        <div className="asha-metric-card">
                            <span className="asha-metric-icon">⏳</span>
                            <div>
                                <span className="asha-metric-num">{pendingCount}</span>
                                <span className="asha-metric-text">Pending Screening</span>
                            </div>
                        </div>

                        <div className="asha-metric-card">
                            <span className="asha-metric-icon">🌐</span>
                            <div>
                                <span className="asha-metric-num">11</span>
                                <span className="asha-metric-text">Supported Indian Languages</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Notification Banner */}
            {notification && (
                <div className="asha-portal-notification">
                    <span>✨</span> {notification}
                </div>
            )}

            {/* Main Content Area */}
            <main className="asha-portal-main">
                <div className="asha-controls-bar">
                    {/* Search Input */}
                    <div className="asha-search-box">
                        <span className="asha-search-icon">🔍</span>
                        <input
                            type="text"
                            className="asha-search-input"
                            placeholder="Search by beneficiary name or village locality..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="asha-search-clear" onClick={() => setSearchQuery('')}>✕</button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="asha-filter-group">
                        <select
                            className="asha-filter-select"
                            value={selectedLanguage}
                            onChange={e => setSelectedLanguage(e.target.value)}
                        >
                            <option value="ALL">All Languages ({INDIAN_LANGUAGES.length})</option>
                            {INDIAN_LANGUAGES.map(l => (
                                <option key={l.code} value={l.code}>
                                    {l.native} ({l.label})
                                </option>
                            ))}
                        </select>

                        <select
                            className="asha-filter-select"
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value as any)}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="TESTED">Assessed Only</option>
                            <option value="PENDING">Pending Screening Only</option>
                        </select>
                    </div>
                </div>

                {/* Beneficiary Grid */}
                {loading && beneficiaries.length === 0 ? (
                    <div className="asha-empty-state">
                        <div className="asha-spinner" />
                        <p>Loading village beneficiary directory from Supabase...</p>
                    </div>
                ) : filteredBeneficiaries.length === 0 ? (
                    <div className="asha-empty-state">
                        <span className="asha-empty-graphic">🌾</span>
                        <h2>No Beneficiaries Found</h2>
                        <p>
                            {searchQuery || selectedLanguage !== 'ALL' || selectedStatus !== 'ALL'
                                ? 'No beneficiaries match your current search and filter criteria.'
                                : 'You haven\'t registered any village beneficiaries yet.'}
                        </p>
                        <div className="asha-empty-actions">
                            <button
                                className="asha-btn asha-btn-primary"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                + Register First Beneficiary
                            </button>
                            {beneficiaries.length === 0 && (
                                <button
                                    className="asha-btn asha-btn-secondary"
                                    onClick={handleSeedDemoData}
                                >
                                    🌱 Load Demo Rural Beneficiaries
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="asha-beneficiaries-grid">
                        {filteredBeneficiaries.map(beneficiary => (
                            <BeneficiaryCard
                                key={beneficiary.firebase_uid}
                                beneficiary={beneficiary}
                                onStartTest={handleStartTest}
                                onViewReport={b => setSelectedBeneficiaryForReport(b)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
            <CreateBeneficiaryModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleCreated}
            />

            <BeneficiaryClinicalModal
                isOpen={Boolean(selectedBeneficiaryForReport)}
                beneficiary={selectedBeneficiaryForReport}
                onClose={() => setSelectedBeneficiaryForReport(null)}
                onStartTest={handleStartTest}
            />
        </div>
    );
}
