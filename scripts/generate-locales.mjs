/**
 * Generate locale stub files for all remaining languages.
 * Each file copies English keys with a language prefix marker.
 * For production, these should be reviewed by native speakers.
 * 
 * Run: node scripts/generate-locales.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, '..', 'src', 'i18n', 'locales');

const en = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8'));

// Translations for key UI strings by language code
const translations = {
    bn: { "landing.badge": "অ-নিদানমূলক সচেতনতা সরঞ্জাম", "landing.heroTagline": "তাড়াতাড়ি প্রবণতা বুঝুন।", "landing.heroSubtitle": "VyomFlow আপনাকে সময়ের সাথে স্মৃতি, মনোযোগ, প্রতিক্রিয়া গতি এবং ভাষার ধরণ পর্যবেক্ষণ করতে সাহায্য করে — সচেতনতার জন্য, নির্ণয়ের জন্য নয়।", "landing.statTests": "জ্ঞানীয় পরীক্ষা", "landing.statML": "প্রবণতা বিশ্লেষণ", "landing.statPrivacy": "গোপনীয়তা প্রথম", "landing.disclaimerTitle": "গুরুত্বপূর্ণ বিজ্ঞপ্তি", "landing.startAssessment": "মূল্যায়ন শুরু করুন", "tests.title": "জ্ঞানীয় মূল্যায়ন", "tests.startTest": "পরীক্ষা শুরু করুন", "dashboard.title": "আপনার জ্ঞানীয় প্রবণতা", "settings.title": "সেটিংস", "onboarding.welcomeTitle": "স্বাগতম", "onboarding.continue": "চালিয়ে যান", "auth.signInRequired": "সাইন ইন প্রয়োজন", "common.dashboard": "ড্যাশবোর্ড", "common.settings": "সেটিংস", "common.signOut": "সাইন আউট" },
    te: { "landing.badge": "నాన్-డయాగ్నస్టిక్ అవగాహన సాధనం", "landing.heroTagline": "ట్రెండ్‌లను ముందుగానే అర్థం చేసుకోండి.", "landing.statTests": "అభిజ్ఞా పరీక్షలు", "landing.startAssessment": "అంచనా ప్రారంభించండి", "tests.title": "అభిజ్ఞా అంచనా", "tests.startTest": "పరీక్ష ప్రారంభించండి", "dashboard.title": "మీ అభిజ్ఞా ట్రెండ్‌లు", "settings.title": "సెట్టింగ్‌లు", "onboarding.welcomeTitle": "స్వాగతం", "onboarding.continue": "కొనసాగించండి", "common.dashboard": "డ్యాష్‌బోర్డ్", "common.settings": "సెట్టింగ్‌లు", "common.signOut": "సైన్ అవుట్" },
    mr: { "landing.badge": "नॉन-डायग्नोस्टिक जागरूकता साधन", "landing.heroTagline": "कल बदलू शकतात ते आज समजून घ्या.", "landing.startAssessment": "मूल्यमापन सुरू करा", "tests.title": "संज्ञानात्मक मूल्यमापन", "tests.startTest": "चाचणी सुरू करा", "dashboard.title": "तुमचे संज्ञानात्मक ट्रेंड", "settings.title": "सेटिंग्ज", "onboarding.welcomeTitle": "स्वागत", "onboarding.continue": "पुढे चालू ठेवा", "common.dashboard": "डॅशबोर्ड", "common.settings": "सेटिंग्ज", "common.signOut": "साइन आउट" },
    ta: { "landing.badge": "கண்டறியாத விழிப்புணர்வு கருவி", "landing.heroTagline": "போக்குகளை முன்கூட்டியே புரிந்து கொள்ளுங்கள்.", "landing.startAssessment": "மதிப்பீட்டைத் தொடங்கு", "tests.title": "அறிவாற்றல் மதிப்பீடு", "tests.startTest": "சோதனையைத் தொடங்கு", "dashboard.title": "உங்கள் அறிவாற்றல் போக்குகள்", "settings.title": "அமைப்புகள்", "onboarding.welcomeTitle": "வரவேற்பு", "onboarding.continue": "தொடரவும்", "common.dashboard": "டாஷ்போர்டு", "common.settings": "அமைப்புகள்", "common.signOut": "வெளியேறு" },
    gu: { "landing.badge": "બિન-નિદાન જાગરૂકતા સાધન", "landing.heroTagline": "વલણોને વહેલા સમજો.", "landing.startAssessment": "મૂલ્યાંકન શરૂ કરો", "tests.title": "જ્ઞાનાત્મક મૂલ્યાંકન", "tests.startTest": "કસોટી શરૂ કરો", "dashboard.title": "તમારા જ્ઞાનાત્મક વલણો", "settings.title": "સેટિંગ્સ", "onboarding.welcomeTitle": "સ્વાગત", "onboarding.continue": "ચાલુ રાખો", "common.dashboard": "ડેશબોર્ડ", "common.settings": "સેટિંગ્સ", "common.signOut": "સાઇન આઉટ" },
    kn: { "landing.badge": "ರೋಗನಿರ್ಣಯವಲ್ಲದ ಜಾಗೃತಿ ಸಾಧನ", "landing.heroTagline": "ಪ್ರವೃತ್ತಿಗಳನ್ನು ಮೊದಲೇ ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.", "landing.startAssessment": "ಮೌಲ್ಯಮಾಪನ ಪ್ರಾರಂಭಿಸಿ", "tests.title": "ಅರಿವಿನ ಮೌಲ್ಯಮಾಪನ", "tests.startTest": "ಪರೀಕ್ಷೆ ಪ್ರಾರಂಭಿಸಿ", "dashboard.title": "ನಿಮ್ಮ ಅರಿವಿನ ಪ್ರವೃತ್ತಿಗಳು", "settings.title": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", "onboarding.welcomeTitle": "ಸ್ವಾಗತ", "onboarding.continue": "ಮುಂದುವರಿಸಿ", "common.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", "common.settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು", "common.signOut": "ಸೈನ್ ಔಟ್" },
    or: { "landing.badge": "ଅ-ନିଦାନମୂଳକ ସଚେତନତା ଉପକରଣ", "landing.heroTagline": "ଟ୍ରେଣ୍ଡ ଶୀଘ୍ର ବୁଝିବା.", "landing.startAssessment": "ମୂଲ୍ୟାଙ୍କନ ଆରମ୍ଭ କରନ୍ତୁ", "tests.title": "ଜ୍ଞାନାତ୍ମକ ମୂଲ୍ୟାଙ୍କନ", "tests.startTest": "ପରୀକ୍ଷା ଆରମ୍ଭ କରନ୍ତୁ", "dashboard.title": "ଆପଣଙ୍କ ଜ୍ଞାନାତ୍ମକ ଟ୍ରେଣ୍ଡ", "settings.title": "ସେଟିଂସ", "onboarding.welcomeTitle": "ସ୍ୱାଗତ", "onboarding.continue": "ଜାରି ରଖନ୍ତୁ", "common.dashboard": "ଡ୍ୟାସବୋର୍ଡ", "common.settings": "ସେଟିଂସ", "common.signOut": "ସାଇନ ଆଉଟ" },
    pa: { "landing.badge": "ਗੈਰ-ਨਿਦਾਨ ਜਾਗਰੂਕਤਾ ਸਾਧਨ", "landing.heroTagline": "ਰੁਝਾਨ ਜਲਦੀ ਸਮਝੋ।", "landing.startAssessment": "ਮੁਲਾਂਕਣ ਸ਼ੁਰੂ ਕਰੋ", "tests.title": "ਬੋਧਾਤਮਕ ਮੁਲਾਂਕਣ", "tests.startTest": "ਟੈਸਟ ਸ਼ੁਰੂ ਕਰੋ", "dashboard.title": "ਤੁਹਾਡੇ ਬੋਧਾਤਮਕ ਰੁਝਾਨ", "settings.title": "ਸੈਟਿੰਗਜ਼", "onboarding.welcomeTitle": "ਸੁਆਗਤ", "onboarding.continue": "ਜਾਰੀ ਰੱਖੋ", "common.dashboard": "ਡੈਸ਼ਬੋਰਡ", "common.settings": "ਸੈਟਿੰਗਜ਼", "common.signOut": "ਸਾਈਨ ਆਉਟ" },
    ml: { "landing.badge": "രോഗനിർണയമല്ലാത്ത അവബോധ ഉപകരണം", "landing.heroTagline": "ട്രെൻഡുകൾ നേരത്തേ മനസ്സിലാക്കുക.", "landing.startAssessment": "വിലയിരുത്തൽ ആരംഭിക്കുക", "tests.title": "വൈജ്ഞാനിക വിലയിരുത്തൽ", "tests.startTest": "ടെസ്റ്റ് ആരംഭിക്കുക", "dashboard.title": "നിങ്ങളുടെ വൈജ്ഞാനിക ട്രെൻഡുകൾ", "settings.title": "ക്രമീകരണങ്ങൾ", "onboarding.welcomeTitle": "സ്വാഗതം", "onboarding.continue": "തുടരുക", "common.dashboard": "ഡാഷ്ബോർഡ്", "common.settings": "ക്രമീകരണങ്ങൾ", "common.signOut": "സൈൻ ഔട്ട്" },
    as: { "landing.badge": "অ-নিদানমূলক সজাগতা সঁজুলি", "landing.startAssessment": "মূল্যায়ন আৰম্ভ কৰক", "tests.title": "জ্ঞানমূলক মূল্যায়ন", "tests.startTest": "পৰীক্ষা আৰম্ভ কৰক", "dashboard.title": "আপোনাৰ জ্ঞানমূলক প্ৰৱণতা", "settings.title": "ছেটিংছ", "onboarding.welcomeTitle": "স্বাগতম", "onboarding.continue": "অব্যাহত ৰাখক", "common.dashboard": "ডেচব'ৰ্ড", "common.settings": "ছেটিংছ", "common.signOut": "চাইন আউট" },
    ur: { "landing.badge": "غیر تشخیصی آگاہی ٹول", "landing.heroTagline": "رجحانات کو جلدی سمجھیں۔", "landing.startAssessment": "تشخیص شروع کریں", "tests.title": "علمی تشخیص", "tests.startTest": "ٹیسٹ شروع کریں", "dashboard.title": "آپ کے علمی رجحانات", "settings.title": "ترتیبات", "onboarding.welcomeTitle": "خوش آمدید", "onboarding.continue": "جاری رکھیں", "common.dashboard": "ڈیش بورڈ", "common.settings": "ترتیبات", "common.signOut": "سائن آؤٹ" },
    ne: { "landing.badge": "गैर-निदानात्मक जागरूकता उपकरण", "landing.startAssessment": "मूल्याङ्कन सुरू गर्नुहोस्", "tests.title": "संज्ञानात्मक मूल्याङ्कन", "tests.startTest": "परीक्षा सुरू गर्नुहोस्", "dashboard.title": "तपाईंको संज्ञानात्मक प्रवृत्तिहरू", "settings.title": "सेटिङहरू", "onboarding.welcomeTitle": "स्वागत", "onboarding.continue": "जारी राख्नुहोस्", "common.dashboard": "ड्यासबोर्ड", "common.settings": "सेटिङहरू", "common.signOut": "साइन आउट" },
    sa: { "landing.badge": "अनिदानात्मकं जागरूकतासाधनम्", "landing.startAssessment": "मूल्याङ्कनम् आरभत", "tests.title": "संज्ञानात्मकं मूल्याङ्कनम्", "dashboard.title": "भवतः संज्ञानात्मकाः प्रवृत्तयः", "settings.title": "विन्यासाः", "onboarding.welcomeTitle": "स्वागतम्", "onboarding.continue": "अग्रे गच्छतु", "common.dashboard": "डैशबोर्ड", "common.settings": "विन्यासाः", "common.signOut": "निर्गमनम्" },
    sd: { "landing.badge": "غير تشخيصي آگاھي اوزار", "landing.startAssessment": "جائزو شروع ڪريو", "tests.title": "ادراڪي جائزو", "dashboard.title": "توهان جا ادراڪي رجحان", "settings.title": "سيٽنگون", "onboarding.welcomeTitle": "ڀلي ڪري آيا", "onboarding.continue": "جاري رکو", "common.dashboard": "ڊيش بورڊ", "common.signOut": "سائن آئوٽ" },
    kok: { "landing.badge": "गैर-निदान जागरुकता साधन", "landing.startAssessment": "मोलावणी सुरू करात", "tests.title": "संज्ञानात्मक मोलावणी", "dashboard.title": "तुमचे संज्ञानात्मक कल", "settings.title": "सेटिंग्ज", "onboarding.welcomeTitle": "स्वागत", "onboarding.continue": "मुखार चलात", "common.dashboard": "डॅशबोर्ड", "common.signOut": "साइन आउट" },
    mai: { "landing.badge": "गैर-निदानात्मक जागरूकता उपकरण", "landing.startAssessment": "मूल्यांकन शुरू करू", "tests.title": "संज्ञानात्मक मूल्यांकन", "dashboard.title": "अहांक संज्ञानात्मक प्रवृत्ति", "settings.title": "सेटिंग्स", "onboarding.welcomeTitle": "स्वागत", "onboarding.continue": "आगू बढ़ू", "common.dashboard": "डैशबोर्ड", "common.signOut": "साइन आउट" },
    mni: { "landing.badge": "নন-ডায়গনষ্টিক এৱেয়ারনেস টুল", "landing.startAssessment": "এসেসমেন্ট হৌদোকউ", "tests.title": "কগনিটিভ এসেসমেন্ট", "dashboard.title": "নহাক্কী কগনিটিভ ত্রেন্দশিং", "settings.title": "সেটিংশিং", "onboarding.welcomeTitle": "ওকচিল্লু", "onboarding.continue": "মখা চৎথরক্কনু", "common.dashboard": "ড্যাশবোর্ড", "common.signOut": "সাইন আউট" },
    brx: { "landing.badge": "रोगनिर्णय नोंथि जागरुकथा हाथियार", "landing.startAssessment": "मुल्याङ्कन जागायनानै", "tests.title": "सिनायनाय मुल्याङ्कन", "dashboard.title": "नोंथांनि सिनायनाय ट्रेन्ड", "settings.title": "छेटिंहो", "onboarding.welcomeTitle": "स्वागतम", "onboarding.continue": "सालाय थानानै", "common.dashboard": "ड्याशब'र्ड", "common.signOut": "साइन आउट" },
    doi: { "landing.badge": "गैर-निदान जागरूकता औजार", "landing.startAssessment": "मूल्यांकन शुरू करो", "tests.title": "संज्ञानात्मक मूल्यांकन", "dashboard.title": "तुंदे संज्ञानात्मक रुझान", "settings.title": "सैटिंग्ज", "onboarding.welcomeTitle": "स्वागत", "onboarding.continue": "अग्गें चलो", "common.dashboard": "डैशबोर्ड", "common.signOut": "साइन आउट" },
    ks: { "landing.badge": "غیر تشخیصی آگاہی آلۂ", "landing.startAssessment": "جانچ شروع کرو", "tests.title": "عرفانی جانچ", "dashboard.title": "تُہُنز عرفانی رجحان", "settings.title": "ترتیبات", "onboarding.welcomeTitle": "خوش آمدید", "onboarding.continue": "جاری رکھو", "common.dashboard": "ڈیش بورڈ", "common.signOut": "سائن آؤٹ" },
    sat: { "landing.badge": "ᱵᱟᱝ-ᱧᱮᱞ ᱥᱟᱶᱦᱮᱫ ᱦᱟᱹᱛᱤᱭᱟᱹᱨ", "landing.startAssessment": "ᱢᱩᱞᱟᱹᱸᱠᱟᱱ ᱮᱦᱚᱵ ᱢᱮ", "tests.title": "ᱥᱮᱧᱮᱞ ᱢᱩᱞᱟᱹᱸᱠᱟᱱ", "dashboard.title": "ᱟᱢᱟᱜ ᱥᱮᱧᱮᱞ ᱴᱨᱮᱱᱰ", "settings.title": "ᱥᱮᱴᱤᱝ", "onboarding.welcomeTitle": "ᱥᱟᱹᱜᱩᱱ", "onboarding.continue": "ᱟᱹᱰᱤ ᱥᱮᱱ ᱢᱮ", "common.dashboard": "ᱰᱮᱥᱵᱚᱨᱰ", "common.signOut": "ᱥᱟᱭᱤᱱ ᱟᱣᱴ" }
};

// Deep merge: overwrite English values with translated ones for a given lang
function createLocale(langCode, overrides) {
    // Deep copy English
    const locale = JSON.parse(JSON.stringify(en));

    // Apply overrides (flat key format: "section.key" → nested)
    for (const [flatKey, value] of Object.entries(overrides)) {
        const parts = flatKey.split('.');
        let obj = locale;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!obj[parts[i]]) obj[parts[i]] = {};
            obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = value;
    }

    return locale;
}

// Generate all locale files
for (const [code, overrides] of Object.entries(translations)) {
    const filePath = join(localesDir, `${code}.json`);
    if (existsSync(filePath)) {
        console.log(`Skipping ${code}.json (already exists)`);
        continue;
    }
    const locale = createLocale(code, overrides);
    writeFileSync(filePath, JSON.stringify(locale, null, 2), 'utf-8');
    console.log(`Created ${code}.json`);
}

console.log('Done! All locale files created.');
