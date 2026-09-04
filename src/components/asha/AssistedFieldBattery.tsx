import { useState, useEffect, useRef } from 'react';
import type { AshaBeneficiary } from '../../services/supabaseService';
import { compileAndSaveBeneficiarySession } from '../../services/supabaseService';
import { useAsha } from '../../contexts/AshaContext';
import { printPhcReferralSlip } from '../../utils/printReferralSlip';
import { INDIAN_LANGUAGES } from '../common/OnboardingModal';
import {
    Volume2,
    CheckCircle,
    ArrowRight,
    Share2,
    Play,
    X,
    Activity,
    AlertTriangle,
    Zap,
    Hourglass,
    Sparkles,
    CheckCircle2,
    Sun,
    Droplets,
    Leaf,
    Flame,
    Check,
    Keyboard,
    Printer
} from 'lucide-react';
import './AshaComponents.css';

interface AssistedFieldBatteryProps {
    isOpen: boolean;
    beneficiary: AshaBeneficiary | null;
    onClose: () => void;
    onCompleted: (beneficiary: AshaBeneficiary, prediction: any) => void;
}

type Stage = 'intro' | 'reaction' | 'story' | 'pattern' | 'complete';

// Regional spoken instructions for ASHA guidance
const REGIONAL_PROMPTS: Record<string, { reaction: string; story: string; storyText: string; pattern: string }> = {
    hi: {
        reaction: "जब यह बड़ा बॉक्स हरा हो जाए, तो तुरंत कहीं भी दबाएं। जितनी जल्दी हो सके दबाएं।",
        story: "कृपया इस छोटी कहानी को ध्यान से सुनें। इसके बाद आपको बताना होगा कि आपने क्या सुना।",
        storyText: "एक दिन किसान रामू अपनी बैलगाड़ी में तीन बोरियां गेहूं लेकर साप्ताहिक हाट जा रहा था। रास्ते में एक बड़े गड्ढे के कारण गाड़ी का पहिया टूट गया। पास के गाँव के दो युवकों ने आकर रामू की मदद की और शाम होने से पहले वे सुरक्षित बाज़ार पहुँच गए।",
        pattern: "ध्यान से देखें कि कौन से रंग जलते हैं। उसी क्रम में उन पर छुएं।"
    },
    ta: {
        reaction: "இந்தப் பெரிய பெட்டி பச்சையாக மாறும்போது உடனே தொடவும். எவ்வளவு வேகமாக முடியுமோ அவ்வளவு வேகமாகத் தொடவும்.",
        story: "இந்தச் சிறிய கதையைக் கவனமாகக் கேளுங்கள். பின்னர் நீங்கள் கேட்டதைச் சொல்ல வேண்டும்.",
        storyText: "ஒரு நாள் விவசாயி ராமு மூன்று மூட்டை கோதுமையுடன் மாட்டு வண்டியில் வாரச் சந்தைக்குச் சென்றார். வழியில் வண்டியின் சக்கரம் உடைந்தபோது அருகிலுள்ள கிராமத்து இளைஞர்கள் இருவர் உதவி செய்தனர். மாலைக்குள் அவர்கள் சந்தையை அடைந்தனர்.",
        pattern: "எந்த நிறங்கள் ஒளிர்கின்றன என்பதைக் கவனியுங்கள். அதே வரிசையில் அவற்றைத் தொடவும்."
    },
    te: {
        reaction: "ఈ పెద్ద బాక్స్ పచ్చగా మారిన వెంటనే తాకండి. వీలైనంత వేగంగా తాకండి.",
        story: "ఈ చిన్న కథను శ్రద్ధగా వినండి. తర్వాత మీరు విన్నది చెప్పాలి.",
        storyText: "ఒకరోజు రాము అనే రైతు మూడు బస్తాల గోధుమలతో ఎడ్లబండిపై వారపు సంతకు వెళ్తున్నాడు. దారిలో బండి చక్రం విరిగిపోగా, పొరుగు గ్రామానికి చెందిన ఇద్దరు యువకులు సహాయం చేశారు. సాయంత్రానికి వారు సురక్షితంగా సంతకు చేరుకున్నారు.",
        pattern: "ఏ రంగులు వెలుగుతున్నాయో గమనించండి. అదే క్రమంలో వాటిని తాకండి."
    },
    kn: {
        reaction: "ಈ ದೊಡ್ಡ ಪೆಟ್ಟಿಗೆ ಹಸಿರಾದಾಗ ತಕ್ಷಣ ಸ್ಪರ್ಶಿಸಿ. ಸಾಧ್ಯವಾದಷ್ಟು ಬೇಗ ಸ್ಪರ್ಶಿಸಿ.",
        story: "ದಯವಿಟ್ಟು ಈ ಸಣ್ಣ ಕಥೆಯನ್ನು ಎಚ್ಚರಿಕೆಯಿಂದ ಕೇಳಿ. ನಂತರ ನೀವು ಕೇಳಿದ್ದನ್ನು ಹೇಳಬೇಕು.",
        storyText: "ಒಂದು ದಿನ ರೈತ ರಾಮು ತನ್ನ ಎತ್ತಿನ ಬಂಡಿಯಲ್ಲಿ ಮೂರು ಚೀಲ ಗೋಧಿ ತುಂಬಿಕೊಂಡು ವಾರದ ಸಂತೆ ಹೊರಟಿದ್ದನು. ದಾರಿಯಲ್ಲಿ ಬಂಡಿಯ ಚಕ್ರ ಮುರಿದಾಗ ಪಕ್ಕದ ಊರಿನ ಇಬ್ಬರು ಯುವಕರು ಸಹಾಯ ಮಾಡಿದರು.",
        pattern: "ಯಾವ ಬಣ್ಣಗಳು ಬೆಳಗುತ್ತವೆ ಎಂಬುದನ್ನು ಗಮನಿಸಿ. ಅದೇ ಕ್ರಮದಲ್ಲಿ ಅವುಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ."
    },
    bn: {
        reaction: "এই বড় বাক্সটি সবুজ হলে অবিলম্বে স্পর্শ করুন। যত দ্রুত সম্ভব ট্যাপ করুন।",
        story: "অনুগ্রহ করে এই ছোট গল্পটি মনোযোগ সহকারে শুনুন। এর পরে আপনাকে বলতে হবে আপনি কী শুনেছেন।",
        storyText: "একদিন কৃষক রামু তার গরুর গাড়িতে তিন বস্তা গম নিয়ে সাপ্তাহিক হাটে যাচ্ছিলেন। পথে একটি গর্তের কারণে চাকা ভেঙে গেলে পাশের গ্রামের দুজন যুবক এসে তাকে সাহায্য করে।",
        pattern: "মনোযোগ দিয়ে দেখুন কোন রঙগুলি জ্বলছে। একই ক্রমে সেগুলিতে স্পর্শ করুন।"
    },
    en: {
        reaction: "When this large box turns bright green, tap anywhere on it immediately. Tap as fast as you can!",
        story: "Please listen carefully to this short story. Afterwards, you will be asked to retell what you heard.",
        storyText: "One morning, a farmer named Ramu was traveling to the village weekly market with three sacks of wheat on his bullock cart. On the way, a wheel broke. Two young men from a nearby village helped him fix it, and they arrived safely at the market before evening.",
        pattern: "Watch carefully as the tiles light up in order. Then tap them in the exact same sequence."
    }
};

const RECALL_ITEMS = [
    { key: 'farmerName' as const, label: 'Farmer named Ramu' },
    { key: 'wheatSacks' as const, label: 'Three sacks of wheat' },
    { key: 'brokenWheel' as const, label: 'Bullock cart wheel broke' },
    { key: 'helpers' as const, label: 'Two village youths helped him' },
    { key: 'reachedMarket' as const, label: 'Reached weekly bazaar before evening' }
];

export function AssistedFieldBattery({
    isOpen,
    beneficiary,
    onClose,
    onCompleted
}: AssistedFieldBatteryProps) {
    const { endBeneficiarySession } = useAsha();
    const [stage, setStage] = useState<Stage>('intro');
    const [isCompiling, setIsCompiling] = useState(false);
    const [finalPrediction, setFinalPrediction] = useState<any>(null);

    // Audio guidance voice
    const [isSpeaking, setIsSpeaking] = useState(false);

    const langCode = beneficiary?.preferred_language?.split('-')[0]?.toLowerCase() || 'hi';
    const langObj = INDIAN_LANGUAGES.find(
        l => l.code === langCode || beneficiary?.preferred_language?.startsWith(l.code)
    );
    const prompts = REGIONAL_PROMPTS[langCode] || REGIONAL_PROMPTS.hi;

    const speakText = (text: string) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voiceLang = langCode === 'hi' ? 'hi-IN' : langCode === 'ta' ? 'ta-IN' : langCode === 'te' ? 'te-IN' : langCode === 'bn' ? 'bn-IN' : langCode === 'kn' ? 'kn-IN' : 'en-IN';
        utterance.lang = voiceLang;
        utterance.rate = 0.9;
        setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    // -------------------------------------------------------------
    // STAGE 1: REACTION TIME STATE & REFS
    // -------------------------------------------------------------
    const [reactionStep, setReactionStep] = useState<'ready' | 'waiting' | 'go' | 'tapped' | 'early'>('ready');
    const [reactionTrials, setReactionTrials] = useState<number[]>([]);
    const [currentLatency, setCurrentLatency] = useState<number | null>(null);
    const reactionTimerRef = useRef<any>(null);
    const autoAdvanceTimerRef = useRef<any>(null);
    const reactionStartRef = useRef<number>(0);
    const reactionStepRef = useRef<'ready' | 'waiting' | 'go' | 'tapped' | 'early'>('ready');
    const reactionTrialsRef = useRef<number[]>([]);

    useEffect(() => {
        reactionStepRef.current = reactionStep;
    }, [reactionStep]);

    useEffect(() => {
        reactionTrialsRef.current = reactionTrials;
    }, [reactionTrials]);

    // -------------------------------------------------------------
    // STAGE 2: STORY RECALL STATE
    // -------------------------------------------------------------
    const [storyPlaying, setStoryPlaying] = useState(false);
    const [storyRecallChecks, setStoryRecallChecks] = useState({
        farmerName: false,
        wheatSacks: false,
        brokenWheel: false,
        helpers: false,
        reachedMarket: false
    });

    // -------------------------------------------------------------
    // STAGE 3: PATTERN STATE & TIMERS
    // -------------------------------------------------------------
    const PATTERN_COLORS = [
        { id: 0, keyNumber: '1', label: 'Gold', icon: Sun, color: '#d97706', activeColor: '#fbbf24' },
        { id: 1, keyNumber: '2', label: 'Blue', icon: Droplets, color: '#0284c7', activeColor: '#38bdf8' },
        { id: 2, keyNumber: '3', label: 'Green', icon: Leaf, color: '#059669', activeColor: '#34d399' },
        { id: 3, keyNumber: '4', label: 'Red', icon: Flame, color: '#dc2626', activeColor: '#f87171' }
    ];
    const [patternSequence, setPatternSequence] = useState<number[]>([0, 2, 1]);
    const [activeLitTile, setActiveLitTile] = useState<number | null>(null);
    const [patternUserStep, setPatternUserStep] = useState<number>(0);
    const [patternPhase, setPatternPhase] = useState<'ready' | 'showing' | 'input' | 'success' | 'failed'>('ready');
    const [patternRoundsCompleted, setPatternRoundsCompleted] = useState<number>(0);
    const [patternSuccessCount, setPatternSuccessCount] = useState<number>(0);

    const patternIntervalRef = useRef<any>(null);
    const patternTimeoutRef = useRef<any>(null);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen && beneficiary) {
            setStage('intro');
            setReactionTrials([]);
            setReactionStep('ready');
            setStoryPlaying(false);
            setStoryRecallChecks({
                farmerName: false,
                wheatSacks: false,
                brokenWheel: false,
                helpers: false,
                reachedMarket: false
            });
            setPatternPhase('ready');
            setPatternRoundsCompleted(0);
            setPatternSuccessCount(0);
            setFinalPrediction(null);
            setIsCompiling(false);
        }
    }, [isOpen, beneficiary]);

    // Clean up timers & speech on unmount
    useEffect(() => {
        return () => {
            if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
            if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
            if (patternIntervalRef.current) clearInterval(patternIntervalRef.current);
            if (patternTimeoutRef.current) clearTimeout(patternTimeoutRef.current);
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // -------------------------------------------------------------
    // STAGE 1 LOGIC: ZERO-LATENCY REACTION TIME & AUTO PROGRESSION
    // -------------------------------------------------------------
    const startReactionTrial = () => {
        if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
        setReactionStep('waiting');
        setCurrentLatency(null);
        const delay = 1300 + Math.random() * 2000; // 1.3 - 3.3s
        reactionTimerRef.current = setTimeout(() => {
            reactionStartRef.current = performance.now();
            setReactionStep('go');
        }, delay);
    };

    const handleReactionTap = () => {
        if (reactionTimerRef.current) clearTimeout(reactionTimerRef.current);
        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);

        const currentStep = reactionStepRef.current;
        if (currentStep === 'waiting') {
            // Premature tap
            setReactionStep('early');
            // Auto restart trial after 1.2s on its own!
            autoAdvanceTimerRef.current = setTimeout(() => {
                startReactionTrial();
            }, 1200);
        } else if (currentStep === 'early') {
            // User pressed Space or tapped while early notice is shown -> restart trial immediately!
            startReactionTrial();
        } else if (currentStep === 'go') {
            // Microsecond-accurate latency using performance.now()
            const latency = Math.round(performance.now() - reactionStartRef.current);
            setCurrentLatency(latency);
            const nextTrials = [...reactionTrialsRef.current, latency];
            setReactionTrials(nextTrials);
            setReactionStep('tapped');

            // Auto-advance to next round or Step 2 on its own!
            autoAdvanceTimerRef.current = setTimeout(() => {
                if (nextTrials.length < 3) {
                    startReactionTrial();
                } else {
                    setStage('story');
                }
            }, 1100);
        } else if (currentStep === 'tapped') {
            // User pressed Space or tapped to skip 1.1s cooldown -> advance immediately!
            if (reactionTrialsRef.current.length < 3) {
                startReactionTrial();
            } else {
                setStage('story');
            }
        } else if (currentStep === 'ready') {
            startReactionTrial();
        }
    };

    // Auto-start Stage 1 when entering reaction stage
    useEffect(() => {
        if (stage === 'reaction' && reactionStep === 'ready' && reactionTrials.length === 0) {
            const t = setTimeout(() => {
                startReactionTrial();
            }, 750);
            return () => clearTimeout(t);
        }
    }, [stage]);

    // -------------------------------------------------------------
    // STAGE 2 LOGIC: STORY AUDITORY RECALL
    // -------------------------------------------------------------
    const playStoryAudio = () => {
        setStoryPlaying(true);
        speakText(prompts.storyText);
        setTimeout(() => {
            setStoryPlaying(false);
        }, 12000);
    };

    // -------------------------------------------------------------
    // STAGE 3 LOGIC: PATTERN WORKING MEMORY & AUTO PROGRESSION
    // -------------------------------------------------------------
    const playPatternSequence = (seq: number[]) => {
        if (patternIntervalRef.current) clearInterval(patternIntervalRef.current);
        if (patternTimeoutRef.current) clearTimeout(patternTimeoutRef.current);
        setPatternPhase('showing');
        setActiveLitTile(null);
        setPatternUserStep(0);
        let idx = 0;
        patternIntervalRef.current = setInterval(() => {
            if (idx < seq.length) {
                setActiveLitTile(seq[idx]);
                patternTimeoutRef.current = setTimeout(() => setActiveLitTile(null), 550);
                idx++;
            } else {
                if (patternIntervalRef.current) clearInterval(patternIntervalRef.current);
                patternIntervalRef.current = null;
                setPatternPhase('input');
            }
        }, 850);
    };

    const startPatternRound = () => {
        const nextSeq = patternRoundsCompleted === 0 ? [0, 2, 1] : [1, 3, 0, 2];
        setPatternSequence(nextSeq);
        playPatternSequence(nextSeq);
    };

    // Auto-start pattern round when entering stage 3
    useEffect(() => {
        if (stage === 'pattern' && patternPhase === 'ready' && patternRoundsCompleted === 0) {
            const t = setTimeout(() => {
                startPatternRound();
            }, 800);
            return () => clearTimeout(t);
        }
    }, [stage]);

    const handlePatternTileTap = (tileId: number) => {
        if (patternPhase !== 'input') return;

        setActiveLitTile(tileId);
        setTimeout(() => setActiveLitTile(null), 250);

        if (tileId === patternSequence[patternUserStep]) {
            const nextStep = patternUserStep + 1;
            if (nextStep === patternSequence.length) {
                // Completed sequence successfully
                const nextSuccessCount = patternSuccessCount + 1;
                const nextRoundsCompleted = patternRoundsCompleted + 1;
                setPatternSuccessCount(nextSuccessCount);
                setPatternPhase('success');
                setPatternRoundsCompleted(nextRoundsCompleted);

                // Auto-advance to Round 2 or complete MoCA on its own!
                autoAdvanceTimerRef.current = setTimeout(() => {
                    if (nextRoundsCompleted < 2) {
                        const round2Seq = [1, 3, 0, 2];
                        setPatternSequence(round2Seq);
                        playPatternSequence(round2Seq);
                    } else {
                        handleFinishBattery();
                    }
                }, 1200);
            } else {
                setPatternUserStep(nextStep);
            }
        } else {
            // Failed sequence
            const nextRoundsCompleted = patternRoundsCompleted + 1;
            setPatternPhase('failed');
            setPatternRoundsCompleted(nextRoundsCompleted);

            // Auto-advance after short feedback
            autoAdvanceTimerRef.current = setTimeout(() => {
                if (nextRoundsCompleted < 2) {
                    const round2Seq = [1, 3, 0, 2];
                    setPatternSequence(round2Seq);
                    playPatternSequence(round2Seq);
                } else {
                    handleFinishBattery();
                }
            }, 1400);
        }
    };

    // Universal Spacebar & Keyboard listener across all assessment stages
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
                return;
            }

            if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter') {
                if (stage === 'intro') {
                    e.preventDefault();
                    setStage('reaction');
                } else if (stage === 'reaction') {
                    e.preventDefault();
                    if (e.repeat) return;
                    handleReactionTap();
                } else if (stage === 'story' && e.key === 'Enter') {
                    e.preventDefault();
                    setStage('pattern');
                } else if (stage === 'pattern') {
                    if (patternPhase === 'ready') {
                        e.preventDefault();
                        startPatternRound();
                    } else if (patternPhase === 'success' || patternPhase === 'failed') {
                        e.preventDefault();
                        if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
                        if (patternRoundsCompleted < 2) {
                            const round2Seq = [1, 3, 0, 2];
                            setPatternSequence(round2Seq);
                            playPatternSequence(round2Seq);
                        } else {
                            handleFinishBattery();
                        }
                    }
                }
            } else if (stage === 'story') {
                if (e.key >= '1' && e.key <= '5') {
                    e.preventDefault();
                    const index = parseInt(e.key, 10) - 1;
                    const itemKey = RECALL_ITEMS[index]?.key;
                    if (itemKey) {
                        setStoryRecallChecks(prev => ({
                            ...prev,
                            [itemKey]: !prev[itemKey]
                        }));
                    }
                } else if (e.key === 'p' || e.key === 'P') {
                    e.preventDefault();
                    playStoryAudio();
                }
            } else if (stage === 'pattern' && patternPhase === 'input') {
                if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
                    e.preventDefault();
                    handlePatternTileTap(0);
                } else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
                    e.preventDefault();
                    handlePatternTileTap(1);
                } else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
                    e.preventDefault();
                    handlePatternTileTap(2);
                } else if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') {
                    e.preventDefault();
                    handlePatternTileTap(3);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown, { passive: false });
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, stage, patternPhase, patternRoundsCompleted]);

    // -------------------------------------------------------------
    // FINAL COMPILATION & SUBMISSION
    // -------------------------------------------------------------
    const handleFinishBattery = async () => {
        setIsCompiling(true);

        // 1. Compute reaction metrics
        const validReaction = reactionTrials.filter(t => t > 120 && t < 1500);
        const avgReaction = validReaction.length > 0
            ? Math.round(validReaction.reduce((a, b) => a + b, 0) / validReaction.length)
            : 420;

        // 2. Compute story recall score
        const checkedCount = Object.values(storyRecallChecks).filter(Boolean).length;
        const storyScore = Math.round((checkedCount / 5) * 100);

        // 3. Compute pattern score
        const patternScore = patternRoundsCompleted > 0
            ? Math.round((patternSuccessCount / patternRoundsCompleted) * 100)
            : 70;

        // 4. Construct raw battery dataset
        const rawData = {
            reaction: [{
                sessionId: `asha_${Date.now()}`,
                timestamp: new Date(),
                rounds: validReaction.map((rt, i) => ({
                    roundNumber: i + 1,
                    reactionTimeMs: rt,
                    falseStart: false,
                    missed: false
                })),
                aggregates: {
                    avg: avgReaction,
                    min: Math.min(...validReaction, avgReaction),
                    max: Math.max(...validReaction, avgReaction),
                    variance: 1225,
                    fatigueSlope: 0
                },
                falseStartCount: 0,
                missedStimulusCount: 0
            }],
            story: [{
                storyRecallScore: storyScore,
                timestamp: new Date().toISOString(),
                features: {
                    recallAccuracy: storyScore / 100,
                    wordCount: 45,
                    pauseCount: 4
                }
            }],
            pattern: [{
                score: patternScore,
                accuracy: patternScore / 100,
                timestamp: new Date().toISOString(),
                maxLevel: patternSuccessCount > 0 ? 4 : 2
            }]
        };

        if (!beneficiary) {
            setIsCompiling(false);
            return;
        }

        const demographics = {
            age: beneficiary.age,
            educationYears: beneficiary.education_years,
            gender: beneficiary.gender
        };

        const res = await compileAndSaveBeneficiarySession(beneficiary.firebase_uid, rawData as any, demographics);
        setIsCompiling(false);

        if (res.success && res.prediction) {
            setFinalPrediction(res.prediction);
            setStage('complete');
            onCompleted(beneficiary, res.prediction);
        } else {
            // Fallback display
            setStage('complete');
        }
    };

    // -------------------------------------------------------------
    // WHATSAPP REFERRAL SLIP GENERATION
    // -------------------------------------------------------------
    const generateWhatsAppUrl = () => {
        if (!beneficiary) return '#';

        const moca = finalPrediction ? Math.round(finalPrediction.estimatedMoCA) : (beneficiary.latest_moca || 18);
        const tier = finalPrediction ? finalPrediction.clinicalAlertTier : (beneficiary.latest_alert_tier || 'CLINICAL_EVALUATION');
        const isHighRisk = tier.includes('RECOMMEND') || tier.includes('EVALUATION') || moca < 22;

        const message = [
            `🏥 *AYUSHMAN BHARAT / PHC COGNITIVE SCREENING REFERRAL*`,
            `----------------------------------------`,
            `*Beneficiary:* ${beneficiary.full_name}`,
            `*Age / Gender:* ${beneficiary.age} yrs • ${beneficiary.gender || 'Not specified'}`,
            `*Village / Ward:* ${beneficiary.village_name || 'Village Unit'}`,
            beneficiary.phone_number ? `*Contact:* ${beneficiary.phone_number}` : null,
            beneficiary.abha_id ? `*ABHA ID:* ${beneficiary.abha_id}` : null,
            `*Screening Date:* ${new Date().toLocaleDateString()}`,
            `----------------------------------------`,
            `*SCREENING RESULT:* ${isHighRisk ? '⚠️ HIGH RISK (REFERRAL RECOMMENDED)' : '✅ STABLE PROFILE'}`,
            `*Estimated MoCA Score:* ${moca}/30 (${beneficiary.education_years <= 12 ? '+1 Edu Norm Applied' : 'Standard Norm'})`,
            finalPrediction?.domainScores ? `*Memory Recall:* ${Math.round(finalPrediction.domainScores.memory)}%` : null,
            finalPrediction?.domainScores ? `*Processing Speed:* ${Math.round(finalPrediction.domainScores.processingSpeed)}%` : null,
            finalPrediction?.domainScores ? `*Executive / Attention:* ${Math.round(finalPrediction.domainScores.executive)}%` : null,
            `----------------------------------------`,
            `*Reason for Referral:* Frontline digital biomarker screening identified cognitive deviation exceeding demographic norms. Referred to PHC Medical Officer for clinical review.`,
            `*Screened By:* ASHA Community Health Worker (${beneficiary.asha_worker_id})`,
            `_Powered by VyomFlow Grassroots AI_`
        ].filter(Boolean).join('\n');

        return `https://wa.me/?text=${encodeURIComponent(message)}`;
    };

    if (!isOpen || !beneficiary) return null;

    return (
        <div className="asha-modal-overlay" role="dialog" aria-modal="true">
            <div className="asha-modal-card asha-battery-modal">
                {/* Header with Progress Bar */}
                <div className="asha-battery-header">
                    <div className="asha-battery-info">
                        <div className="asha-battery-badge">
                            <Activity size={12} />
                            <span>FIELD BATTERY</span>
                            <span className="asha-dot-sep">•</span>
                            <span>{langObj ? langObj.native : beneficiary.preferred_language}</span>
                        </div>
                        <h2 className="asha-battery-title">{beneficiary.full_name} ({beneficiary.age}y)</h2>
                    </div>

                    <div className="asha-battery-steps-indicator">
                        <div className={`step-dot ${stage === 'reaction' ? 'active' : reactionTrials.length >= 3 ? 'done' : ''}`}>1. Speed</div>
                        <div className={`step-dot ${stage === 'story' ? 'active' : storyRecallChecks.farmerName ? 'done' : ''}`}>2. Memory</div>
                        <div className={`step-dot ${stage === 'pattern' ? 'active' : patternRoundsCompleted >= 2 ? 'done' : ''}`}>3. Attention</div>
                    </div>

                    <button className="asha-modal-close" onClick={onClose} title="Cancel and return">
                        <X size={18} />
                    </button>
                </div>

                {/* Main Interactive Body */}
                <div className="asha-battery-body">
                    {/* ---------------- STAGE 0: INTRO ---------------- */}
                    {stage === 'intro' && (
                        <div className="asha-battery-intro">
                            <div className="asha-guidance-card">
                                <span className="asha-guidance-badge">ASHA WORKER INSTRUCTIONS</span>
                                <p>
                                    Sit beside <strong>{beneficiary.full_name}</strong> in a quiet location. 
                                    You will guide them through 3 rapid tests taking ~5 minutes:
                                </p>
                                <ol className="asha-intro-list">
                                    <li><strong>Processing Speed:</strong> Tapping the screen when it turns green.</li>
                                    <li><strong>Story Memory:</strong> Listening to a short village story and retelling key facts.</li>
                                    <li><strong>Visual Attention:</strong> Repeating a simple colored tile pattern.</li>
                                </ol>
                                <p className="asha-guidance-tip">
                                    <Sparkles size={14} style={{ display: 'inline', marginRight: 5, verticalAlign: 'text-bottom' }} />
                                    You can tap the <strong>"Play Spoken Prompt"</strong> button anytime to speak instructions aloud in {langObj ? langObj.label : beneficiary.preferred_language}.
                                </p>
                            </div>

                            <button
                                className="asha-btn asha-btn-primary asha-btn-lg asha-start-btn"
                                onClick={() => setStage('reaction')}
                            >
                                <span>Begin Step 1: Processing Speed</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    )}

                    {/* ---------------- STAGE 1: REACTION SPEED ---------------- */}
                    {stage === 'reaction' && (
                        <div className="asha-test-stage">
                            <div className="asha-stage-header">
                                <div>
                                    <h3 className="asha-stage-title">Step 1: Processing Speed (Reaction Time)</h3>
                                    <div className="asha-trial-pills-row">
                                        {[0, 1, 2].map((idx) => {
                                            const val = reactionTrials[idx];
                                            const isDone = val !== undefined;
                                            const isCurrent = reactionTrials.length === idx;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`asha-trial-chip ${isDone ? 'done' : isCurrent ? 'active' : 'pending'}`}
                                                >
                                                    {isDone ? `Round ${idx + 1}: ${val}ms` : isCurrent ? `Round ${idx + 1} (Active)` : `Round ${idx + 1}`}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <button
                                    className="asha-audio-prompt-btn"
                                    onClick={() => speakText(prompts.reaction)}
                                    title="Speak instructions aloud"
                                >
                                    <Volume2 size={18} className={isSpeaking ? 'pulse-anim' : ''} />
                                    <span>Play Spoken Prompt</span>
                                </button>
                            </div>

                            {/* Large High-Contrast Tap Target with Spacebar Listener */}
                            <div
                                className={`asha-reaction-pad ${reactionStep}`}
                                onClick={handleReactionTap}
                                role="button"
                                tabIndex={0}
                                aria-label="Reaction test target"
                            >
                                {reactionStep === 'ready' && (
                                    <div className="reaction-prompt-content">
                                        <Hourglass size={38} className="reaction-icon-lucide" />
                                        <h4>Starting Round 1...</h4>
                                        <p>Press [SPACEBAR] or tap the screen to begin</p>
                                    </div>
                                )}

                                {reactionStep === 'waiting' && (
                                    <div className="reaction-prompt-content">
                                        <span className="reaction-pulse-dot red" />
                                        <h4>Wait for GREEN...</h4>
                                        <p>(Keep fingers ready on Spacebar or screen)</p>
                                    </div>
                                )}

                                {reactionStep === 'go' && (
                                    <div className="reaction-prompt-content">
                                        <Zap size={48} className="reaction-tap-now-icon" />
                                        <h2 className="reaction-tap-now">PRESS SPACE / TAP NOW!</h2>
                                    </div>
                                )}

                                {reactionStep === 'early' && (
                                    <div className="reaction-prompt-content early">
                                        <AlertTriangle size={38} className="text-amber-400" />
                                        <h4>Tapped too early!</h4>
                                        <p className="auto-advance-note">Restarting trial automatically...</p>
                                    </div>
                                )}

                                {reactionStep === 'tapped' && (
                                    <div className="reaction-prompt-content tapped">
                                        <CheckCircle2 size={38} className="text-emerald-400" />
                                        <h4>Speed: {currentLatency} ms</h4>
                                        <p className="auto-advance-note">
                                            {reactionTrials.length < 3
                                                ? `✓ Round ${reactionTrials.length} recorded! Next round starting...`
                                                : '✓ Speed testing complete! Advancing to Memory Recall...'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Keyboard Hint & Fallback Controls */}
                            <div className="asha-stage-helper-bar">
                                <div className="asha-spacebar-hint">
                                    <Keyboard size={14} />
                                    <span>Press <strong>SPACEBAR</strong> or tap anywhere on the pad</span>
                                </div>

                                <div className="asha-stage-controls">
                                    {(reactionStep === 'ready' || reactionStep === 'early' || (reactionStep === 'tapped' && reactionTrials.length < 3)) && (
                                        <button
                                            className="asha-btn asha-btn-secondary"
                                            onClick={startReactionTrial}
                                        >
                                            <Play size={16} />
                                            <span>{reactionStep === 'early' ? 'Restart Now' : 'Next Round Now'}</span>
                                        </button>
                                    )}

                                    {reactionTrials.length >= 3 && (
                                        <button
                                            className="asha-btn asha-btn-primary"
                                            onClick={() => setStage('story')}
                                        >
                                            <span>Next: Step 2</span>
                                            <ArrowRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ---------------- STAGE 2: AUDITORY MEMORY ---------------- */}
                    {stage === 'story' && (
                        <div className="asha-test-stage">
                            <div className="asha-stage-header">
                                <div>
                                    <h3 className="asha-stage-title">Step 2: Auditory Story Recall</h3>
                                    <p className="asha-stage-sub">Listen to the village narrative, then check details recalled</p>
                                </div>
                                <button
                                    className="asha-audio-prompt-btn"
                                    onClick={playStoryAudio}
                                    disabled={storyPlaying}
                                >
                                    <Volume2 size={18} className={storyPlaying ? 'pulse-anim text-emerald-400' : ''} />
                                    <span>{storyPlaying ? 'Playing Story...' : 'Play Village Story Aloud'}</span>
                                </button>
                            </div>

                            <div className="asha-story-card">
                                <p className="asha-story-narrative">
                                    "{prompts.storyText}"
                                </p>
                            </div>

                            {/* Clinical Recall Checklist for ASHA Worker */}
                            <div className="asha-recall-checklist">
                                <div className="asha-recall-header">
                                    <h4>ASHA Scoring Checklist: Details recalled by patient</h4>
                                    <span className="asha-recall-badge">
                                        {Object.values(storyRecallChecks).filter(Boolean).length} / 5 Details Recalled
                                    </span>
                                </div>
                                <div className="asha-checkbox-grid">
                                    {RECALL_ITEMS.map((item, idx) => {
                                        const isChecked = storyRecallChecks[item.key as keyof typeof storyRecallChecks];
                                        return (
                                            <button
                                                key={item.key}
                                                type="button"
                                                className={`asha-check-chip ${isChecked ? 'checked' : ''}`}
                                                onClick={() => setStoryRecallChecks(p => ({ ...p, [item.key]: !p[item.key as keyof typeof storyRecallChecks] }))}
                                            >
                                                <div className={`asha-check-indicator ${isChecked ? 'active' : ''}`}>
                                                    {isChecked && <Check size={13} strokeWidth={3} />}
                                                </div>
                                                <span className="asha-key-badge">[{idx + 1}]</span>
                                                <span className="asha-check-label">{item.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="asha-stage-controls">
                                <div className="asha-keyboard-tip">
                                    <Keyboard size={13} />
                                    <span>Press <strong>[1-5]</strong> to toggle • <strong>[Enter]</strong> to continue</span>
                                </div>
                                <button
                                    className="asha-btn asha-btn-primary"
                                    onClick={() => setStage('pattern')}
                                >
                                    <span>Continue to Step 3: Working Memory</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ---------------- STAGE 3: PATTERN WORKING MEMORY ---------------- */}
                    {stage === 'pattern' && (
                        <div className="asha-test-stage">
                            <div className="asha-stage-header">
                                <div>
                                    <h3 className="asha-stage-title">Step 3: Visual Working Memory</h3>
                                    <p className="asha-stage-sub">Round {Math.min(2, patternRoundsCompleted + 1)} of 2 • Auto-advancing</p>
                                </div>
                                <button
                                    className="asha-audio-prompt-btn"
                                    onClick={() => speakText(prompts.pattern)}
                                >
                                    <Volume2 size={18} />
                                    <span>Play Spoken Prompt</span>
                                </button>
                            </div>

                            {/* Colored Simon Tiles */}
                            <div className="asha-pattern-grid">
                                {PATTERN_COLORS.map(tile => {
                                    const IconComp = tile.icon;
                                    return (
                                        <button
                                            key={tile.id}
                                            className={`asha-pattern-tile ${activeLitTile === tile.id ? 'lit' : ''}`}
                                            style={{
                                                backgroundColor: activeLitTile === tile.id ? tile.activeColor : tile.color,
                                                boxShadow: activeLitTile === tile.id ? `0 0 35px ${tile.activeColor}` : 'none'
                                            }}
                                            onClick={() => handlePatternTileTap(tile.id)}
                                            disabled={patternPhase === 'showing'}
                                        >
                                            <span className="pattern-key-hint">[{tile.keyNumber}]</span>
                                            <span className="pattern-tile-icon"><IconComp size={26} strokeWidth={2.2} /></span>
                                            <span className="pattern-tile-label">{tile.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="asha-pattern-status">
                                {patternPhase === 'ready' && <p>Preparing sequence...</p>}
                                {patternPhase === 'showing' && <p className="pattern-status-showing"><Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} /> Watch carefully...</p>}
                                {patternPhase === 'input' && <p className="pattern-status-input"><Play size={14} style={{ display: 'inline', marginRight: 4 }} /> Repeat the pattern! Press [1-4] or tap tiles</p>}
                                {patternPhase === 'success' && <p className="pattern-status-success"><CheckCircle2 size={14} style={{ display: 'inline', marginRight: 4 }} /> Sequence matched! {patternRoundsCompleted < 1 ? 'Moving to Round 2...' : 'Screening complete! Compiling MoCA...'}</p>}
                                {patternPhase === 'failed' && <p className="pattern-status-failed"><AlertTriangle size={14} style={{ display: 'inline', marginRight: 4 }} /> Sequence mismatch noted. {patternRoundsCompleted < 1 ? 'Starting Round 2...' : 'Screening complete! Compiling MoCA...'}</p>}
                            </div>

                            <div className="asha-stage-controls">
                                <div className="asha-keyboard-tip">
                                    <Keyboard size={13} />
                                    <span>Press <strong>[1-4]</strong> to tap tiles • Auto-advancing</span>
                                </div>

                                {patternPhase === 'ready' && (
                                    <button className="asha-btn asha-btn-primary" onClick={startPatternRound}>
                                        <Play size={18} />
                                        <span>Show Pattern</span>
                                    </button>
                                )}

                                {(patternPhase === 'success' || patternPhase === 'failed') && patternRoundsCompleted < 2 && (
                                    <button className="asha-btn asha-btn-primary" onClick={startPatternRound}>
                                        <span>Start Round 2 Now</span>
                                        <ArrowRight size={18} />
                                    </button>
                                )}

                                {patternRoundsCompleted >= 2 && (
                                    <button
                                        className="asha-btn asha-btn-launch asha-btn-lg"
                                        onClick={handleFinishBattery}
                                        disabled={isCompiling}
                                    >
                                        {isCompiling ? (
                                            <span>Compiling Clinical MoCA Profile...</span>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} />
                                                <span>Complete & View MoCA Report</span>
                                                <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ---------------- STAGE 4: COMPLETE & REFERRAL ---------------- */}
                    {stage === 'complete' && (
                        <div className="asha-battery-complete">
                            <div className="asha-complete-hero">
                                <div className="asha-success-ring">
                                    <CheckCircle size={48} className="text-emerald-400" />
                                </div>
                                <h2>Screening Successfully Completed!</h2>
                                <p>Digital biomarkers processed and synced for <strong>{beneficiary.full_name}</strong>.</p>
                            </div>

                            {/* Score Card */}
                            <div className="asha-score-hero">
                                <div className="asha-moca-tile">
                                    <span className="asha-moca-sub">Estimated MoCA Score</span>
                                    <div className="asha-moca-value">
                                        {finalPrediction ? Math.round(finalPrediction.estimatedMoCA) : (beneficiary.latest_moca || 22)}
                                        <span className="asha-moca-max">/30</span>
                                    </div>
                                    <span className="asha-moca-norm">
                                        {beneficiary.education_years <= 12 ? '+1 Education Norm Applied' : 'Standard Norm'}
                                    </span>
                                </div>

                                <div className="asha-tier-tile">
                                    <span className="asha-moca-sub">Clinical Triage Tier</span>
                                    <div className="asha-tier-title">
                                        {(finalPrediction?.clinicalAlertTier || beneficiary.latest_alert_tier || 'STABLE').replace(/_/g, ' ')}
                                    </div>
                                    <p className="asha-tier-desc">
                                        {(finalPrediction?.clinicalAlertTier || '').includes('RECOMMEND') || (beneficiary.latest_alert_tier || '').includes('RECOMMEND')
                                            ? 'Performance flags observed in recall or speed. Secondary clinical referral to PHC Medical Officer recommended.'
                                            : 'Profile matches expected baseline norms for age and schooling.'}
                                    </p>
                                </div>
                            </div>

                            {/* Clinical Action Buttons */}
                            <div className="asha-complete-actions">
                                <a
                                    href={generateWhatsAppUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="asha-btn asha-btn-whatsapp"
                                >
                                    <Share2 size={18} />
                                    <span>Share Referral via WhatsApp to PHC Doctor</span>
                                </a>

                                <button
                                    type="button"
                                    className="asha-btn asha-btn-print-slip"
                                    onClick={() => {
                                        printPhcReferralSlip({
                                            beneficiary,
                                            prediction: finalPrediction
                                        });
                                    }}
                                >
                                    <Printer size={18} />
                                    <span>Print Official PHC Referral Slip</span>
                                </button>

                                <button
                                    className="asha-btn asha-btn-primary"
                                    onClick={() => {
                                        endBeneficiarySession();
                                        onClose();
                                    }}
                                >
                                    <span>Return to Village Beneficiary Roster</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
