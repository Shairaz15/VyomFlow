import { useNavigate } from 'react-router-dom';
import { useAsha } from '../../contexts/AshaContext';
import { INDIAN_LANGUAGES } from '../common/OnboardingModal';
import './AshaComponents.css';

export function AshaFieldBanner() {
    const { activeBeneficiary, isFieldAssessmentActive, endBeneficiarySession } = useAsha();
    const navigate = useNavigate();

    if (!isFieldAssessmentActive || !activeBeneficiary) {
        return null;
    }

    const lang = INDIAN_LANGUAGES.find(
        l => l.code === activeBeneficiary.preferred_language || activeBeneficiary.preferred_language?.startsWith(l.code)
    );

    const handleExit = () => {
        if (window.confirm(`Exit field assessment for ${activeBeneficiary.full_name} and return to ASHA Worker Dashboard?`)) {
            endBeneficiarySession();
            navigate('/asha');
        }
    };

    return (
        <aside className="asha-field-banner" aria-label="Field Assessment Active Banner">
            <div className="asha-banner-container">
                <div className="asha-banner-left">
                    <span className="asha-banner-pulse" aria-hidden="true" />
                    <span className="asha-banner-badge">FIELD ASSESSMENT ACTIVE</span>
                    <span className="asha-banner-divider">•</span>
                    <span className="asha-banner-person">
                        Participant: <strong>{activeBeneficiary.full_name}</strong> ({activeBeneficiary.age} yrs, {activeBeneficiary.education_years} yrs edu)
                    </span>
                    <span className="asha-banner-divider">•</span>
                    <span className="asha-banner-lang">
                        Language: <strong>{lang ? `${lang.native} (${lang.label})` : activeBeneficiary.preferred_language}</strong>
                    </span>
                </div>

                <div className="asha-banner-right">
                    <button
                        className="asha-banner-exit-btn"
                        onClick={handleExit}
                        title="End testing and return to the beneficiary list"
                    >
                        <span>✕ Return to ASHA Panel</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
