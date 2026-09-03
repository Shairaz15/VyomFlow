import { useMemo } from 'react';
import {
    useStoryResults,
    useVmraResults,
    useReactionResults,
    usePatternResults,
    useAttentionResults,
    useNavigationResults,
    useLanguageResults,
} from './useTestResults';

export type ActivityId = 'story' | 'memory' | 'reaction' | 'pattern' | 'attention' | 'navigation' | 'language';

export interface JourneyNodeInfo {
    id: ActivityId;
    order: number;
    title: string;
    canonicalTitle: string;
    route: string;
    duration: string;
    iconName: string;
    description: string;
    userPrompt: string;
    biome: {
        name: string;
        bgGradient: string;
        accentColor: string;
        themeClass: string;
        icon: string;
    };
    hasPractice: boolean;
}

export const JOURNEY_NODES: JourneyNodeInfo[] = [
    {
        id: 'story',
        order: 1,
        title: 'Story Grove',
        canonicalTitle: 'Story Narration Recall',
        route: '/test/story',
        duration: '5 min',
        iconName: 'story',
        description: 'Listen to a short narrated story and retell it in your own words to evaluate memory & narrative flow.',
        userPrompt: "Let's begin with a short story.",
        biome: {
            name: 'Forest Grove',
            bgGradient: 'linear-gradient(135deg, #183B56 0%, #2d5a3e 100%)',
            accentColor: '#8BAE9A',
            themeClass: 'biome-grove',
            icon: '📖',
        },
        hasPractice: false,
    },
    {
        id: 'memory',
        order: 2,
        title: 'Memory Garden',
        canonicalTitle: 'Visual Memory (VMRA)',
        route: '/test/vmra',
        duration: '2 min',
        iconName: 'memory',
        description: 'Observe visual grid patterns and recall highlighted locations to measure short-term spatial memory.',
        userPrompt: 'Take a moment to remember what you see.',
        biome: {
            name: 'Botanical Garden',
            bgGradient: 'linear-gradient(135deg, #2d5a3e 0%, #3A9D9B 100%)',
            accentColor: '#3A9D9B',
            themeClass: 'biome-garden',
            icon: '🌿',
        },
        hasPractice: true,
    },
    {
        id: 'reaction',
        order: 3,
        title: 'Firefly Trail',
        canonicalTitle: 'Reaction Time',
        route: '/test/reaction',
        duration: '1 min',
        iconName: 'reaction',
        description: 'Tap quickly as soon as the target light appears to test processing speed and alertness.',
        userPrompt: 'When the light appears, tap it as quickly as you can.',
        biome: {
            name: 'Twilight Dusk',
            bgGradient: 'linear-gradient(135deg, #183B56 0%, #4a3e6d 100%)',
            accentColor: '#fbbf24',
            themeClass: 'biome-trail',
            icon: '✨',
        },
        hasPractice: true,
    },
    {
        id: 'pattern',
        order: 4,
        title: 'Pattern Pond',
        canonicalTitle: 'Pattern Recognition',
        route: '/tests/pattern',
        duration: '2 min',
        iconName: 'pattern',
        description: 'Analyze geometric arrangements and select matching patterns to assess executive function.',
        userPrompt: 'Look carefully and find the matching pattern.',
        biome: {
            name: 'Calm Pond',
            bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #38bdf8 100%)',
            accentColor: '#38bdf8',
            themeClass: 'biome-pond',
            icon: '🌊',
        },
        hasPractice: true,
    },
    {
        id: 'attention',
        order: 5,
        title: 'Focus Meadow',
        canonicalTitle: 'Sustained Attention (SAVT)',
        route: '/test/attention',
        duration: '3 min',
        iconName: 'attention',
        description: 'Maintain focus over time and respond only to target signals while filtering distractions.',
        userPrompt: 'Stay focused and respond when you see the target.',
        biome: {
            name: 'Open Meadow',
            bgGradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            accentColor: '#10b981',
            themeClass: 'biome-meadow',
            icon: '🎯',
        },
        hasPractice: true,
    },
    {
        id: 'navigation',
        order: 6,
        title: 'Discovery Trail',
        canonicalTitle: 'Immersive Navigation',
        route: '/test/navigation',
        duration: '5 min',
        iconName: 'navigation',
        description: 'Watch a real-world route video and navigate back by choosing directional decisions at key turns.',
        userPrompt: 'Explore the path and find your way.',
        biome: {
            name: 'Winding Ridge',
            bgGradient: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
            accentColor: '#06b6d4',
            themeClass: 'biome-discovery',
            icon: '🧭',
        },
        hasPractice: false,
    },
    {
        id: 'language',
        order: 7,
        title: 'Story Corner',
        canonicalTitle: 'Language Assessment',
        route: '/test/language',
        duration: '2 min',
        iconName: 'language',
        description: 'Speak freely on a given prompt to measure speech rate, narrative structure, and acoustic biomarkers.',
        userPrompt: "Let's talk for a moment.",
        biome: {
            name: 'Cozy Reading Corner',
            bgGradient: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',
            accentColor: '#c084fc',
            themeClass: 'biome-corner',
            icon: '🗣️',
        },
        hasPractice: false,
    },
];

export interface JourneyState {
    completedActivityIds: Set<ActivityId>;
    completedCount: number;
    totalCount: number;
    activeNodeId: ActivityId;
    isJourneyComplete: boolean;
    totalSessionsCompleted: number;
    growthLevel: {
        stage: string;
        icon: string;
        label: string;
        nextThreshold: number;
    };
    activityLastCompletedMap: Record<ActivityId, Date | null>;
    isLoading: boolean;
}

export function useJourneyState(): JourneyState {
    const { results: storyResults, isLoading: storyLoading } = useStoryResults();
    const { results: vmraResults, isLoading: vmraLoading } = useVmraResults();
    const { results: reactionResults, isLoading: reactionLoading } = useReactionResults();
    const { results: patternResults, isLoading: patternLoading } = usePatternResults();
    const { results: attentionResults, isLoading: attentionLoading } = useAttentionResults();
    const { results: navigationResults, isLoading: navigationLoading } = useNavigationResults();
    const { results: languageResults, isLoading: languageLoading } = useLanguageResults();

    const isLoading = storyLoading || vmraLoading || reactionLoading || patternLoading || attentionLoading || navigationLoading || languageLoading;

    return useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        const isCompletedToday = (timestamp: Date | string | undefined) => {
            if (!timestamp) return false;
            try {
                const dateObj = timestamp instanceof Date ? timestamp : new Date(timestamp);
                return dateObj.toISOString().split('T')[0] === todayStr;
            } catch {
                return false;
            }
        };

        const activityLastCompletedMap: Record<ActivityId, Date | null> = {
            story: storyResults.length > 0 ? new Date(storyResults[storyResults.length - 1].timestamp) : null,
            memory: vmraResults.length > 0 ? new Date(vmraResults[vmraResults.length - 1].timestamp) : null,
            reaction: reactionResults.length > 0 ? new Date(reactionResults[reactionResults.length - 1].timestamp) : null,
            pattern: patternResults.length > 0 ? new Date(patternResults[patternResults.length - 1].timestamp) : null,
            attention: attentionResults.length > 0 ? new Date(attentionResults[attentionResults.length - 1].timestamp) : null,
            navigation: navigationResults.length > 0 ? new Date(navigationResults[navigationResults.length - 1].timestamp) : null,
            language: languageResults.length > 0 ? new Date(languageResults[languageResults.length - 1].timestamp) : null,
        };

        const completedActivityIds = new Set<ActivityId>();
        if (isCompletedToday(activityLastCompletedMap.story ?? undefined)) completedActivityIds.add('story');
        if (isCompletedToday(activityLastCompletedMap.memory ?? undefined)) completedActivityIds.add('memory');
        if (isCompletedToday(activityLastCompletedMap.reaction ?? undefined)) completedActivityIds.add('reaction');
        if (isCompletedToday(activityLastCompletedMap.pattern ?? undefined)) completedActivityIds.add('pattern');
        if (isCompletedToday(activityLastCompletedMap.attention ?? undefined)) completedActivityIds.add('attention');
        if (isCompletedToday(activityLastCompletedMap.navigation ?? undefined)) completedActivityIds.add('navigation');
        if (isCompletedToday(activityLastCompletedMap.language ?? undefined)) completedActivityIds.add('language');

        const completedCount = completedActivityIds.size;
        const totalCount = JOURNEY_NODES.length;
        const isJourneyComplete = completedCount === totalCount;

        // Determine active node (first uncompleted node in sequence, or first node if all complete)
        let activeNodeId: ActivityId = 'story';
        for (const node of JOURNEY_NODES) {
            if (!completedActivityIds.has(node.id)) {
                activeNodeId = node.id;
                break;
            }
        }

        // Compute total unique check-in days across all test history for participation growth
        const uniqueDates = new Set<string>();
        [
            ...storyResults,
            ...vmraResults,
            ...reactionResults,
            ...patternResults,
            ...attentionResults,
            ...navigationResults,
            ...languageResults,
        ].forEach((item) => {
            if (item.timestamp) {
                try {
                    const d = item.timestamp instanceof Date ? item.timestamp : new Date(item.timestamp);
                    uniqueDates.add(d.toISOString().split('T')[0]);
                } catch {
                    // Ignore date parse errors
                }
            }
        });

        const totalSessionsCompleted = Math.max(uniqueDates.size, completedCount > 0 ? 1 : 0);

        // Determine participation growth stage based on consistency
        let growthLevel = { stage: 'Seed', icon: '🌱', label: 'Your journey is just beginning', nextThreshold: 3 };
        if (totalSessionsCompleted >= 30) {
            growthLevel = { stage: 'Flourishing Garden', icon: '🏡', label: 'Your garden is thriving with consistency', nextThreshold: 30 };
        } else if (totalSessionsCompleted >= 14) {
            growthLevel = { stage: 'Small Tree', icon: '🌳', label: 'Your journey is growing strong', nextThreshold: 30 };
        } else if (totalSessionsCompleted >= 7) {
            growthLevel = { stage: 'Flower', icon: '🌸', label: 'Your journey is blooming', nextThreshold: 14 };
        } else if (totalSessionsCompleted >= 3) {
            growthLevel = { stage: 'Sprout', icon: '🌿', label: 'Your journey is taking root', nextThreshold: 7 };
        }

        return {
            completedActivityIds,
            completedCount,
            totalCount,
            activeNodeId,
            isJourneyComplete,
            totalSessionsCompleted,
            growthLevel,
            activityLastCompletedMap,
            isLoading,
        };
    }, [
        storyResults,
        vmraResults,
        reactionResults,
        patternResults,
        attentionResults,
        navigationResults,
        languageResults,
        isLoading,
    ]);
}
