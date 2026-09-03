/**
 * Verbal Short-Term Memory Assessment
 * 
 * A cognitively-grounded assessment evaluating short-term recall patterns.
 * This supports cognitive performance monitoring—not diagnosis or clinical decision-making.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Card, Button, MotivationalQuoteBlock } from '../components/common';
import { PageWrapper } from '../components/layout';
import { selectRandomWords } from '../data/wordPools';
import { extractMemoryFeatures, identifyKeyFactors } from '../ai/memoryFeatures';
import { useMemoryResults } from '../hooks/useTestResults';
import type { AssessmentPhase, RawMemoryMetrics } from '../types/memoryTypes';
import { getMemoryFeedback } from '../utils/normativeStats';
import './MemoryAssessment.css';

// Configuration
const WORD_COUNT = 10;
const ENCODING_TIME_PER_WORD = 1200; // 1.2 seconds per word
const INTERFERENCE_DURATION = 15000; // 15 seconds
const RECALL_DURATION = 45000; // 45 seconds max

export function MemoryAssessment() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const { t } = useLanguage();

    // Phase management
    const [phase, setPhase] = useState<AssessmentPhase>('instructions');

    // Word state
    const [presentedWords, setPresentedWords] = useState<string[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    // Interference state
    const [interferenceNumbers, setInterferenceNumbers] = useState<number[]>([]);
    const [interferenceTarget, setInterferenceTarget] = useState(0);
    const [interferenceScore, setInterferenceScore] = useState(0);
    const [interferenceTimeLeft, setInterferenceTimeLeft] = useState(INTERFERENCE_DURATION / 1000);

    // Recall state
    const [recallInput, setRecallInput] = useState('');
    const [recalledWords, setRecalledWords] = useState<string[]>([]);
    const [recallTimeLeft, setRecallTimeLeft] = useState(RECALL_DURATION / 1000);
    const recallStartTime = useRef<number>(0);

    // Results state
    const [metrics, setMetrics] = useState<RawMemoryMetrics | null>(null);
    const [keyFactors, setKeyFactors] = useState<string[]>([]);

    // Storage hook
    const { saveResult } = useMemoryResults();

    // Initialize words when starting encoding
    const startEncoding = useCallback(() => {
        if (!isAuthenticated) return;
        const { words } = selectRandomWords(WORD_COUNT);
        setPresentedWords(words);
        setCurrentWordIndex(0);
        setPhase('encoding');
    }, [isAuthenticated]);

    // Encoding phase: cycle through words
    useEffect(() => {
        if (phase !== 'encoding') return;

        if (currentWordIndex >= presentedWords.length) {
            // Move to interference phase
            generateInterferenceTask();
            setPhase('interference');
            return;
        }

        const timer = setTimeout(() => {
            setCurrentWordIndex(prev => prev + 1);
        }, ENCODING_TIME_PER_WORD);

        return () => clearTimeout(timer);
    }, [phase, currentWordIndex, presentedWords.length]);

    // Generate interference task
    const generateInterferenceTask = () => {
        const numbers = Array.from({ length: 9 }, (_, i) => i + 1);
        // Shuffle
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        setInterferenceNumbers(numbers);
        setInterferenceTarget(Math.floor(Math.random() * 9) + 1);
        setInterferenceTimeLeft(INTERFERENCE_DURATION / 1000);
    };

    // Interference countdown
    useEffect(() => {
        if (phase !== 'interference') return;

        if (interferenceTimeLeft <= 0) {
            recallStartTime.current = Date.now();
            setPhase('recall');
            return;
        }

        const timer = setInterval(() => {
            setInterferenceTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, interferenceTimeLeft]);

    // Handle interference tap
    const handleInterferenceTap = (num: number) => {
        if (num === interferenceTarget) {
            setInterferenceScore(prev => prev + 1);
            // Generate new target
            setInterferenceTarget(Math.floor(Math.random() * 9) + 1);
        }
    };

    // Recall countdown
    useEffect(() => {
        if (phase !== 'recall') return;

        if (recallTimeLeft <= 0) {
            finishRecall();
            return;
        }

        const timer = setInterval(() => {
            setRecallTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, recallTimeLeft]);

    // Handle word submission
    const handleRecallSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const word = recallInput.trim().toLowerCase();

        if (word && !recalledWords.includes(word)) {
            setRecalledWords(prev => [...prev, word]);
        }
        setRecallInput('');
    };

    // Finish recall and calculate results
    const finishRecall = useCallback(() => {
        const responseLatency = Date.now() - recallStartTime.current;

        // Normalize words for comparison
        const normalizedPresented = presentedWords.map(w => w.toLowerCase());
        const normalizedRecalled = recalledWords.map(w => w.toLowerCase());

        // Calculate metrics
        const correctWords = normalizedRecalled.filter(w => normalizedPresented.includes(w));
        const falseRecalls = normalizedRecalled.filter(w => !normalizedPresented.includes(w));
        const omissions = normalizedPresented.filter(w => !normalizedRecalled.includes(w));

        // Count duplicates (words submitted more than once - already filtered in handleRecallSubmit)
        const duplicateCount = 0; // We prevent duplicates in submission

        const rawMetrics: RawMemoryMetrics = {
            presentedWords,
            recalledWords,
            correctCount: correctWords.length,
            falseRecallCount: falseRecalls.length,
            omissionCount: omissions.length,
            duplicateCount,
            responseLatencyMs: responseLatency,
            interferenceScore
        };

        setMetrics(rawMetrics);
        setPhase('scoring');

        // Extract features and compute profile
        const extractedFeatures = extractMemoryFeatures(rawMetrics);

        const factors = identifyKeyFactors(rawMetrics, extractedFeatures);
        setKeyFactors(factors);

        // Save results
        const accuracy = rawMetrics.correctCount / WORD_COUNT;
        saveResult({
            timestamp: new Date(),
            totalWords: WORD_COUNT,
            correctCount: rawMetrics.correctCount,
            accuracy,
        });

        // Brief pause on scoring, then show completion
        setTimeout(() => {
            setPhase('completion');
        }, 1500);
    }, [presentedWords, recalledWords, interferenceScore]);

    // Render based on phase
    const renderPhase = () => {
        switch (phase) {
            case 'instructions':
                return (
                    <div className="assessment-phase instructions-phase">
                        <div className="phase-icon">🧠</div>
                        <h2>{t('memory.title')}</h2>
                        <p className="phase-description">
                            {t('memory.subtitle')}
                        </p>

                        <div className="instructions-list">
                            <div className="instruction-item">
                                <span className="instruction-number">1</span>
                                <span>{t('memory.step1', { count: WORD_COUNT })}</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">2</span>
                                <span>{t('memory.step2')}</span>
                            </div>
                            <div className="instruction-item">
                                <span className="instruction-number">3</span>
                                <span>{t('memory.step3')}</span>
                            </div>
                        </div>

                        <p className="reassurance-text">
                            {t('memory.reassurance')}
                        </p>

                        <div className="button-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Button variant="secondary" size="lg" onClick={() => navigate('/tests')}>
                                {t('memory.back')}
                            </Button>
                            <Button variant="primary" size="lg" onClick={startEncoding}>
                                {t('memory.beginAssessment')}
                            </Button>
                        </div>
                    </div>
                );

            case 'encoding':
                return (
                    <div className="assessment-phase encoding-phase">
                        <p className="phase-label">{t('memory.rememberWord')}</p>
                        <div className="word-display">
                            {presentedWords[currentWordIndex]}
                        </div>
                        <div className="progress-dots">
                            {presentedWords.map((_, i) => (
                                <span
                                    key={i}
                                    className={`dot ${i < currentWordIndex ? 'completed' : i === currentWordIndex ? 'current' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                );

            case 'interference':
                return (
                    <div className="assessment-phase interference-phase">
                        <p className="phase-label">{t('memory.tapNumber')} <strong>{interferenceTarget}</strong></p>
                        <div className="number-grid">
                            {interferenceNumbers.map((num) => (
                                <button
                                    key={num}
                                    className="number-button"
                                    onClick={() => handleInterferenceTap(num)}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <p className="time-remaining">{t('memory.timeRemaining', { seconds: interferenceTimeLeft })}</p>
                    </div>
                );

            case 'recall':
                return (
                    <div className="assessment-phase recall-phase">
                        <p className="phase-label">{t('memory.typeWords')}</p>

                        <form onSubmit={handleRecallSubmit} className="recall-form">
                            <input
                                type="text"
                                value={recallInput}
                                onChange={(e) => setRecallInput(e.target.value)}
                                placeholder={t('memory.placeholder')}
                                autoFocus
                                className="recall-input"
                            />
                            <Button type="submit" variant="secondary">{t('memory.add')}</Button>
                        </form>

                        {recalledWords.length > 0 && (
                            <div className="recalled-words">
                                {recalledWords.map((word, i) => (
                                    <span key={i} className="recalled-word">{word}</span>
                                ))}
                            </div>
                        )}

                        <p className="time-remaining">{t('memory.timeRemaining', { seconds: recallTimeLeft })}</p>

                        <Button
                            variant="primary"
                            onClick={finishRecall}
                            className="finish-button"
                        >
                            {t('memory.imDone')}
                        </Button>
                    </div>
                );

            case 'scoring':
                return (
                    <div className="assessment-phase scoring-phase">
                        <div className="scoring-animation">
                            <div className="spinner"></div>
                            <p>{t('memory.processing')}</p>
                        </div>
                    </div>
                );

            case 'completion':
                return (
                    <div className="assessment-phase completion-phase">
                        <div className="phase-icon success">✓</div>
                        <h2>{t('memory.assessmentComplete')}</h2>

                        <Card className="results-card">
                            <div className="result-item">
                                <span className="result-label">{t('memory.wordsRecalled')}</span>
                                <span className="result-value">
                                    {t('memory.outOf', { count: metrics?.correctCount ?? 0, total: WORD_COUNT })}
                                </span>
                            </div>

                            {/* Feedback Badge */}
                            {metrics && (() => {
                                const feedback = getMemoryFeedback(metrics.correctCount);
                                return (
                                    <>
                                        <div className="feedback-section mt-4 mb-4 p-3 rounded bg-[var(--color-accent-soft)] border border-[var(--glass-border)] text-center text-[var(--color-text-primary)]">
                                            <div style={{ fontWeight: 'bold', color: feedback.color === 'success' ? 'var(--color-status-stable)' : feedback.color === 'primary' ? 'var(--color-accent)' : feedback.color === 'warning' ? 'var(--color-status-change)' : 'var(--color-text-muted)' }}>
                                                {feedback.category}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{feedback.message}</div>
                                        </div>
                                        <MotivationalQuoteBlock
                                            category={feedback.category}
                                            score={Math.round((metrics.correctCount / WORD_COUNT) * 100)}
                                        />
                                    </>
                                );
                            })()}

                            {metrics && metrics.falseRecallCount > 0 && (
                                <div className="result-item secondary">
                                    <span className="result-label">{t('memory.additionalWords')}</span>
                                    <span className="result-value">{metrics.falseRecallCount}</span>
                                </div>
                            )}
                        </Card>

                        {keyFactors.length > 0 && (
                            <div className="factors-section">
                                <p className="factors-label">{t('memory.observations')}</p>
                                <ul className="factors-list">
                                    {keyFactors.map((factor, i) => (
                                        <li key={i}>{factor}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p className="reassurance-text">
                            {t('memory.reassuranceFooter')}
                        </p>

                        <div className="completion-actions">
                            <Button variant="primary" onClick={() => navigate('/dashboard')}>
                                {t('memory.viewDashboard')}
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/tests')}>
                                {t('memory.backToAssessments')}
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <PageWrapper>
            <div className="memory-assessment container">
                {renderPhase()}
            </div>
        </PageWrapper>
    );
}
