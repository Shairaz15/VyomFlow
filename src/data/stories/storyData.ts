import type { Story, SupportedLanguage } from "../../types/storyTypes";

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    'en-IN': 'English',
    'hi-IN': 'हिंदी (Hindi)',
    'ta-IN': 'தமிழ் (Tamil)',
    'te-IN': 'తెలుగు (Telugu)',
    'kn-IN': 'ಕನ್ನಡ (Kannada)',
    'bn-IN': 'বাংলা (Bengali)',
    'mr-IN': 'मराठी (Marathi)',
    'gu-IN': 'ગુજરાતી (Gujarati)'
};

export const STORIES: Story[] = [
    // ----------------------------------------------------
    // STORY 1: Easy - Riya's Market Trip
    // ----------------------------------------------------
    {
        id: "story_market_easy",
        title: "Riya's Market Trip",
        difficulty: "easy",
        englishReference: "On Sunday morning, Riya bought two kilos of tomatoes and three sweet mangoes at the market. She met her neighbor Mr. Sharma and paid fifty rupees before returning home.",
        content: {
            'en-IN': "On Sunday morning, Riya bought two kilos of tomatoes and three sweet mangoes at the market. She met her neighbor Mr. Sharma and paid fifty rupees before returning home.",
            'hi-IN': "रविवार की सुबह, रिया ने बाजार से दो किलो टमाटर और तीन मीठे आम खरीदे। वह अपने पड़ोसी मिस्टर शर्मा से मिली और घर लौटने से पहले पचास रुपये चुकाए।",
            'ta-IN': "ஞாயிற்றுக்கிழமை காலையில், ரியா சந்தையில் இரண்டு கிலோ தக்காளியும் மூன்று இனிப்பு மாம்பழங்களும் வாங்கினார். அவர் தனது அண்டைவீட்டு திரு. சர்மாவைச் சந்தித்து ஐம்பது ரூபாய் செலுத்திவிட்டு வீட்டிற்குத் திரும்பினார்.",
            'te-IN': "ఆదివారం ఉదయం, రియా మార్కెట్‌లో రెండు కిలోల టమాటాలు మరియు మూడు తీపి మామిడిపండ్లను కొనుగోలు చేసింది. ఆమె తన పొరుగున ఉన్న మిస్టర్ శర్మను కలిసి యాభై రూపాయలు చెల్లించి ఇంటికి తిరిగొచ్చింది.",
            'kn-IN': "ರವಿವಾರ ಬೆಳಿಗ್ಗೆ, ರಿಯಾ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಎರಡು ಕಿಲೋ ಟೊಮೆಟೊ ಮತ್ತು ಮೂರು ಸಿಹಿ ಮಾವಿನ ಹಣ್ಣುಗಳನ್ನು ಖರೀದಿಸಿದಳು. ಅವಳು ನೆರೆಹೊರೆಯ ಶ್ರೀ ಶರ್ಮಾ ಅವರನ್ನು ಭೇಟಿಯಾಗಿ ಐವತ್ತು ರೂಪಾಯಿ ನೀಡಿ ಮನೆಗೆ ಹಿಂತಿರುಗಿದಳು.",
            'bn-IN': "রবিবার সকালে, রিয়া বাজারে গিয়ে দুই কেজি টমেটো এবং তিনটি মিষ্টি আম কিনেছিল। সে তার প্রতিবেশী মিস্টার শর্মার সাথে দেখা করে এবং বাড়ি ফেরার আগে পঞ্চাশ টাকা দিয়েছিল।",
            'mr-IN': "रविवारी सकाळी, रियाने बाजारातून दोन किलो टोमॅटो आणि तीन गोड आंबे विकत घेतले. ती तिचे शेजारी मिस्टर शर्मा यांना भेटली आणि घरी परतण्यापूर्वी पन्नास रुपये दिले.",
            'gu-IN': "રવિવારે સવારે, રિયાએ બજારમાંથી બે કિલો ટામેટાં અને ત્રણ મીઠી કેરીઓ ખરીદી. તે તેના પાડોશી મિસ્ટર શર્માને મળી અને ઘરે પરત ફરતા પહેલા પચાસ રૂપિયા ચૂકવ્યા."
        },
        informationUnits: [
            { id: "iu1", description: "Market on Sunday morning", keywords: ["sunday", "morning", "market"], weight: 1 },
            { id: "iu2", description: "Bought 2kg tomatoes and 3 mangoes", keywords: ["tomatoes", "mangoes", "two", "three"], weight: 3 },
            { id: "iu3", description: "Met neighbor Mr. Sharma", keywords: ["neighbor", "sharma"], weight: 2 },
            { id: "iu4", description: "Paid fifty rupees", keywords: ["fifty", "rupees", "50"], weight: 2 }
        ],
        comprehensionQuestions: [
            {
                id: "q1",
                questionText: "What day of the week did Riya go to the market?",
                options: [
                    { id: "opt_sun", text: "Sunday" },
                    { id: "opt_sat", text: "Saturday" },
                    { id: "opt_fri", text: "Friday" },
                    { id: "opt_mon", text: "Monday" }
                ],
                correctOptionId: "opt_sun",
                languageContent: {
                    'en-IN': { questionText: "What day of the week did Riya go to the market?", options: [{ id: "opt_sun", text: "Sunday" }, { id: "opt_sat", text: "Saturday" }, { id: "opt_fri", text: "Friday" }, { id: "opt_mon", text: "Monday" }] },
                    'hi-IN': { questionText: "रिया सप्ताह के किस दिन बाज़ार गई थी?", options: [{ id: "opt_sun", text: "रविवार" }, { id: "opt_sat", text: "शनिवार" }, { id: "opt_fri", text: "शुक्रवार" }, { id: "opt_mon", text: "सोमवार" }] },
                    'ta-IN': { questionText: "ரியா வாரத்தின் எந்த நாளில் சந்தைக்குச் சென்றார்?", options: [{ id: "opt_sun", text: "ஞாயிற்றுக்கிழமை" }, { id: "opt_sat", text: "சனிக்கிழமை" }, { id: "opt_fri", text: "வெள்ளிக்கிழமை" }, { id: "opt_mon", text: "திங்கட்கிழமை" }] },
                    'te-IN': { questionText: "రియా వారంలో ఏ రోజున మార్కెట్‌కి వెళ్ళింది?", options: [{ id: "opt_sun", text: "ఆదివారం" }, { id: "opt_sat", text: "శనివారం" }, { id: "opt_fri", text: "శుక్రవారం" }, { id: "opt_mon", text: "సోమవారం" }] },
                    'kn-IN': { questionText: "ರಿಯಾ ವಾರದ ಯಾವ ದಿನ ಮಾರುಕಟ್ಟೆಗೆ ಹೋದಳು?", options: [{ id: "opt_sun", text: "ರವಿವಾರ" }, { id: "opt_sat", text: "ಶನಿವಾರ" }, { id: "opt_fri", text: "ಶುಕ್ರವಾರ" }, { id: "opt_mon", text: "ಸೋಮವಾರ" }] },
                    'bn-IN': { questionText: "রিয়া সপ্তাহের কোন দিনে বাজারে গিয়েছিল?", options: [{ id: "opt_sun", text: "রবিবার" }, { id: "opt_sat", text: "শনিবার" }, { id: "opt_fri", text: "শুক্রবার" }, { id: "opt_mon", text: "সোমবার" }] },
                    'mr-IN': { questionText: "रिया आठवड्याच्या कोणत्या दिवशी बाजारात गेली होती?", options: [{ id: "opt_sun", text: "रविवार" }, { id: "opt_sat", text: "शनिवार" }, { id: "opt_fri", text: "शुक्रवार" }, { id: "opt_mon", text: "सोमवार" }] },
                    'gu-IN': { questionText: "રિયા અઠવાડિયાના કયા દિવસે બજારમાં ગઈ હતી?", options: [{ id: "opt_sun", text: "રવિવાર" }, { id: "opt_sat", text: "શનિવાર" }, { id: "opt_fri", text: "શુક્રવાર" }, { id: "opt_mon", text: "સોમવાર" }] }
                }
            },
            {
                id: "q2",
                questionText: "How many mangoes did Riya buy?",
                options: [
                    { id: "opt_3", text: "Three" },
                    { id: "opt_2", text: "Two" },
                    { id: "opt_5", text: "Five" },
                    { id: "opt_4", text: "Four" }
                ],
                correctOptionId: "opt_3",
                languageContent: {
                    'en-IN': { questionText: "How many mangoes did Riya buy?", options: [{ id: "opt_3", text: "Three" }, { id: "opt_2", text: "Two" }, { id: "opt_5", text: "Five" }, { id: "opt_4", text: "Four" }] },
                    'hi-IN': { questionText: "रिया ने कितने आम खरीदे?", options: [{ id: "opt_3", text: "तीन" }, { id: "opt_2", text: "दो" }, { id: "opt_5", text: "पांच" }, { id: "opt_4", text: "चार" }] },
                    'ta-IN': { questionText: "ரியா எத்தனை மாம்பழங்களை வாங்கினார்?", options: [{ id: "opt_3", text: "மூன்று" }, { id: "opt_2", text: "இரண்டு" }, { id: "opt_5", text: "ஐந்து" }, { id: "opt_4", text: "நான்கு" }] },
                    'te-IN': { questionText: "రియా ఎన్ని మామిడిపండ్లను కొనుగోలు చేసింది?", options: [{ id: "opt_3", text: "మూడు" }, { id: "opt_2", text: "రెండు" }, { id: "opt_5", text: "ఐదు" }, { id: "opt_4", text: "నాలుగు" }] },
                    'kn-IN': { questionText: "ರಿಯಾ ಎಷ್ಟು ಮಾವಿನ ಹಣ್ಣುಗಳನ್ನು ಖರೀದಿಸಿದಳು?", options: [{ id: "opt_3", text: "ಮೂರು" }, { id: "opt_2", text: "ಎರಡು" }, { id: "opt_5", text: "ಐದು" }, { id: "opt_4", text: "ನಾಲ್ಕು" }] },
                    'bn-IN': { questionText: "রিয়া কয়টি আম কিনেছিল?", options: [{ id: "opt_3", text: "তিনটি" }, { id: "opt_2", text: "দুটি" }, { id: "opt_5", text: "পাঁচটি" }, { id: "opt_4", text: "চারটি" }] },
                    'mr-IN': { questionText: "रियाने किती आंबे विकत घेतले?", options: [{ id: "opt_3", text: "तीन" }, { id: "opt_2", text: "दोन" }, { id: "opt_5", text: "पाच" }, { id: "opt_4", text: "चार" }] },
                    'gu-IN': { questionText: "રિયાએ કેટલી કેરીઓ ખરીદી?", options: [{ id: "opt_3", text: "ત્રણ" }, { id: "opt_2", text: "બે" }, { id: "opt_5", text: "પાંચ" }, { id: "opt_4", text: "ચાર" }] }
                }
            },
            {
                id: "q3",
                questionText: "Who did Riya meet at the corner stall?",
                options: [
                    { id: "opt_sharma", text: "Her neighbor Mr. Sharma" },
                    { id: "opt_teacher", text: "Her school teacher" },
                    { id: "opt_brother", text: "Her younger brother" },
                    { id: "opt_doctor", text: "Her family doctor" }
                ],
                correctOptionId: "opt_sharma",
                languageContent: {
                    'en-IN': { questionText: "Who did Riya meet at the corner stall?", options: [{ id: "opt_sharma", text: "Her neighbor Mr. Sharma" }, { id: "opt_teacher", text: "Her school teacher" }, { id: "opt_brother", text: "Her younger brother" }, { id: "opt_doctor", text: "Her family doctor" }] },
                    'hi-IN': { questionText: "कोने की दुकान पर रिया की मुलाकात किससे हुई?", options: [{ id: "opt_sharma", text: "उनके पड़ोसी मिस्टर शर्मा" }, { id: "opt_teacher", text: "उनके स्कूल के शिक्षक" }, { id: "opt_brother", text: "उनका छोटा भाई" }, { id: "opt_doctor", text: "उनके पारिवारिक डॉक्टर" }] },
                    'ta-IN': { questionText: "மூலைக்கடையில் ரியா யாரைச் சந்தித்தார்?", options: [{ id: "opt_sharma", text: "அவரது அண்டைவீட்டு திரு. சர்மா" }, { id: "opt_teacher", text: "அவரது பள்ளி ஆசிரியர்" }, { id: "opt_brother", text: "அவரது தம்பி" }, { id: "opt_doctor", text: "அவரது குடும்ப மருத்துவர்" }] },
                    'te-IN': { questionText: "మూలలో ఉన్న దుకాణం వద్ద రియా ఎవరిని కలిసింది?", options: [{ id: "opt_sharma", text: "ఆమె పొరుగున ఉన్న మిస్టర్ శర్మ" }, { id: "opt_teacher", text: "ఆమె పాఠశాల ఉపాధ్యాయుడు" }, { id: "opt_brother", text: "ఆమె తమ్ముడు" }, { id: "opt_doctor", text: "ఆమె కుటుంబ డాక్టర్" }] },
                    'kn-IN': { questionText: "ಮೂಲೆಯ ಅಂಗಡಿಯಲ್ಲಿ ರಿಯಾ ಯಾರನ್ನು ಭೇಟಿಯಾದಳು?", options: [{ id: "opt_sharma", text: "ಅವಳ ನೆರೆಹೊರೆಯ ಶ್ರೀ ಶರ್ಮಾ" }, { id: "opt_teacher", text: "ಅವಳ ಶಾಲಾ ಶಿಕ್ಷಕರು" }, { id: "opt_brother", text: "ಅವಳ ತಮ್ಮ" }, { id: "opt_doctor", text: "ಅವಳ ಕುಟುಂಬದ ವೈದ್ಯರು" }] },
                    'bn-IN': { questionText: "কোণের দোকানে রিয়ার সাথে কার দেখা হয়েছিল?", options: [{ id: "opt_sharma", text: "তার প্রতিবেশী মিস্টার শর্মা" }, { id: "opt_teacher", text: "তার স্কুলের শিক্ষক" }, { id: "opt_brother", text: "তার ছোট ভাই" }, { id: "opt_doctor", text: "তার পারিবারিক ডাক্তার" }] },
                    'mr-IN': { questionText: "कोपऱ्यावरील दुकानावर रिया कोणाला भेटली?", options: [{ id: "opt_sharma", text: "तिचे शेजारी मिस्टर शर्मा" }, { id: "opt_teacher", text: "तिच्या शाळेतील शिक्षक" }, { id: "opt_brother", text: "तिचा लहान भाऊ" }, { id: "opt_doctor", text: "तिचे कौटुंबिक डॉक्टर" }] },
                    'gu-IN': { questionText: "ખૂણાના સ્ટોલ પર રિયા કોને મળી?", options: [{ id: "opt_sharma", text: "તેમના પાડોશી મિસ્ટર શર્મા" }, { id: "opt_teacher", text: "તેણીના શાળાના શિક્ષક" }, { id: "opt_brother", text: "તેણીનો નાનો ભાઈ" }, { id: "opt_doctor", text: "તેણીના કૌટુંબિક ડૉક્ટર" }] }
                }
            },
            {
                id: "q4",
                questionText: "How much did Riya pay for her groceries?",
                options: [
                    { id: "opt_50", text: "Fifty rupees" },
                    { id: "opt_100", text: "One hundred rupees" },
                    { id: "opt_30", text: "Thirty rupees" },
                    { id: "opt_75", text: "Seventy-five rupees" }
                ],
                correctOptionId: "opt_50",
                languageContent: {
                    'en-IN': { questionText: "How much did Riya pay for her groceries?", options: [{ id: "opt_50", text: "Fifty rupees" }, { id: "opt_100", text: "One hundred rupees" }, { id: "opt_30", text: "Thirty rupees" }, { id: "opt_75", text: "Seventy-five rupees" }] },
                    'hi-IN': { questionText: "रिया ने अपनी सब्जियों के लिए कितने रुपये चुकाए?", options: [{ id: "opt_50", text: "पचास रुपये" }, { id: "opt_100", text: "एक सौ रुपये" }, { id: "opt_30", text: "तीस रुपये" }, { id: "opt_75", text: "पचहत्तर रुपये" }] },
                    'ta-IN': { questionText: "ரியா தன் காய்கறிகளுக்கு எவ்வளவு செலுத்தினார்?", options: [{ id: "opt_50", text: "ஐம்பது ரூபாய்" }, { id: "opt_100", text: "நூறு ரூபாய்" }, { id: "opt_30", text: "முப்பது ரூபாய்" }, { id: "opt_75", text: "எழுபத்தைந்து ரூபாய்" }] },
                    'te-IN': { questionText: "రియా తన కూరగాయలకు ఎంత చెల్లించింది?", options: [{ id: "opt_50", text: "యాభై రూపాయలు" }, { id: "opt_100", text: "వంద రూపాయలు" }, { id: "opt_30", text: "ముప్పై రూపాయలు" }, { id: "opt_75", text: "డెబ్బై ఐదు రూపాయలు" }] },
                    'kn-IN': { questionText: "ರಿಯಾ ತರಕಾರಿಗೆ ಎಷ್ಟು ಹಣ ನೀಡಿದಳು?", options: [{ id: "opt_50", text: "ಐವತ್ತು ರೂಪಾಯಿ" }, { id: "opt_100", text: "ನೂರು ರೂಪಾಯಿ" }, { id: "opt_30", text: "ಮೂವತ್ತು ರೂಪಾಯಿ" }, { id: "opt_75", text: "ಎಪ್ಪತ್ತೈದು ರೂಪಾಯಿ" }] },
                    'bn-IN': { questionText: "রিয়া সবজির জন্য কত টাকা দিয়েছিল?", options: [{ id: "opt_50", text: "পঞ্চাশ টাকা" }, { id: "opt_100", text: "একশ টাকা" }, { id: "opt_30", text: "ত্রিশ টাকা" }, { id: "opt_75", text: "পঁচাত্তর টাকা" }] },
                    'mr-IN': { questionText: "रियाने भाजीसाठी किती रुपये दिले?", options: [{ id: "opt_50", text: "पन्नास रुपये" }, { id: "opt_100", text: "शंभर रुपये" }, { id: "opt_30", text: "तीस रुपये" }, { id: "opt_75", text: "पंच्याहत्तर रुपये" }] },
                    'gu-IN': { questionText: "રિયાએ તેના શાકભાજી માટે કેટલા રૂપિયા ચૂકવ્યા?", options: [{ id: "opt_50", text: "પચાસ રૂપિયા" }, { id: "opt_100", text: "એક સો રૂપિયા" }, { id: "opt_30", text: "ત્રીસ રૂપિયા" }, { id: "opt_75", text: "પંચોતેર રૂપિયા" }] }
                }
            }
        ]
    },

    // ----------------------------------------------------
    // STORY 2: Medium - Arjun's Train Journey
    // ----------------------------------------------------
    {
        id: "story_train_medium",
        title: "Arjun's Train Journey",
        difficulty: "medium",
        englishReference: "Arjun took the morning train to Jaipur to visit his grandmother. He ate potato parathas with Uncle Verma during the journey and met his uncle at platform two.",
        content: {
            'en-IN': "Arjun took the morning train to Jaipur to visit his grandmother. He ate potato parathas with Uncle Verma during the journey and met his uncle at platform two.",
            'hi-IN': "अर्जुन अपनी दादी से मिलने के लिए सुबह की ट्रेन से जयपुर गया। उसने यात्रा के दौरान अंकल वर्मा के साथ आलू के पराठे खाए और प्लेटफॉर्म दो पर अपने चाचा से मिला।",
            'ta-IN': "அர்ஜுன் தனது பாட்டியைச் சந்திக்க காலை ரயிலில் ஜெய்ப்பூருக்குச் சென்றார். பயணத்தின் போது வர்மா மாமாவுடன் உருளைக்கிழங்கு பரோட்டா சாப்பிட்டு, தளம் இரண்டில் தனது மாமாவைச் சந்தித்தார்.",
            'te-IN': "అర్జున్ తన అమ్మమ్మను చూడటానికి ఉదయం రైలులో జైపూర్ వెళ్లాడు. ప్రయాణంలో అంకుల్ వర్మాతో బంగాళాదుంప పరాటాలు తిని, ప్లాట్‌ఫారమ్ రెండు వద్ద తన మామయ్యను కలిశాడు.",
            'kn-IN': "ಅರ್ಜುನ್ ತನ್ನಜ್ಜಿಯನ್ನು ಭೇಟಿಯಾಗಲು ಬೆಳಗಿನ ರೈಲಿನಲ್ಲಿ ಜೈಪುರಕ್ಕೆ ಹೋದನು. ಪ್ರಯಾಣದ ಸಮಯದಲ್ಲಿ ಅವನು ವರ್ಮಾ ಅಂಕಲ್ ಅವರೊಂದಿಗೆ ಆಲೂ ಪರೋಟ ತಿಂದನು ಮತ್ತು ಎರಡನೇ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ತನ್ನ ಮಾವನನ್ನು ಭೇಟಿಯಾದನು.",
            'bn-IN': "অর্জুন তার ঠাকুমাকে দেখতে সকালের ট্রেনে জয়পুর গিয়েছিল। যাত্রাপথে সে আঙ্কেল বর্মার সাথে আলুর পরোটা খেয়েছিল এবং প্ল্যাটফর্ম দুয়ে তার মামার সাথে দেখা করেছিল।",
            'mr-IN': "अर्जुन आपल्या आजीला भेटण्यासाठी सकाळच्या ट्रेनने जयपूरला गेला. प्रवासात त्याने अंकल वर्मांसोबत आलू पराठे खाल्ले आणि प्लॅटफॉर्म दोनवर आपल्या काकांना भेटला.",
            'gu-IN': "અર્જુન તેની દાદીને મળવા સવારની ટ્રેનમાં જયપુર ગયો. મુસાફરી દરમિયાન તેણે વર્મા અંકલ સાથે આલુ પરોઠા ખાધા અને પ્લેટફોર્મ બે પર તેના કાકાને મળ્યો."
        },
        informationUnits: [
            { id: "iu1", description: "Morning train to Jaipur for grandmother", keywords: ["train", "jaipur", "grandmother"], weight: 2 },
            { id: "iu2", description: "Ate potato parathas with Uncle Verma", keywords: ["potato", "parathas", "verma"], weight: 3 },
            { id: "iu3", description: "Met uncle at platform two", keywords: ["platform", "two", "uncle"], weight: 3 }
        ],
        comprehensionQuestions: [
            {
                id: "q1",
                questionText: "What coach and seat number did Arjun have?",
                options: [
                    { id: "opt_b3_24", text: "Coach B3, Seat 24" },
                    { id: "opt_a1_12", text: "Coach A1, Seat 12" },
                    { id: "opt_b2_36", text: "Coach B2, Seat 36" },
                    { id: "opt_c4_18", text: "Coach C4, Seat 18" }
                ],
                correctOptionId: "opt_b3_24",
                languageContent: {
                    'en-IN': { questionText: "What coach and seat number did Arjun have?", options: [{ id: "opt_b3_24", text: "Coach B3, Seat 24" }, { id: "opt_a1_12", text: "Coach A1, Seat 12" }, { id: "opt_b2_36", text: "Coach B2, Seat 36" }, { id: "opt_c4_18", text: "Coach C4, Seat 18" }] },
                    'hi-IN': { questionText: "अर्जुन का कौन सा कोच और सीट नंबर था?", options: [{ id: "opt_b3_24", text: "कोच B3, सीट 24" }, { id: "opt_a1_12", text: "कोच A1, सीट 12" }, { id: "opt_b2_36", text: "कोच B2, सीट 36" }, { id: "opt_c4_18", text: "कोच C4, सीट 18" }] },
                    'ta-IN': { questionText: "அர்ஜுனுக்கு என்ன கோச் மற்றும் இருக்கை எண் இருந்தது?", options: [{ id: "opt_b3_24", text: "கோச் B3, இருக்கை 24" }, { id: "opt_a1_12", text: "கோச் A1, இருக்கை 12" }, { id: "opt_b2_36", text: "கோச் B2, இருக்கை 36" }, { id: "opt_c4_18", text: "கோச் C4, இருக்கை 18" }] },
                    'te-IN': { questionText: "అర్జున్‌కి ఏ కోచ్ మరియు సీటు నంబర్ ఉన్నాయి?", options: [{ id: "opt_b3_24", text: "కోచ్ B3, సీటు 24" }, { id: "opt_a1_12", text: "కోచ్ A1, సీటు 12" }, { id: "opt_b2_36", text: "కోచ్ B2, సీటు 36" }, { id: "opt_c4_18", text: "కోచ్ C4, సీటు 18" }] },
                    'kn-IN': { questionText: "ಅರ್ಜುನ್ ಅವರಿಗೆ ಯಾವ ಕೋಚ್ ಮತ್ತು ಸೀಟ್ ಸಂಖ್ಯೆ ಇತ್ತು?", options: [{ id: "opt_b3_24", text: "ಕೋಚ್ B3, ಸೀಟ್ 24" }, { id: "opt_a1_12", text: "ಕೋಚ್ A1, ಸೀಟ್ 12" }, { id: "opt_b2_36", text: "ಕೋಚ್ B2, ಸೀಟ್ 36" }, { id: "opt_c4_18", text: "ಕೋಚ್ C4, ಸೀಟ್ 18" }] },
                    'bn-IN': { questionText: "অর্জুনের কোন কোচ এবং সিট নম্বর ছিল?", options: [{ id: "opt_b3_24", text: "কোচ B3, সিট 24" }, { id: "opt_a1_12", text: "কোচ A1, সিট 12" }, { id: "opt_b2_36", text: "কোচ B2, সিট 36" }, { id: "opt_c4_18", text: "কোচ C4, সিট 18" }] },
                    'mr-IN': { questionText: "अर्जुनचा कोणता डबा आणि सीट नंबर होता?", options: [{ id: "opt_b3_24", text: "डबा B3, सीट 24" }, { id: "opt_a1_12", text: "डबा A1, सीट 12" }, { id: "opt_b2_36", text: "डबा B2, सीट 36" }, { id: "opt_c4_18", text: "डबा C4, सीट 18" }] },
                    'gu-IN': { questionText: "અર્જુનનો કયો કોચ અને સીટ નંબર હતો?", options: [{ id: "opt_b3_24", text: "કોચ B3, સીટ 24" }, { id: "opt_a1_12", text: "કોચ A1, સીટ 12" }, { id: "opt_b2_36", text: "કોચ B2, સીટ 36" }, { id: "opt_c4_18", text: "કોચ C4, સીટ 18" }] }
                }
            },
            {
                id: "q2",
                questionText: "What snack did Arjun share with Uncle Verma?",
                options: [
                    { id: "opt_paratha", text: "Potato parathas" },
                    { id: "opt_samosa", text: "Vegetable samosas" },
                    { id: "opt_sandwich", text: "Cheese sandwiches" },
                    { id: "opt_idli", text: "Steamed idlis" }
                ],
                correctOptionId: "opt_paratha",
                languageContent: {
                    'en-IN': { questionText: "What snack did Arjun share with Uncle Verma?", options: [{ id: "opt_paratha", text: "Potato parathas" }, { id: "opt_samosa", text: "Vegetable samosas" }, { id: "opt_sandwich", text: "Cheese sandwiches" }, { id: "opt_idli", text: "Steamed idlis" }] },
                    'hi-IN': { questionText: "अर्जुन ने अंकल वर्मा के साथ कौन सा नाश्ता साझा किया?", options: [{ id: "opt_paratha", text: "आलू के पराठे" }, { id: "opt_samosa", text: "सब्जी समोसे" }, { id: "opt_sandwich", text: "चीज़ सैंडविच" }, { id: "opt_idli", text: "भाप से बनी इडली" }] },
                    'ta-IN': { questionText: "அர்ஜுன் வர்மா மாமாவுடன் எந்த சிற்றுண்டியைப் பகிர்ந்து கொண்டார்?", options: [{ id: "opt_paratha", text: "உருளைக்கிழங்கு பரோட்டா" }, { id: "opt_samosa", text: "காய்கறி சமோசா" }, { id: "opt_sandwich", text: "சீஸ் சாண்ட்விச்" }, { id: "opt_idli", text: "அவித்த இட்லி" }] },
                    'te-IN': { questionText: "అర్జున్ అంకుల్ వర్మాతో ఏ తినిబండారాన్ని పంచుకున్నాడు?", options: [{ id: "opt_paratha", text: "బంగాళాదుంప పరాటాలు" }, { id: "opt_samosa", text: "కూరగాయల సమోసాలు" }, { id: "opt_sandwich", text: "చీజ్ శాండ్‌విచ్‌లు" }, { id: "opt_idli", text: "ఉడికించిన ఇడ్లీలు" }] },
                    'kn-IN': { questionText: "ಅರ್ಜುನ್ ವರ್ಮಾ ಅಂಕಲ್ ಅವರೊಂದಿಗೆ ಯಾವ ಉಪಹಾರವನ್ನು ಹಂಚಿಕೊಂಡರು?", options: [{ id: "opt_paratha", text: "ಆಲೂ ಪರೋಟ" }, { id: "opt_samosa", text: "ತರಕಾರಿ ಸಮೋಸ" }, { id: "opt_sandwich", text: "ಚೀಸ್ ಸ್ಯಾಂಡ್ವಿಚ್" }, { id: "opt_idli", text: "ಬಿಸಿ ಇಡ್ಲಿ" }] },
                    'bn-IN': { questionText: "অর্জুন আঙ্কেল বর্মার সাথে কী জলখাবার ভাগ করে খেয়েছিলেন?", options: [{ id: "opt_paratha", text: "আলুর পরোটা" }, { id: "opt_samosa", text: "সবজি সিঙ্গাড়া" }, { id: "opt_sandwich", text: "চিজ স্যান্ডউইচ" }, { id: "opt_idli", text: "ভাপা ইডলি" }] },
                    'mr-IN': { questionText: "अर्जुनने अंकल वर्मांसोबत कोणता अल्पोपहार शेअर केला?", options: [{ id: "opt_paratha", text: "आलू पराठे" }, { id: "opt_samosa", text: "भाजी समोसे" }, { id: "opt_sandwich", text: "चीझ सँडविच" }, { id: "opt_idli", text: "वाफवलेल्या इडल्या" }] },
                    'gu-IN': { questionText: "અર્જુને વર્મા અંકલ સાથે કયો નાસ્તો વહેંચ્યો?", options: [{ id: "opt_paratha", text: "આલુ પરોઠા" }, { id: "opt_samosa", text: "શાકભાજી સમોસા" }, { id: "opt_sandwich", text: "ચીઝ સેન્ડવિચ" }, { id: "opt_idli", text: "બાફેલી ઈડલી" }] }
                }
            },
            {
                id: "q3",
                questionText: "What time did the train arrive at Jaipur Junction?",
                options: [
                    { id: "opt_1115", text: "11:15 AM" },
                    { id: "opt_1030", text: "10:30 AM" },
                    { id: "opt_1200", text: "12:00 PM" },
                    { id: "opt_0945", text: "9:45 AM" }
                ],
                correctOptionId: "opt_1115",
                languageContent: {
                    'en-IN': { questionText: "What time did the train arrive at Jaipur Junction?", options: [{ id: "opt_1115", text: "11:15 AM" }, { id: "opt_1030", text: "10:30 AM" }, { id: "opt_1200", text: "12:00 PM" }, { id: "opt_0945", text: "9:45 AM" }] },
                    'hi-IN': { questionText: "ट्रेन जयपुर जंक्शन किस समय पहुंची?", options: [{ id: "opt_1115", text: "सुबह 11:15 बजे" }, { id: "opt_1030", text: "सुबह 10:30 बजे" }, { id: "opt_1200", text: "दोपहर 12:00 बजे" }, { id: "opt_0945", text: "सुबह 9:45 बजे" }] },
                    'ta-IN': { questionText: "ரயில் ஜெய்ப்பூர் சந்திப்பிற்கு எத்தனை மணிக்கு வந்தது?", options: [{ id: "opt_1115", text: "காலை 11:15 மணி" }, { id: "opt_1030", text: "காலை 10:30 மணி" }, { id: "opt_1200", text: "மதியம் 12:00 மணி" }, { id: "opt_0945", text: "காலை 9:45 மணி" }] },
                    'te-IN': { questionText: "రైలు ఏ సమయానికి జైపూర్ జంక్షన్లకు చేరుకుంది?", options: [{ id: "opt_1115", text: "ఉదయం 11:15" }, { id: "opt_1030", text: "ఉదయం 10:30" }, { id: "opt_1200", text: "మధ్యాహ్నం 12:00" }, { id: "opt_0945", text: "ఉదయం 9:45" }] },
                    'kn-IN': { questionText: "ರೈಲು ಜೈಪುರ ಜಂಕ್ಷನ್‌ಗೆ ಎಷ್ಟು ಗಂಟೆಗೆ ತಲುಪಿತು?", options: [{ id: "opt_1115", text: "ಬೆಳಿಗ್ಗೆ 11:15" }, { id: "opt_1030", text: "ಬೆಳಿಗ್ಗೆ 10:30" }, { id: "opt_1200", text: "ಮಧ್ಯಾಹ್ನ 12:00" }, { id: "opt_0945", text: "ಬೆಳಿಗ್ಗೆ 9:45" }] },
                    'bn-IN': { questionText: "ট্রেনটি জয়পুর জংশনে কয়টায় পৌঁছেছিল?", options: [{ id: "opt_1115", text: "সকাল ১১:১৫" }, { id: "opt_1030", text: "সকাল ১০:৩০" }, { id: "opt_1200", text: "দুপুর ১২:০০" }, { id: "opt_0945", text: "সকাল ৯:৪৫" }] },
                    'mr-IN': { questionText: "ट्रेन जयपूर जंक्शनवर किती वाजता पोहोचली?", options: [{ id: "opt_1115", text: "सकाळी ११:१५" }, { id: "opt_1030", text: "सकाळी १०:३०" }, { id: "opt_1200", text: "दुपारी १२:००" }, { id: "opt_0945", text: "सकाळी ९:४५" }] },
                    'gu-IN': { questionText: "ટ્રેન જયપુર જંકશન પર કેટલા વાગ્યે પહોંચી?", options: [{ id: "opt_1115", text: "સવારે 11:15" }, { id: "opt_1030", text: "સવારે 10:30" }, { id: "opt_1200", text: "બપોરે 12:00" }, { id: "opt_0945", text: "સવારે 9:45" }] }
                }
            },
            {
                id: "q4",
                questionText: "Who was waiting for Arjun at the platform?",
                options: [
                    { id: "opt_uncle", text: "His uncle" },
                    { id: "opt_father", text: "His father" },
                    { id: "opt_friend", text: "His college friend" },
                    { id: "opt_cousin", text: "His cousin brother" }
                ],
                correctOptionId: "opt_uncle",
                languageContent: {
                    'en-IN': { questionText: "Who was waiting for Arjun at the platform?", options: [{ id: "opt_uncle", text: "His uncle" }, { id: "opt_father", text: "His father" }, { id: "opt_friend", text: "His college friend" }, { id: "opt_cousin", text: "His cousin brother" }] },
                    'hi-IN': { questionText: "प्लेटफ़ॉर्म पर अर्जुन का इंतज़ार कौन कर रहा था?", options: [{ id: "opt_uncle", text: "उसके चाचा" }, { id: "opt_father", text: "उसके पिता" }, { id: "opt_friend", text: "उसका कॉलेज मित्र" }, { id: "opt_cousin", text: "उसका चचेरा भाई" }] },
                    'ta-IN': { questionText: "தளத்தில் அர்ஜுனுக்காக யார் காத்துக் கொண்டிருந்தார்கள்?", options: [{ id: "opt_uncle", text: "அவரது மாமா" }, { id: "opt_father", text: "அவரது தந்தை" }, { id: "opt_friend", text: "அவரது கல்லூரி நண்பர்" }, { id: "opt_cousin", text: "அவரது உறவினர் சகோதரர்" }] },
                    'te-IN': { questionText: "ప్లాట్‌ఫారమ్‌పై అర్జున్ కోసం ఎవరు ఎదురుచూస్తున్నారు?", options: [{ id: "opt_uncle", text: "అతని మామయ్య" }, { id: "opt_father", text: "అతని తండ్రి" }, { id: "opt_friend", text: "అతని కళాశాల స్నేహితుడు" }, { id: "opt_cousin", text: "అతని బావ" }] },
                    'kn-IN': { questionText: "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ಅರ್ಜುನ್‌ಗಾಗಿ ಯಾರು ಕಾಯುತ್ತಿದ್ದರು?", options: [{ id: "opt_uncle", text: "ಅವನ ಮಾವ" }, { id: "opt_father", text: "ಅವನ ತಂದೆ" }, { id: "opt_friend", text: "ಅವನ ಕಾಲೇಜು ಸ್ನೇಹಿತ" }, { id: "opt_cousin", text: "ಅವನ ಸಹೋದರ" }] },
                    'bn-IN': { questionText: "প্ল্যাটফর্মে অর্জুনের জন্য কে অপেক্ষা করছিলেন?", options: [{ id: "opt_uncle", text: "তার মামা" }, { id: "opt_father", text: "তার বাবা" }, { id: "opt_friend", text: "তার কলেজের বন্ধু" }, { id: "opt_cousin", text: "তার খুরতুতো ভাই" }] },
                    'mr-IN': { questionText: "प्लॅटफॉर्मवर अर्जुनची वाट कोण पाहत होते?", options: [{ id: "opt_uncle", text: "त्यांचे काका" }, { id: "opt_father", text: "त्यांचे वडील" }, { id: "opt_friend", text: "त्याचा कॉलेजचा मित्र" }, { id: "opt_cousin", text: "त्याचा चुलत भाऊ" }] },
                    'gu-IN': { questionText: "પ્લેટફોર્મ પર અર્જુનની રાહ કોણ જોઈ રહ્યું હતું?", options: [{ id: "opt_uncle", text: "તેમના કાકા" }, { id: "opt_father", text: "તેમના પિતા" }, { id: "opt_friend", text: "તેમના કોલેજના મિત્ર" }, { id: "opt_cousin", text: "તેમના પિતરાઈ ભાઈ" }] }
                }
            }
        ]
    },

    // ----------------------------------------------------
    // STORY 3: Hard - The School Science Exhibition
    // ----------------------------------------------------
    {
        id: "story_science_hard",
        title: "The School Science Exhibition",
        difficulty: "hard",
        englishReference: "Ananya won first place at the school science exhibition for her solar water filter. Dr. Sen awarded her a gold trophy and a five thousand rupee scholarship.",
        content: {
            'en-IN': "Ananya won first place at the school science exhibition for her solar water filter. Dr. Sen awarded her a gold trophy and a five thousand rupee scholarship.",
            'hi-IN': "अनन्या ने अपने सोलर वाटर फिल्टर के लिए स्कूल विज्ञान प्रदर्शनी में पहला स्थान हासिल किया। डॉ. सेन ने उन्हें एक स्वर्ण ट्रॉफी और पांच हजार रुपये की छात्रवृत्ति दी।",
            'ta-IN': "அனன்யா தனது சோலார் நீர் சுத்திகரிப்பு சாதனத்திற்காக பள்ளி அறிவியல் கண்காட்சியில் முதல் இடத்தைப் பிடித்தார். டாக்டர் சென் அவருக்கு தங்கக் கோப்பையையும் ஐந்தாயிரம் ரூபாய் உதவித்தொகையையும் வழங்கினார்.",
            'te-IN': "అనన్య తన సోలార్ వాటర్ ఫిల్టర్ కోసం పాఠశాల సైన్స్ ఎగ్జిబిషన్‌లో మొదటి స్థానాన్ని గెలుచుకుంది. డాక్టర్ సేన్ ఆమెకు బంగారు ట్రోఫీ మరియు ఐదు వేల రూపాయల స్కాలర్‌షిప్‌ను అందించారు.",
            'kn-IN': "ಅನನ್ಯಾ ತನ್ನ ಸೌರ ನೀರು ಶುದ್ಧೀಕರಣ ಸಾಧನಕ್ಕಾಗಿ ಶಾಲಾ ವಿಜ್ಞಾನ ಪ್ರದರ್ಶನದಲ್ಲಿ ಪ್ರಥಮ ಸ್ಥಾನ ಪಡೆದಳು. ಡಾ. ಸೇನ್ ಅವಳಿಗೆ ಚಿನ್ನದ ಟ್ರೋಫಿ ಮತ್ತು ಐದು ಸಾವಿರ ರೂಪಾಯಿ ವಿದ್ಯಾರ್ಥಿವೇತನವನ್ನು ನೀಡಿದರು.",
            'bn-IN': "অনন্যা তার সোলার ওয়াটার ফিল্টারের জন্য স্কুল বিজ্ঞান প্রদর্শনীতে প্রথম স্থান অধিকার করেছিল। ডঃ সেন তাকে একটি সোনার ট্রফি এবং পাঁচ হাজার টাকার স্কলারশিপ দিয়েছিলেন।",
            'mr-IN': "अनन्याने तिच्या सोलर वॉटर फिल्टरसाठी शालेय विज्ञान प्रदर्शनात प्रथम क्रमांक पटकावला. डॉ. सेन यांनी तिला सुवर्णचषक आणि पाच हजार रुपयांची शिष्यवृत्ती दिली.",
            'gu-IN': "અનન્યાએ તેના સોલાર વોટર ફિલ્ટર માટે સ્કૂલના વિજ્ઞાન પ્રદર્શનમાં પ્રથમ સ્થાન મેળવ્યું. ડો. સેને તેણીને ગોલ્ડ ટ્રોફી અને પાંચ હજાર રૂપિયાની સ્કોલરશીપ આપી."
        },
        informationUnits: [
            { id: "iu1", description: "Ananya won first place for solar water filter", keywords: ["ananya", "first", "solar", "water", "filter"], weight: 3 },
            { id: "iu2", description: "Dr. Sen awarded gold trophy & 5000 rupees", keywords: ["sen", "trophy", "five thousand", "5000", "scholarship"], weight: 3 }
        ],
        comprehensionQuestions: [
            {
                id: "q1",
                questionText: "What grade was Ananya studying in?",
                options: [
                    { id: "opt_8", text: "Eighth grade" },
                    { id: "opt_10", text: "Tenth grade" },
                    { id: "opt_6", text: "Sixth grade" },
                    { id: "opt_7", text: "Seventh grade" }
                ],
                correctOptionId: "opt_8",
                languageContent: {
                    'en-IN': { questionText: "What grade was Ananya studying in?", options: [{ id: "opt_8", text: "Eighth grade" }, { id: "opt_10", text: "Tenth grade" }, { id: "opt_6", text: "Sixth grade" }, { id: "opt_7", text: "Seventh grade" }] },
                    'hi-IN': { questionText: "अनन्या किस कक्षा में पढ़ रही थी?", options: [{ id: "opt_8", text: "आठवीं कक्षा" }, { id: "opt_10", text: "दसवीं कक्षा" }, { id: "opt_6", text: "छठी कक्षा" }, { id: "opt_7", text: "सातवीं कक्षा" }] },
                    'ta-IN': { questionText: "அனன்யா எந்த வகுப்பில் படித்துக் கொண்டிருந்தார்?", options: [{ id: "opt_8", text: "எட்டாம் வகுப்பு" }, { id: "opt_10", text: "பத்தாம் வகுப்பு" }, { id: "opt_6", text: "ஆறாம் வகுப்பு" }, { id: "opt_7", text: "ஏழாம் வகுப்பு" }] },
                    'te-IN': { questionText: "అనన్య ఏ తరగతి చదువుతోంది?", options: [{ id: "opt_8", text: "ఎనిమిదో తరగతి" }, { id: "opt_10", text: "పదో తరగతి" }, { id: "opt_6", text: "ఆరో తరగతి" }, { id: "opt_7", text: "ఏడో తరగతి" }] },
                    'kn-IN': { questionText: "ಅನನ್ಯಾ ಯಾವ ತರಗತಿಯಲ್ಲಿ ಓದುತ್ತಿದ್ದಳು?", options: [{ id: "opt_8", text: "ಎಂಟನೇ ತರಗತಿ" }, { id: "opt_10", text: "ಹತ್ತನೇ ತರಗತಿ" }, { id: "opt_6", text: "ಆರನೇ ತರಗತಿ" }, { id: "opt_7", text: "ಏಳನೇ ತರಗತಿ" }] },
                    'bn-IN': { questionText: "অনন্যা কোন শ্রেণীতে পড়াশোনা করছিল?", options: [{ id: "opt_8", text: "অষ্টম শ্রেণী" }, { id: "opt_10", text: "দশম শ্রেণী" }, { id: "opt_6", text: "ষষ্ঠ শ্রেণী" }, { id: "opt_7", text: "সপ্তম শ্রেণী" }] },
                    'mr-IN': { questionText: "अनन्या कोणत्या इयत्तेत शिकत होती?", options: [{ id: "opt_8", text: "आठवी इयत्ता" }, { id: "opt_10", text: "दहावी इयत्ता" }, { id: "opt_6", text: "सहावी इयत्ता" }, { id: "opt_7", text: "सातवी इयत्ता" }] },
                    'gu-IN': { questionText: "અનન્યા કયા ધોરણમાં ભણતી હતી?", options: [{ id: "opt_8", text: "આઠમું ધોરણ" }, { id: "opt_10", text: "દસમું ધોરણ" }, { id: "opt_6", text: "છઠ્ઠું ધોરણ" }, { id: "opt_7", text: "સાતમું ધોરણ" }] }
                }
            },
            {
                id: "q2",
                questionText: "Who led the judging panel for the science fair?",
                options: [
                    { id: "opt_sen", text: "Chief Engineer Dr. Sen" },
                    { id: "opt_patel", text: "Principal Dr. Patel" },
                    { id: "opt_roy", text: "Professor Roy" },
                    { id: "opt_gupta", text: "Scientist Dr. Gupta" }
                ],
                correctOptionId: "opt_sen",
                languageContent: {
                    'en-IN': { questionText: "Who led the judging panel for the science fair?", options: [{ id: "opt_sen", text: "Chief Engineer Dr. Sen" }, { id: "opt_patel", text: "Principal Dr. Patel" }, { id: "opt_roy", text: "Professor Roy" }, { id: "opt_gupta", text: "Scientist Dr. Gupta" }] },
                    'hi-IN': { questionText: "विज्ञान मेले के लिए निर्णायक मंडल का नेतृत्व किसने किया?", options: [{ id: "opt_sen", text: "मुख्य इंजीनियर डॉ. सेन" }, { id: "opt_patel", text: "प्रिंसिपल डॉ. पटेल" }, { id: "opt_roy", text: "प्रोफेसर रॉय" }, { id: "opt_gupta", text: "वैज्ञानिक डॉ. गुप्ता" }] },
                    'ta-IN': { questionText: "அறிவியல் கண்காட்சிக்கான நடுவர் குழுவிற்கு யார் தலைமை தாங்கினார்?", options: [{ id: "opt_sen", text: "தலைமைப் பொறியாளர் டாக்டர் சென்" }, { id: "opt_patel", text: "முதல்வர் டாக்டர் படேல்" }, { id: "opt_roy", text: "பேராசிரியர் ராய்" }, { id: "opt_gupta", text: "விஞ்ஞானி டாக்டர் குப்தா" }] },
                    'te-IN': { questionText: "సైన్స్ ఫెయిర్‌కు న్యాయనిర్ణేతల బృందానికి ఎవరు నాయకత్వం వహించారు?", options: [{ id: "opt_sen", text: "చీఫ్ ఇంజనీర్ డాక్టర్ సేన్" }, { id: "opt_patel", text: "ప్రిన్సిపాల్ డాక్టర్ పటేల్" }, { id: "opt_roy", text: "ప్రొఫెసర్ రాయ్" }, { id: "opt_gupta", text: "శాస్త్రవేత్త డాక్టర్ గుప్తా" }] },
                    'kn-IN': { questionText: "ವಿಜ್ಞಾನ ಮೇಳದ ತೀರ್ಪುಗಾರರ ತಂಡದ ನೇತೃತ್ವವನ್ನು ಯಾರು ವಹಿಸಿದ್ದರು?", options: [{ id: "opt_sen", text: "ಮುಖ್ಯ ಎಂಜಿನಿಯರ್ ಡಾ. ಸೇನ್" }, { id: "opt_patel", text: "ಪ್ರಾಂಶುಪಾಲ ಡಾ. ಪಟೇಲ್" }, { id: "opt_roy", text: "ಪ್ರೊಫೆಸರ್ ರಾಯ್" }, { id: "opt_gupta", text: "ವಿಜ್ಞಾನಿ ಡಾ. ಗುಪ್ತಾ" }] },
                    'bn-IN': { questionText: "বিজ্ঞান মেলায় বিচারক প্যানেলের নেতৃত্ব কে দিয়েছিলেন?", options: [{ id: "opt_sen", text: "প্রধান প্রকৌশলী ডঃ সেন" }, { id: "opt_patel", text: "প্রিন্সিপাল ডঃ প্যাটেল" }, { id: "opt_roy", text: "অধ্যাপক রায়" }, { id: "opt_gupta", text: "বিজ্ঞানী ডঃ গুপ্তা" }] },
                    'mr-IN': { questionText: "विज्ञान प्रदर्शनाच्या परीक्षक समितीचे नेतृत्व कोणी केले?", options: [{ id: "opt_sen", text: "मुख्य अभियंता डॉ. सेन" }, { id: "opt_patel", text: "प्राचार्य डॉ. पटेल" }, { id: "opt_roy", text: "प्राध्यापक रॉय" }, { id: "opt_gupta", text: "शास्त्रज्ञ डॉ. गुप्ता" }] },
                    'gu-IN': { questionText: "વિજ્ઞાન મેળા માટે જજિંગ પેનલનું નેતૃત્વ કોણે કર્યું?", options: [{ id: "opt_sen", text: "મુખ્ય ઈજનેર ડો. સેન" }, { id: "opt_patel", text: "પ્રિન્સિપાલ ડો. પટેલ" }, { id: "opt_roy", text: "પ્રોફેસર રોય" }, { id: "opt_gupta", text: "વૈજ્ઞાનિક ડો. ગુપ્તા" }] }
                }
            },
            {
                id: "q3",
                questionText: "What materials were used in the water filtration device?",
                options: [
                    { id: "opt_sand_charcoal", text: "Sand, charcoal, and UV solar panels" },
                    { id: "opt_paper_cotton", text: "Filter paper, cotton, and mesh" },
                    { id: "opt_gravel_clay", text: "Gravel, clay, and silver foil" },
                    { id: "opt_plastic_sponge", text: "Plastic beads and sponge" }
                ],
                correctOptionId: "opt_sand_charcoal",
                languageContent: {
                    'en-IN': { questionText: "What materials were used in the water filtration device?", options: [{ id: "opt_sand_charcoal", text: "Sand, charcoal, and UV solar panels" }, { id: "opt_paper_cotton", text: "Filter paper, cotton, and mesh" }, { id: "opt_gravel_clay", text: "Gravel, clay, and silver foil" }, { id: "opt_plastic_sponge", text: "Plastic beads and sponge" }] },
                    'hi-IN': { questionText: "पानी छानने के उपकरण में किन सामग्रियों का उपयोग किया गया था?", options: [{ id: "opt_sand_charcoal", text: "रेत, कोयला और यूवी सोलर पैनल" }, { id: "opt_paper_cotton", text: "फिल्टर पेपर, कपास और जाल" }, { id: "opt_gravel_clay", text: "बजरी, मिट्टी और चांदी की पन्नी" }, { id: "opt_plastic_sponge", text: "प्लास्टिक के मोती और स्पंज" }] },
                    'ta-IN': { questionText: "நீர் சுத்திகரிப்பு சாதனத்தில் என்ன பொருட்கள் பயன்படுத்தப்பட்டன?", options: [{ id: "opt_sand_charcoal", text: "மணல், நிலக்கரி மற்றும் புறஊதா சோலார் பேனல்கள்" }, { id: "opt_paper_cotton", text: "வடிகட்டி காகிதம், பருத்தி மற்றும் வலை" }, { id: "opt_gravel_clay", text: "ஜல்லி, களிமண் மற்றும் வெள்ளிப் படலம்" }, { id: "opt_plastic_sponge", text: "பிளாஸ்டிக் மணிகள் மற்றும் பஞ்சு" }] },
                    'te-IN': { questionText: "నీటి శుద్ధి పరికరంలో ఏ పదార్థాలను ఉపయోగించారు?", options: [{ id: "opt_sand_charcoal", text: "ఇసుక, బొగ్గు మరియు సోలార్ ప్యానెళ్లు" }, { id: "opt_paper_cotton", text: "ఫిల్టర్ పేపర్, పత్తి మరియు జల్లెడ" }, { id: "opt_gravel_clay", text: "రాళ్ళు, మట్టి మరియు వెండి రేకు" }, { id: "opt_plastic_sponge", text: "ప్లాస్టిక్ పూసలు మరియు స్పాంజ్" }] },
                    'kn-IN': { questionText: "ನೀರು ಶುದ್ಧೀಕರಣ ಸಾಧನದಲ್ಲಿ ಯಾವ ವಸ್ತುಗಳನ್ನು ಬಳಸಲಾಗಿತ್ತು?", options: [{ id: "opt_sand_charcoal", text: "ಮರಳು, ಇದ್ದಿಲು ಮತ್ತು ಸೌರ ಫಲಕಗಳು" }, { id: "opt_paper_cotton", text: "ಫಿಲ್ಟರ್ ಪೇಪರ್, ಹತ್ತಿ ಮತ್ತು ಬಲೆ" }, { id: "opt_gravel_clay", text: "ಕಲ್ಲು, ಜೇಡಿಮಣ್ಣು ಮತ್ತು ಬೆಳ್ಳಿ ಫಾಯಿಲ್" }, { id: "opt_plastic_sponge", text: "ಪ್ಲಾಸ್ಟಿಕ್ ಮಣಿಗಳು ಮತ್ತು ಸ್ಪಾಂಜ್" }] },
                    'bn-IN': { questionText: "জল পরিশ্রুতকরণ যন্ত্রে কী কী উপাদান ব্যবহার করা হয়েছিল?", options: [{ id: "opt_sand_charcoal", text: "বালি, কয়লা এবং সোলার প্যানেল" }, { id: "opt_paper_cotton", text: "ফিল্টার পেপার, তুলা এবং নেট" }, { id: "opt_gravel_clay", text: "নুড়ি, কাদা এবং রুপোর ফয়েল" }, { id: "opt_plastic_sponge", text: "প্লাস্টিকের পুঁতি এবং স্পঞ্জ" }] },
                    'mr-IN': { questionText: "पाणी शुद्धीकरण यंत्रात कोणते साहित्य वापरले होते?", options: [{ id: "opt_sand_charcoal", text: "वाळू, कोळसा आणि सोलर पॅनेल" }, { id: "opt_paper_cotton", text: "फिल्टर कागद, कापूस आणि जाळी" }, { id: "opt_gravel_clay", text: "खडी, माती आणि चांदीचे फॉइल" }, { id: "opt_plastic_sponge", text: "प्लास्टिक मणी आणि स्पंज" }] },
                    'gu-IN': { questionText: "પાણી શુદ્ધિકરણ ઉપકરણમાં કઈ સામગ્રીનો ઉપયોગ કરવામાં આવ્યો હતો?", options: [{ id: "opt_sand_charcoal", text: "રેતી, કોલસો અને સોલાર પેનલ" }, { id: "opt_paper_cotton", text: "ફિલ્ટર પેપર, કપાસ અને જાળી" }, { id: "opt_gravel_clay", text: "કાંકરી, માટી અને સિલ્વર ફોઇલ" }, { id: "opt_plastic_sponge", text: "પ્લાસ્ટિકના મણકા અને સ્પોન્જ" }] }
                }
            },
            {
                id: "q4",
                questionText: "What was the cash prize amount awarded to Ananya?",
                options: [
                    { id: "opt_5000", text: "Five thousand rupees" },
                    { id: "opt_10000", text: "Ten thousand rupees" },
                    { id: "opt_2500", text: "Two thousand five hundred rupees" },
                    { id: "opt_1000", text: "One thousand rupees" }
                ],
                correctOptionId: "opt_5000",
                languageContent: {
                    'en-IN': { questionText: "What was the cash prize amount awarded to Ananya?", options: [{ id: "opt_5000", text: "Five thousand rupees" }, { id: "opt_10000", text: "Ten thousand rupees" }, { id: "opt_2500", text: "Two thousand five hundred rupees" }, { id: "opt_1000", text: "One thousand rupees" }] },
                    'hi-IN': { questionText: "अनन्या को पुरस्कार में कितनी नकद राशि दी गई?", options: [{ id: "opt_5000", text: "पांच हजार रुपये" }, { id: "opt_10000", text: "दस हजार रुपये" }, { id: "opt_2500", text: "ढाई हजार रुपये" }, { id: "opt_1000", text: "एक हजार रुपये" }] },
                    'ta-IN': { questionText: "அனன்யாவுக்கு வழங்கப்பட்ட ரொக்கப் பரிசுத் தொகை எவ்வளவு?", options: [{ id: "opt_5000", text: "ஐந்தாயிரம் ரூபாய்" }, { id: "opt_10000", text: "பத்தாயிரம் ரூபாய்" }, { id: "opt_2500", text: "இரண்டாயிரத்து ஐந்நூறு ரூபாய்" }, { id: "opt_1000", text: "ஆயிரம் ரூபாய்" }] },
                    'te-IN': { questionText: "అనన్యకు ఎంత నగదు బహుమతి అందించబడింది?", options: [{ id: "opt_5000", text: "ఐదు వేల రూపాయలు" }, { id: "opt_10000", text: "పది వేల రూపాయలు" }, { id: "opt_2500", text: "రెండు వేల ఐదు వందల రూపాయలు" }, { id: "opt_1000", text: "వెయ్యి రూపాయలు" }] },
                    'kn-IN': { questionText: "ಅನನ್ಯಾಗೆ ನೀಡಲಾದ ನಗದು ಬಹುಮಾನದ ಮೊತ್ತ ಎಷ್ಟು?", options: [{ id: "opt_5000", text: "ಐದು ಸಾವಿರ ರೂಪಾಯಿ" }, { id: "opt_10000", text: "ಹತ್ತು ಸಾವಿರ ರೂಪಾಯಿ" }, { id: "opt_2500", text: "ಎರಡು ಸಾವಿರದ ಐನೂರು ರೂಪಾಯಿ" }, { id: "opt_1000", text: "ಒಂದು ಸಾವಿರ ರೂಪಾಯಿ" }] },
                    'bn-IN': { questionText: "অনন্যাকে কত টাকা নগদ পুরস্কার দেওয়া হয়েছিল?", options: [{ id: "opt_5000", text: "পাঁচ হাজার টাকা" }, { id: "opt_10000", text: "দশ হাজার টাকা" }, { id: "opt_2500", text: "আড়াই হাজার টাকা" }, { id: "opt_1000", text: "এক হাজার টাকা" }] },
                    'mr-IN': { questionText: "अनन्याला किती रोख पारितोषिक देण्यात आले?", options: [{ id: "opt_5000", text: "पाच हजार रुपये" }, { id: "opt_10000", text: "दहा हजार रुपये" }, { id: "opt_2500", text: "अडीच हजार रुपये" }, { id: "opt_1000", text: "एक हजार रुपये" }] },
                    'gu-IN': { questionText: "અનન્યાને કેટલી રોકડ ઈનામ રકમ આપવામાં આવી હતી?", options: [{ id: "opt_5000", text: "પાંચ હજાર રૂપિયા" }, { id: "opt_10000", text: "દસ હજાર રૂપિયા" }, { id: "opt_2500", text: "અઢી હજાર રૂપિયા" }, { id: "opt_1000", text: "એક હજાર રૂપિયા" }] }
                }
            }
        ]
    }
];

export function getStoryById(id: string): Story | undefined {
    return STORIES.find(s => s.id === id);
}

export function getRandomStory(difficulty?: 'easy' | 'medium' | 'hard'): Story {
    const pool = difficulty ? STORIES.filter(s => s.difficulty === difficulty) : STORIES;
    return pool[Math.floor(Math.random() * pool.length)];
}
