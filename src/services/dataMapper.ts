import type { SessionData } from './statisticalDriftEngine';
import type { ReactionTestResult } from '../components/tests/reaction/reactionFeatures';
import type { PatternAssessmentResult } from '../types/patternTypes';
import type { LanguageAssessmentResult } from '../types/languageTypes';
import type { VmraAssessmentResult } from '../types/vmraTypes';
import type { StoryAssessmentResult } from '../types/storyTypes';
import type { ImmersiveNavigationResult } from '../types/navigationTypes';

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

    // Map Reaction/SAVT 
    processResults(data.reaction || [], 'SAVT', (r) => {
        return Math.max(0, 100 - ((r as any).aggregates?.avg || 300) / 20); 
    });

    // Map Pattern
    processResults(data.pattern || [], 'PATTERN', (p) => {
        return Math.min(100, ((p as any).metrics?.maxLevelReached || 1) * 10);
    });

    // Map Memory
    processResults(data.memory || [], 'MEMORY', (m) => {
        return (m.accuracy || 0.5) * 100;
    });

    // Map Language
    processResults(data.language || [], 'LANGUAGE', (l) => {
        return l.derivedFeatures?.fluencyIndex ?? 80;
    });

    // Map VMRA
    processResults(data.vmra || [], 'VMRA', (v) => {
        return (((v.features as any)?.recallAccuracy ?? (v.features as any)?.accuracy ?? 0.8)) * 100;
    });

    // Map Story
    processResults(data.story || [], 'STORY', (s) => {
        return (s.biomarkers?.memory?.recallAccuracy ?? 0.8) * 100;
    });

    // Map Navigation
    processResults(data.navigation || [], 'NAVIGATION', (n) => {
        return (n.biomarkers?.navigationAccuracy ?? 0.8) * 100;
    });

    // Sort by timestamp ascending
    const sessions = Array.from(sessionMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    return sessions;
}
