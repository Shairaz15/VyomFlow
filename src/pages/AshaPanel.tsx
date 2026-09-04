import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsha } from '../contexts/AshaContext';
import { BeneficiaryCard } from '../components/asha/BeneficiaryCard';
import { CreateBeneficiaryModal } from '../components/asha/CreateBeneficiaryModal';
import { EditBeneficiaryModal } from '../components/asha/EditBeneficiaryModal';
import { BeneficiaryClinicalModal } from '../components/asha/BeneficiaryClinicalModal';
import { AssistedFieldBattery } from '../components/asha/AssistedFieldBattery';
import { AshaSimulationControls } from '../components/asha/AshaSimulationControls';
import { INDIAN_LANGUAGES } from '../components/common/OnboardingModal';
import type { AshaBeneficiary } from '../services/supabaseService';
import {
    Search,
    X,
    UserPlus,
    Download,
    Sun,
    Moon,
    Filter,
    Sparkles,
    RefreshCw,
    MapPin,
    Languages,
    Stethoscope
} from 'lucide-react';
import './AshaPanel.css';

export function AshaPanel() {
    const {
        beneficiaries,
        activeBeneficiary,
        loading,
        pendingSyncCount,
        startBeneficiarySession,
        syncPendingRecords,
        registerBeneficiary,
        deleteBeneficiary,
        refreshBeneficiaries,
        isMockMode,
        seedMockCaseload
    } = useAsha();

    const [showSimControls, setShowSimControls] = useState<boolean>(() => {
        try {
            return localStorage.getItem('vyomflow_asha_mock_active') === 'true';
        } catch {
            return false;
        }
    });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingBeneficiary, setEditingBeneficiary] = useState<AshaBeneficiary | null>(null);
    const [selectedBeneficiaryForReport, setSelectedBeneficiaryForReport] = useState<AshaBeneficiary | null>(null);
    const [activeRapidBeneficiary, setActiveRapidBeneficiary] = useState<AshaBeneficiary | null>(null);
    const [searchParams, setSearchParams] = useSearchParams();

    // Auto-resume active assessment when navigating with ?resume=true
    useEffect(() => {
        if (searchParams.get('resume') === 'true' && activeBeneficiary) {
            setActiveRapidBeneficiary(activeBeneficiary);
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('resume');
            setSearchParams(nextParams, { replace: true });
        }
    }, [searchParams, activeBeneficiary, setSearchParams]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('ALL');
    const [selectedVillage, setSelectedVillage] = useState('ALL');
    const [selectedTier, setSelectedTier] = useState<'ALL' | 'CLINICAL_REVIEW' | 'MONITORED' | 'STABLE' | 'PENDING'>('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    const [isOutdoorMode, setIsOutdoorMode] = useState<boolean>(() => {
        try {
            return localStorage.getItem('vyomflow_asha_outdoor_mode') === 'true';
        } catch {
            return false;
        }
    });

    const toggleOutdoorMode = () => {
        setIsOutdoorMode(prev => {
            const next = !prev;
            try {
                localStorage.setItem('vyomflow_asha_outdoor_mode', String(next));
            } catch {
                // Ignore storage error
            }
            return next;
        });
    };

    const handleStartTest = (beneficiary: AshaBeneficiary) => {
        startBeneficiarySession(beneficiary);
        setActiveRapidBeneficiary(beneficiary);
    };

    const handleCreated = (name: string) => {
        setNotification(`Registered ${name}.`);
        setTimeout(() => setNotification(null), 3500);
    };

    const handleDelete = async (beneficiary: AshaBeneficiary) => {
        try {
            const success = await deleteBeneficiary(beneficiary.firebase_uid);
            if (success) {
                setNotification(`Removed ${beneficiary.full_name}.`);
                setTimeout(() => setNotification(null), 3500);
            }
        } catch (err: any) {
            alert('Failed to delete beneficiary: ' + err.message);
        }
    };

    // Quick seed demo beneficiaries
    const handleSeedDemoData = async () => {
        try {
            await registerBeneficiary({
                full_name: 'Lakshmi Devi',
                age: 64,
                education_years: 4,
                preferred_language: 'hi',
                gender: 'female',
                village_name: 'Chandpur Village',
                phone_number: '9876543210'
            });
            await registerBeneficiary({
                full_name: 'Kuppusamy Raman',
                age: 71,
                education_years: 0,
                preferred_language: 'ta',
                gender: 'male',
                village_name: 'Vellore Ward 3',
                phone_number: '9840123456'
            });
            await registerBeneficiary({
                full_name: 'Anjali Mondal',
                age: 58,
                education_years: 7,
                preferred_language: 'bn',
                gender: 'female',
                village_name: 'Sundarban Block',
                phone_number: '9433098765'
            });
            setNotification('Added 3 demo rural beneficiaries.');
            setTimeout(() => setNotification(null), 3500);
        } catch {
            // Ignore error
        }
    };

    // Village Options dynamically extracted from data
    const villageOptions = useMemo(() => {
        const set = new Set<string>();
        beneficiaries.forEach(b => {
            if (b.village_name && b.village_name.trim()) {
                set.add(b.village_name.trim());
            }
        });
        return Array.from(set).sort();
    }, [beneficiaries]);

    // Export CSV
    const handleExportCsv = () => {
        if (beneficiaries.length === 0) {
            alert('No beneficiaries to export.');
            return;
        }
        const headers = [
            'Full Name',
            'Age',
            'Gender',
            'Schooling Years',
            'Preferred Language',
            'Village / Ward',
            'Caregiver Phone',
            'ABHA ID',
            'Latest MoCA (/30)',
            'Screening Tier',
            'Assessments Completed',
            'Last Assessed Date'
        ];
        const rows = beneficiaries.map(b => [
            `"${(b.full_name || '').replace(/"/g, '""')}"`,
            b.age,
            b.gender || 'N/A',
            b.education_years,
            b.preferred_language,
            `"${(b.village_name || '').replace(/"/g, '""')}"`,
            b.phone_number || '',
            b.abha_id || '',
            b.latest_moca != null ? Math.round(b.latest_moca) : 'Pending',
            b.latest_alert_tier || 'NOT_ASSESSED',
            b.assessments_count || 0,
            b.last_assessed_at ? new Date(b.last_assessed_at).toISOString().slice(0, 10) : 'Never'
        ]);
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `asha_roster_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setNotification('Roster exported to CSV.');
        setTimeout(() => setNotification(null), 3500);
    };

    // Filter & Search
    const filteredBeneficiaries = useMemo(() => {
        return beneficiaries.filter(b => {
            const matchesQuery =
                !searchQuery.trim() ||
                b.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (b.village_name && b.village_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (b.phone_number && b.phone_number.includes(searchQuery.trim())) ||
                (b.abha_id && b.abha_id.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesLang =
                selectedLanguage === 'ALL' ||
                b.preferred_language === selectedLanguage ||
                b.preferred_language?.startsWith(selectedLanguage);

            const matchesVillage =
                selectedVillage === 'ALL' ||
                b.village_name === selectedVillage;

            const hasAssessed = (b.assessments_count ?? 0) > 0;
            const tier = b.latest_alert_tier || 'PENDING';
            const isHighRisk = tier.includes('RECOMMEND') || tier.includes('EVALUATION') || tier === 'CLINICAL_REVIEW';

            const matchesTier =
                selectedTier === 'ALL' ||
                (selectedTier === 'PENDING' && !hasAssessed) ||
                (selectedTier === 'CLINICAL_REVIEW' && isHighRisk) ||
                (selectedTier === 'STABLE' && (tier === 'STABLE' || hasAssessed));

            return matchesQuery && matchesLang && matchesVillage && matchesTier;
        });
    }, [beneficiaries, searchQuery, selectedLanguage, selectedVillage, selectedTier]);

    // Statistics
    const totalCount = beneficiaries.length;
    const testedCount = beneficiaries.filter(b => (b.assessments_count ?? 0) > 0).length;
    const highRiskCount = beneficiaries.filter(b => {
        const tier = b.latest_alert_tier || '';
        return tier.includes('RECOMMEND') || tier.includes('EVALUATION') || tier === 'CLINICAL_REVIEW';
    }).length;
    const pendingCount = totalCount - testedCount;

    return (
        <div className={`clean-portal ${isOutdoorMode ? 'clean-portal-light' : ''}`}>
            {/* Top Bar with Inline KPI Strip */}
            <header className="clean-header">
                <div className="clean-header-container">
                    {/* Brand & Live Sync */}
                    <div className="clean-brand-group">
                        <div className="clean-brand-title">
                            <span className="clean-brand-accent">VyomFlow</span>
                            <span className="clean-brand-slash">/</span>
                            <span>ASHA Field</span>
                        </div>

                        {/* Inline KPI Ribbon */}
                        <div className="clean-kpi-ribbon">
                            <span className="clean-kpi-item">
                                <strong>{totalCount}</strong> Total
                            </span>
                            <span className="clean-kpi-sep">•</span>
                            <span className="clean-kpi-item">
                                <strong>{testedCount}</strong> Screened
                            </span>
                            {highRiskCount > 0 && (
                                <>
                                    <span className="clean-kpi-sep">•</span>
                                    <span className="clean-kpi-item clean-kpi-alert">
                                        <span className="clean-alert-dot" />
                                        <strong>{highRiskCount}</strong> Review Needed
                                    </span>
                                </>
                            )}
                            <span className="clean-kpi-sep">•</span>
                            <span className="clean-kpi-item">
                                <strong>{pendingCount}</strong> Pending
                            </span>
                        </div>
                    </div>

                    {/* Actions & Utilities */}
                    <div className="clean-header-actions">
                        {pendingSyncCount > 0 && (
                            <button
                                type="button"
                                className="clean-sync-chip"
                                onClick={syncPendingRecords}
                                title="Sync offline records to cloud"
                            >
                                <RefreshCw size={12} />
                                <span>{pendingSyncCount} Syncing</span>
                            </button>
                        )}

                        {/* Simulation / Demo Switcher */}
                        <button
                            type="button"
                            className={`clean-icon-btn clean-sim-toggle-btn ${showSimControls || isMockMode ? 'active' : ''}`}
                            onClick={() => setShowSimControls(prev => !prev)}
                            title={isMockMode ? "Demo Village Caseload Active (Click to toggle controls)" : "Simulate Demo Village Caseload"}
                        >
                            <Sparkles size={16} />
                            {isMockMode && <span className="clean-sim-badge">DEMO</span>}
                        </button>

                        <button
                            type="button"
                            className="clean-icon-btn"
                            onClick={toggleOutdoorMode}
                            title={isOutdoorMode ? "Switch to Dark Mode" : "Switch to Sunlight Mode"}
                        >
                            {isOutdoorMode ? <Moon size={16} /> : <Sun size={16} />}
                        </button>

                        <button
                            type="button"
                            className="clean-icon-btn"
                            onClick={handleExportCsv}
                            title="Export Roster as CSV"
                        >
                            <Download size={16} />
                        </button>

                        <button
                            type="button"
                            className="clean-primary-btn"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <UserPlus size={15} />
                            <span>Register</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Notification Toast */}
            {notification && (
                <div className="clean-notification">
                    <Sparkles size={14} />
                    <span>{notification}</span>
                    <button onClick={() => setNotification(null)}>✕</button>
                </div>
            )}

            {/* Main Content Area */}
            <main className="clean-main">
                {/* Demo Simulation Strip */}
                {showSimControls && (
                    <AshaSimulationControls
                        onClose={() => setShowSimControls(false)}
                        onToast={msg => {
                            setNotification(msg);
                            setTimeout(() => setNotification(null), 4000);
                        }}
                    />
                )}

                {/* Single-Line Filter Toolbar */}
                <div className="clean-toolbar">
                    <div className="clean-search-wrap">
                        <Search size={15} className="clean-search-icon" />
                        <input
                            type="text"
                            className="clean-search-input"
                            placeholder="Search beneficiaries by name, village, or phone..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button className="clean-clear-btn" onClick={() => setSearchQuery('')}>
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Segmented Pill Tabs */}
                    <div className="clean-tab-group">
                        <button
                            type="button"
                            className={`clean-tab ${selectedTier === 'ALL' ? 'active' : ''}`}
                            onClick={() => setSelectedTier('ALL')}
                        >
                            All ({totalCount})
                        </button>
                        <button
                            type="button"
                            className={`clean-tab alert-tab ${selectedTier === 'CLINICAL_REVIEW' ? 'active' : ''}`}
                            onClick={() => setSelectedTier('CLINICAL_REVIEW')}
                        >
                            Review ({highRiskCount})
                        </button>
                        <button
                            type="button"
                            className={`clean-tab ${selectedTier === 'PENDING' ? 'active' : ''}`}
                            onClick={() => setSelectedTier('PENDING')}
                        >
                            Pending ({pendingCount})
                        </button>
                        <button
                            type="button"
                            className={`clean-tab ${selectedTier === 'STABLE' ? 'active' : ''}`}
                            onClick={() => setSelectedTier('STABLE')}
                        >
                            Screened ({testedCount})
                        </button>
                    </div>

                    {/* Secondary Filter Toggle */}
                    <button
                        type="button"
                        className={`clean-filter-toggle ${showFilters || selectedVillage !== 'ALL' || selectedLanguage !== 'ALL' ? 'active' : ''}`}
                        onClick={() => setShowFilters(prev => !prev)}
                        title="Filter by village or language"
                    >
                        <Filter size={14} />
                        <span>Filter</span>
                        {(selectedVillage !== 'ALL' || selectedLanguage !== 'ALL') && (
                            <span className="clean-filter-badge">1</span>
                        )}
                    </button>
                </div>

                {/* Collapsible Secondary Filter Bar (Only shown when requested) */}
                {showFilters && (
                    <div className="clean-filter-drawer">
                        {villageOptions.length > 0 && (
                            <div className="clean-select-box">
                                <MapPin size={13} />
                                <select
                                    value={selectedVillage}
                                    onChange={e => setSelectedVillage(e.target.value)}
                                >
                                    <option value="ALL">All Villages ({villageOptions.length})</option>
                                    {villageOptions.map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="clean-select-box">
                            <Languages size={13} />
                            <select
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
                        </div>

                        {(selectedVillage !== 'ALL' || selectedLanguage !== 'ALL') && (
                            <button
                                type="button"
                                className="clean-reset-link"
                                onClick={() => {
                                    setSelectedVillage('ALL');
                                    setSelectedLanguage('ALL');
                                }}
                            >
                                Reset filters
                            </button>
                        )}
                    </div>
                )}

                {/* Beneficiary Grid */}
                {loading && beneficiaries.length === 0 ? (
                    <div className="clean-empty">
                        <div className="clean-spinner" />
                        <p>Syncing field roster...</p>
                    </div>
                ) : filteredBeneficiaries.length === 0 ? (
                    <div className="clean-empty">
                        <Stethoscope size={32} className="clean-empty-icon" />
                        <h3>No beneficiaries found</h3>
                        <p>
                            {searchQuery || selectedTier !== 'ALL' || selectedVillage !== 'ALL'
                                ? 'No records match your active search or filters.'
                                : 'No beneficiaries have been added to your field unit yet.'}
                        </p>
                        <div className="clean-empty-actions">
                            <button
                                type="button"
                                className="clean-primary-btn"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                <UserPlus size={14} /> Register Beneficiary
                            </button>
                            {beneficiaries.length === 0 && (
                                <button
                                    type="button"
                                    className="clean-secondary-btn"
                                    onClick={async () => {
                                        try {
                                            await seedMockCaseload();
                                            setShowSimControls(true);
                                            setNotification('🧪 Loaded 12 demo village elders across Chandpur, Rampur & Sonapur.');
                                            setTimeout(() => setNotification(null), 4000);
                                        } catch {
                                            handleSeedDemoData();
                                        }
                                    }}
                                >
                                    <Sparkles size={14} style={{ marginRight: 6 }} />
                                    Load Demo Caseload (12 Elders)
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="clean-grid">
                        {filteredBeneficiaries.map(beneficiary => (
                            <BeneficiaryCard
                                key={beneficiary.firebase_uid}
                                beneficiary={beneficiary}
                                onStartTest={handleStartTest}
                                onViewReport={b => setSelectedBeneficiaryForReport(b)}
                                onEdit={b => setEditingBeneficiary(b)}
                                onDelete={handleDelete}
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

            <EditBeneficiaryModal
                isOpen={Boolean(editingBeneficiary)}
                beneficiary={editingBeneficiary}
                onClose={() => setEditingBeneficiary(null)}
                onUpdated={updated => {
                    refreshBeneficiaries();
                    setNotification(`Updated ${updated.full_name}.`);
                    setTimeout(() => setNotification(null), 3500);
                }}
            />

            <BeneficiaryClinicalModal
                isOpen={Boolean(selectedBeneficiaryForReport)}
                beneficiary={selectedBeneficiaryForReport}
                onClose={() => setSelectedBeneficiaryForReport(null)}
                onStartTest={handleStartTest}
            />

            <AssistedFieldBattery
                isOpen={Boolean(activeRapidBeneficiary)}
                beneficiary={activeRapidBeneficiary}
                onClose={() => setActiveRapidBeneficiary(null)}
                onCompleted={(beneficiary, prediction) => {
                    refreshBeneficiaries();
                    const moca = prediction?.estimatedMoCA != null ? Math.round(prediction.estimatedMoCA) : '--';
                    const tier = prediction?.clinicalAlertTier || 'STABLE';
                    setNotification(`Screening saved for ${beneficiary.full_name} (MoCA: ${moca}/30 • ${tier}).`);
                    setTimeout(() => setNotification(null), 4000);
                }}
            />
        </div>
    );
}
