import {
    useReactionResults,
    useMemoryResults,
    usePatternResults,
    useLanguageResults,
    useVmraResults,
    useStoryResults,
    useNavigationResults,
    useAttentionResults,
    clearAllTestData,
    STORAGE_KEYS,
} from '../../hooks/useTestResults';
import { generateSimulatedData, getMockBaseline } from '../../utils/simulateUserData';
import { logger } from '../../utils/logger';
import { saveResultToFirestore, isUserAuthenticated } from '../../services/firestoreService';

export function SimulationControls() {
    const { results: reactionResults } = useReactionResults();
    const { results: memoryResults } = useMemoryResults();
    const { results: patternResults } = usePatternResults();
    const { results: languageResults } = useLanguageResults();
    const { results: vmraResults } = useVmraResults();
    const { results: storyResults } = useStoryResults();
    const { results: navigationResults } = useNavigationResults();
    const { results: attentionResults } = useAttentionResults();

    const hasUserData = reactionResults.length > 0 || memoryResults.length > 0 || patternResults.length > 0 ||
        languageResults.length > 0 || vmraResults.length > 0 || storyResults.length > 0 || navigationResults.length > 0 || attentionResults.length > 0;

    const refreshData = () => window.location.reload();

    const handleClearData = async () => {
        if (window.confirm('Clear all test and simulation data? This cannot be undone.')) {
            await clearAllTestData();
            refreshData();
        }
    };

    const persistSimulatedData = async (simulated: ReturnType<typeof generateSimulatedData>) => {
        try {
            // 1. Direct atomic write to localStorage for instant hydration
            if (simulated.reaction.length > 0) {
                localStorage.setItem(STORAGE_KEYS.reactionResults, JSON.stringify(simulated.reaction));
            }
            if (simulated.attention.length > 0) {
                localStorage.setItem(STORAGE_KEYS.attentionResults, JSON.stringify(simulated.attention));
            }
            if (simulated.vmra.length > 0) {
                localStorage.setItem(STORAGE_KEYS.vmraResults, JSON.stringify(simulated.vmra));
            }
            if (simulated.story.length > 0) {
                localStorage.setItem(STORAGE_KEYS.storyResults, JSON.stringify(simulated.story));
            }
            if (simulated.language.length > 0) {
                localStorage.setItem(STORAGE_KEYS.languageResults, JSON.stringify(simulated.language));
            }
            if (simulated.pattern.length > 0) {
                localStorage.setItem(STORAGE_KEYS.patternResults, JSON.stringify(simulated.pattern));
            }
            if (simulated.navigation.length > 0) {
                localStorage.setItem(STORAGE_KEYS.navigationResults, JSON.stringify(simulated.navigation));
            }

            // 2. Also persist to Firestore if logged in
            if (isUserAuthenticated()) {
                const promises: Promise<any>[] = [];
                simulated.reaction.forEach(r => promises.push(saveResultToFirestore("reaction_results", r)));
                simulated.attention.forEach(a => promises.push(saveResultToFirestore("attention_results", a)));
                simulated.vmra.forEach(v => promises.push(saveResultToFirestore("vmra_results", v)));
                simulated.story.forEach(s => promises.push(saveResultToFirestore("story_results", s)));
                simulated.language.forEach(l => promises.push(saveResultToFirestore("language_results", l)));
                simulated.pattern.forEach(p => promises.push(saveResultToFirestore("pattern_results", p)));
                simulated.navigation.forEach(n => promises.push(saveResultToFirestore("navigation_results", n)));
                await Promise.allSettled(promises);
            }

            setTimeout(refreshData, 100);
        } catch (error) {
            logger.error('Failed to persist simulated data:', error);
            alert('Failed to save simulation data.');
        }
    };

    const handleMockData = async (pattern: 'stable' | 'declining') => {
        const baseline = getMockBaseline();
        const simulated = generateSimulatedData(baseline, pattern);
        await persistSimulatedData(simulated);
    };

    const handleSimulateData = async (pattern: 'stable' | 'declining') => {
        const mockBase = getMockBaseline();
        const baseline = {
            reaction: reactionResults.length > 0 ? reactionResults[reactionResults.length - 1] : mockBase.reaction,
            attention: attentionResults.length > 0 ? attentionResults[attentionResults.length - 1] : mockBase.attention,
            pattern: patternResults.length > 0 ? patternResults[patternResults.length - 1] : mockBase.pattern,
            language: languageResults.length > 0 ? languageResults[languageResults.length - 1] : mockBase.language,
            vmra: vmraResults.length > 0 ? vmraResults[vmraResults.length - 1] : mockBase.vmra,
            story: storyResults.length > 0 ? storyResults[storyResults.length - 1] : mockBase.story,
            navigation: navigationResults.length > 0 ? navigationResults[navigationResults.length - 1] : mockBase.navigation,
        };

        const simulated = generateSimulatedData(baseline, pattern);
        await persistSimulatedData(simulated);
    };

    const totalSessions = new Set([
        ...reactionResults.map(r => new Date(r.timestamp).toDateString()),
        ...attentionResults.map(r => new Date(r.timestamp).toDateString()),
        ...memoryResults.map(r => new Date(r.timestamp).toDateString()),
        ...patternResults.map(r => new Date(r.timestamp).toDateString()),
        ...languageResults.map(r => new Date(r.timestamp).toDateString()),
        ...vmraResults.map(r => new Date(r.timestamp).toDateString()),
        ...storyResults.map(r => new Date(r.timestamp).toDateString()),
        ...navigationResults.map(r => new Date(r.timestamp).toDateString()),
    ]).size;

    return (
        <div className="dv2-card dv2-sim-controls">
            <div className="dv2-sim-label">🧪 Demo / Simulation Controls</div>

            <div style={{ fontSize: '0.75rem', color: 'var(--dv2-muted)', marginBottom: '0.5rem' }}>
                Based on Your Baseline (uses unbiased defaults for uncompleted tests)
            </div>
            <div className="dv2-sim-buttons">
                <button className="dv2-sim-danger" onClick={handleClearData}>🗑️ Clear All Data</button>
                <button onClick={() => handleSimulateData('declining')}>📉 Declining (Baseline)</button>
                <button onClick={() => handleSimulateData('stable')}>📈 Stable (Baseline)</button>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--dv2-muted)', marginTop: '0.75rem', marginBottom: '0.5rem' }}>
                Full Synthetic Cohort (Unbiased Normative Baseline)
            </div>
            <div className="dv2-sim-buttons">
                <button onClick={() => handleMockData('declining')}>📉 Mock Declining</button>
                <button onClick={() => handleMockData('stable')}>📈 Mock Stable</button>
            </div>

            <div className="dv2-sim-hint">
                ℹ️ {hasUserData ? `${totalSessions} session(s) recorded` : 'Currently displaying unbiased default dataset'}
            </div>
        </div>
    );
}
