import type { SessionData } from './statisticalDriftEngine';
import type { ReactionTestResult } from '../components/tests/reaction/reactionFeatures';
import type { PatternAssessmentResult } from '../types/patternTypes';
import type { LanguageAssessmentResult } from '../types/languageTypes';
import type { VmraAssessmentResult } from '../types/vmraTypes';
import type { StoryAssessmentResult } from '../types/storyTypes';
import type { ImmersiveNavigationResult } from '../types/navigationTypes';
import type { SavtAssessmentResult } from '../types/savtTypes';

export interface UserDemographics {
    age?: number;
    educationYears?: number;
    gender?: string;
}

export interface RawDashboardData {
    reaction: ReactionTestResult[];
    memory: any[]; // Or MemoryTestResult[] if imported
    pattern: PatternAssessmentResult[];
    language: LanguageAssessmentResult[];
    vmra: VmraAssessmentResult[];
    story: StoryAssessmentResult[];
    navigation: ImmersiveNavigationResult[];
    attention?: SavtAssessmentResult[];
}

/**
 * Groups raw module results by the day they were taken.
 * If multiple tests were taken on the same day, it uses the latest one.
 */
export function mapToSessionData(data: RawDashboardData): SessionData[] {
    const sessionMap = new Map<string, SessionData>();

    const getDayKey = (date: Date | string | number) => {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    const processResults = <T extends { timestamp: Date | string | number }>(
        results: T[], 
        moduleName: string, 
        scoreExtractor: (item: T) => number
    ) => {
        results.forEach(result => {
            const date = new Date(result.timestamp);
            const key = getDayKey(date);
            const score = scoreExtractor(result);
            
            if (!sessionMap.has(key)) {
                sessionMap.set(key, {
                    sessionId: key,
                    timestamp: date.getTime(),
                    moduleScores: {}
                });
            }
            
            // Overwrite with the latest score for that day
            const session = sessionMap.get(key)!;
            session.moduleScores[moduleName] = score;
            if (date.getTime() > session.timestamp) {
                session.timestamp = date.getTime();
            }
        });
    };

    // Map Reaction
    processResults(data.reaction || [], 'reaction', (r) => {
        return Math.max(0, 100 - ((r as any).aggregates?.avg || 300) / 20); 
    });

    // Map Pattern
    processResults(data.pattern || [], 'pattern', (p) => {
        return Math.min(100, ((p as any).metrics?.maxLevelReached || 1) * 10);
    });

    // Map Memory (legacy fallback)
    processResults(data.memory || [], 'memory', (m) => {
        return (m.accuracy || 0.5) * 100;
    });

    // Map Language — use CSI as primary, fluencyIndex as fallback, null for missing
    processResults(data.language || [], 'language', (l) => {
        return l.derivedFeatures?.cognitiveSpeechIndex ?? l.derivedFeatures?.fluencyIndex ?? null as unknown as number;
    });

    // Map VMRA
    processResults(data.vmra || [], 'vmra', (v) => {
        return (((v.features as any)?.recallAccuracy ?? (v.features as any)?.accuracy ?? 0.8)) * 100;
    });

    // Map Story — use direct storyRecallScore (0-100)
    processResults(data.story || [], 'story', (s) => {
        return s.storyRecallScore ?? null as unknown as number;
    });

    // Map Navigation — use direct navigationScore (0-100)
    processResults(data.navigation || [], 'navigation', (n) => {
        return n.navigationScore ?? null as unknown as number;
    });

    // Map Attention / SAVT
    processResults(data.attention || [], 'savt', (a) => {
        return a.profile?.compositeScore ?? (a.features?.hitRate != null ? Math.round(a.features.hitRate * 100) : null) as unknown as number;
    });

    // Sort by timestamp ascending
    const sessions = Array.from(sessionMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    return sessions;
}
