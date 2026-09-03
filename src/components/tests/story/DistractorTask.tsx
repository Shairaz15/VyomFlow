import { useState, useEffect, useRef } from "react";
import { Button, Card, Icon } from "../../common";
import type { SupportedLanguage } from "../../../types/storyTypes";

const DISTRACTOR_TRANSLATIONS: Record<SupportedLanguage, { title: string; sub: string; skip: string }> = {
    'en-IN': { title: "Distractor Task", sub: "Count backwards from 20! Enter the next 3 numbers below:", skip: "Skip to Quiz" },
    'hi-IN': { title: "ध्यान भटकाने वाला काम", sub: "20 से उल्टी गिनती करें! नीचे अगले 3 नंबर दर्ज करें:", skip: "क्विज़ पर जाएँ" },
    'ta-IN': { title: "திசைதிருப்பும் பணி", sub: "20-லிருந்து பின்னோக்கி எண்ணுங்கள்! அடுத்த 3 எண்களை கீழே உள்ளிடவும்:", skip: "வினாடி வினாவுக்குச் செல்" },
    'te-IN': { title: "దృష్టి మరల్చే పని", sub: "20 నుండి వెనక్కి లెక్కించండి! దిగువన తదుపరి 3 సంఖ్యలను నమోదు చేయండి:", skip: "క్విజ్‌కి వెళ్లండి" },
    'kn-IN': { title: "ಗೊಂದಲಕಾರಿ ಕೆಲಸ", sub: "20 ರಿಂದ ಹಿಂದಕ್ಕೆ ಎಣಿಸಿ! ಮುಂದಿನ 3 ಸಂಖ್ಯೆಗಳನ್ನು ಕೆಳಗೆ ನಮೂದಿಸಿ:", skip: "ರಸಪ್ರಶ್ನೆಗೆ ಹೋಗು" },
    'bn-IN': { title: "মনোযোগ বিক্ষিপ্ত করার কাজ", sub: "20 থেকে পিছনের দিকে গণনা করুন! নিচের 3টি সংখ্যা লিখুন:", skip: "কুইজে যান" },
    'mr-IN': { title: "लक्ष विचलित करणारे काम", sub: "20 पासून मागे मोजा! खालील 3 संख्या टाका:", skip: "क्विझवर जा" },
    'gu-IN': { title: "ધ્યાન ભટકાવવાનું કાર્ય", sub: "20 થી ઊલટી ગણતરી કરો! નીચેના 3 નંબરો દાખલ કરો:", skip: "ક્વિઝ પર જાઓ" }
};

interface DistractorTaskProps {
    durationSeconds?: number;
    selectedLanguage?: SupportedLanguage;
    onComplete: () => void;
}

export function DistractorTask({ durationSeconds = 10, selectedLanguage = 'en-IN', onComplete }: DistractorTaskProps) {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);
    const [userInputs, setUserInputs] = useState<string[]>(["", "", ""]);

    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    const text = DISTRACTOR_TRANSLATIONS[selectedLanguage] || DISTRACTOR_TRANSLATIONS['en-IN'];

    useEffect(() => {
        if (timeLeft <= 0) {
            onCompleteRef.current();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleInputChange = (index: number, val: string) => {
        const next = [...userInputs];
        next[index] = val;
        setUserInputs(next);
    };

    return (
        <Card className="distractor-card animate-fadeIn">
            <div className="distractor-header">
                <div className="timer-badge">
                    <Icon name="clock" size={16} />
                    <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                </div>
                <h3>{text.title}</h3>
                <p className="distractor-sub">
                    {text.sub}
                </p>
            </div>

            <div className="counting-grid">
                <div className="start-num">20</div>
                <span className="arrow">→</span>
                {userInputs.map((val, idx) => (
                    <input
                        key={idx}
                        type="number"
                        className="number-input"
                        placeholder={`#${idx + 1}`}
                        value={val}
                        onChange={e => handleInputChange(idx, e.target.value)}
                        maxLength={2}
                        autoFocus={idx === 0}
                    />
                ))}
            </div>

            <div className="distractor-footer">
                <Button variant="secondary" onClick={onComplete}>
                    {text.skip}
                </Button>
            </div>
        </Card>
    );
}
