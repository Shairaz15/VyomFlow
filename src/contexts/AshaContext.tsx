/**
 * ASHA Field Context
 * Manages village beneficiaries, active field participant testing sessions,
 * offline synchronization, and dynamic language switching for field tests.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import type { LanguageCode } from '../components/common/OnboardingModal';
import {
    createAshaBeneficiary,
    getAshaBeneficiaries,
    updateAshaBeneficiary,
    deleteAshaBeneficiary,
    flushOfflineQueue,
    type AshaBeneficiary,
    type AshaBeneficiaryInput
} from '../services/supabaseService';
import {
    isAshaMockCaseloadActive,
    seedAshaMockCaseload,
    clearAshaMockCaseload,
    getLocalMockBeneficiaries
} from '../services/ashaMockService';
import { logger } from '../utils/logger';

interface AshaContextType {
    beneficiaries: AshaBeneficiary[];
    activeBeneficiary: AshaBeneficiary | null;
    isFieldAssessmentActive: boolean;
    loading: boolean;
    pendingSyncCount: number;
    isMockMode: boolean;
    seedMockCaseload: () => Promise<void>;
    clearMockCaseload: () => Promise<void>;
    registerBeneficiary: (input: Omit<AshaBeneficiaryInput, 'asha_worker_id'>) => Promise<AshaBeneficiary>;
    updateBeneficiary: (firebaseUid: string, updates: Partial<AshaBeneficiary>) => Promise<AshaBeneficiary | null>;
    deleteBeneficiary: (firebaseUid: string) => Promise<boolean>;
    startBeneficiarySession: (beneficiary: AshaBeneficiary) => void;
    endBeneficiarySession: () => void;
    syncPendingRecords: () => Promise<void>;
    refreshBeneficiaries: () => Promise<void>;
}

const AshaContext = createContext<AshaContextType | null>(null);

const ACTIVE_BENEFICIARY_KEY = 'vyomflow_active_beneficiary';
const PREV_WORKER_LOCALE_KEY = 'vyomflow_prev_worker_locale';

export function AshaProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { locale, setLocale } = useLanguage();
    const [beneficiaries, setBeneficiaries] = useState<AshaBeneficiary[]>([]);
    const [activeBeneficiary, setActiveBeneficiary] = useState<AshaBeneficiary | null>(() => {
        try {
            const stored = localStorage.getItem(ACTIVE_BENEFICIARY_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
    const [isMockMode, setIsMockMode] = useState<boolean>(() => isAshaMockCaseloadActive());

    const workerId = user?.uid || 'field_worker_demo';

    // Helper to calculate pending sync items
    const updatePendingCount = useCallback(() => {
        try {
            const queueStr = localStorage.getItem('vyomflow_supabase_offline_queue');
            const queue = queueStr ? JSON.parse(queueStr) : [];
            const localUnsynced = beneficiaries.filter(b => b.is_synced === false);
            setPendingSyncCount(queue.length + localUnsynced.length);
        } catch {
            setPendingSyncCount(0);
        }
    }, [beneficiaries]);

    // Fetch beneficiaries whenever the worker changes or mock data changes
    const refreshBeneficiaries = useCallback(async () => {
        if (!workerId) return;
        setLoading(true);
        try {
            const list = await getAshaBeneficiaries(workerId);
            const mockActive = isAshaMockCaseloadActive();
            setIsMockMode(mockActive);

            if (mockActive) {
                const mockList = getLocalMockBeneficiaries();
                const map = new Map<string, AshaBeneficiary>();
                // Add mock beneficiaries
                mockList.forEach(b => map.set(b.firebase_uid, b));
                // Add any non-mock live beneficiaries
                list.filter(b => !b.firebase_uid.startsWith('asha_mock_')).forEach(b => map.set(b.firebase_uid, b));
                setBeneficiaries(Array.from(map.values()));
            } else {
                // Live mode only - exclude mock beneficiaries
                setBeneficiaries(list.filter(b => !b.firebase_uid.startsWith('asha_mock_')));
            }
        } catch (err) {
            logger.error('Failed to load ASHA beneficiaries:', err);
        } finally {
            setLoading(false);
        }
    }, [workerId]);

    // Seed mock village caseload
    const seedMockCaseload = useCallback(async () => {
        setLoading(true);
        try {
            await seedAshaMockCaseload(workerId);
            setIsMockMode(true);
            await refreshBeneficiaries();
        } finally {
            setLoading(false);
        }
    }, [workerId, refreshBeneficiaries]);

    // Clear mock village caseload
    const clearMockCaseload = useCallback(async () => {
        setLoading(true);
        try {
            await clearAshaMockCaseload(workerId);
            setIsMockMode(false);
            await refreshBeneficiaries();
        } finally {
            setLoading(false);
        }
    }, [workerId, refreshBeneficiaries]);

    useEffect(() => {
        refreshBeneficiaries();
    }, [refreshBeneficiaries]);

    useEffect(() => {
        updatePendingCount();
    }, [beneficiaries, updatePendingCount]);

    // Register a new beneficiary
    const registerBeneficiary = useCallback(async (
        input: Omit<AshaBeneficiaryInput, 'asha_worker_id'>
    ): Promise<AshaBeneficiary> => {
        const fullPayload: AshaBeneficiaryInput = {
            ...input,
            asha_worker_id: workerId
        };
        const created = await createAshaBeneficiary(fullPayload);
        setBeneficiaries(prev => [created, ...prev.filter(b => b.firebase_uid !== created.firebase_uid)]);
        updatePendingCount();
        return created;
    }, [workerId, updatePendingCount]);

    // Update an existing beneficiary
    const updateBeneficiary = useCallback(async (
        firebaseUid: string,
        updates: Partial<AshaBeneficiary>
    ): Promise<AshaBeneficiary | null> => {
        const updated = await updateAshaBeneficiary(firebaseUid, updates);
        if (updated) {
            setBeneficiaries(prev => prev.map(b => b.firebase_uid === firebaseUid ? updated : b));
        }
        return updated;
    }, []);

    // Delete or archive a beneficiary
    const deleteBeneficiary = useCallback(async (firebaseUid: string): Promise<boolean> => {
        const success = await deleteAshaBeneficiary(firebaseUid);
        if (success) {
            setBeneficiaries(prev => prev.filter(b => b.firebase_uid !== firebaseUid));
        }
        return success;
    }, []);

    // Start a testing session for a beneficiary
    const startBeneficiarySession = useCallback((beneficiary: AshaBeneficiary) => {
        setActiveBeneficiary(beneficiary);
        localStorage.setItem(ACTIVE_BENEFICIARY_KEY, JSON.stringify(beneficiary));
        localStorage.setItem(PREV_WORKER_LOCALE_KEY, locale);

        // Normalize preferred language code to 2-letter locale (e.g., 'hi-IN' -> 'hi')
        const targetLocale = (beneficiary.preferred_language?.split('-')[0]?.toLowerCase() || 'en') as LanguageCode;
        setLocale(targetLocale);
        logger.info(`Starting ASHA field session for ${beneficiary.full_name}, language switched to: ${targetLocale}`);
    }, [locale, setLocale]);

    // End testing session and return to ASHA dashboard
    const endBeneficiarySession = useCallback(() => {
        setActiveBeneficiary(null);
        localStorage.removeItem(ACTIVE_BENEFICIARY_KEY);
        
        // Restore worker's previous language if recorded
        const prevLocale = localStorage.getItem(PREV_WORKER_LOCALE_KEY) as LanguageCode | null;
        if (prevLocale) {
            setLocale(prevLocale);
            localStorage.removeItem(PREV_WORKER_LOCALE_KEY);
        }
        logger.info('Ended ASHA field assessment session');
    }, [setLocale]);

    // Manual or automatic sync button
    const syncPendingRecords = useCallback(async () => {
        if (!navigator.onLine) {
            logger.warn('Cannot sync: device is currently offline');
            return;
        }
        setLoading(true);
        try {
            await flushOfflineQueue();
            await refreshBeneficiaries();
            logger.info('Synced pending ASHA records to Supabase');
        } catch (err) {
            logger.error('Failed to sync pending records:', err);
        } finally {
            setLoading(false);
            updatePendingCount();
        }
    }, [refreshBeneficiaries, updatePendingCount]);

    const isFieldAssessmentActive = Boolean(activeBeneficiary);

    return (
        <AshaContext.Provider
            value={{
                beneficiaries,
                activeBeneficiary,
                isFieldAssessmentActive,
                loading,
                pendingSyncCount,
                isMockMode,
                seedMockCaseload,
                clearMockCaseload,
                registerBeneficiary,
                updateBeneficiary,
                deleteBeneficiary,
                startBeneficiarySession,
                endBeneficiarySession,
                syncPendingRecords,
                refreshBeneficiaries
            }}
        >
            {children}
        </AshaContext.Provider>
    );
}

export function useAsha(): AshaContextType {
    const context = useContext(AshaContext);
    if (!context) {
        throw new Error('useAsha must be used within an AshaProvider');
    }
    return context;
}
