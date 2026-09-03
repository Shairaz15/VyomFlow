/**
 * Motivational Quotes Data & Utilities
 * 
 * Curated growth-mindset, perseverance, resilience, and wisdom quotes from real people
 * across history designed to encourage participants when receiving lower cognitive assessment scores.
 * 
 * Contains exactly 100 quotes from historical figures, philosophers, scientists, authors,
 * leaders, artists, and pioneers.
 * 
 * Strictly no emojis used.
 */

export interface MotivationalQuote {
    id: string;
    text: string;
    author: string;
    sourceOrTheme?: string;
}

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
    {
        id: "quote-1",
        text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill",
        sourceOrTheme: "Perseverance",
    },
    {
        id: "quote-2",
        text: "You may encounter many defeats, but you must not be defeated.",
        author: "Maya Angelou",
        sourceOrTheme: "Resilience",
    },
    {
        id: "quote-3",
        text: "In the middle of difficulty lies opportunity.",
        author: "Albert Einstein",
        sourceOrTheme: "Opportunity",
    },
    {
        id: "quote-4",
        text: "It does not matter how slowly you go as long as you do not stop.",
        author: "Confucius",
        sourceOrTheme: "Consistency",
    },
    {
        id: "quote-5",
        text: "Character cannot be developed in ease and quiet. Only through experience of trial and suffering can the soul be strengthened.",
        author: "Helen Keller",
        sourceOrTheme: "Strength",
    },
    {
        id: "quote-6",
        text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
        author: "Nelson Mandela",
        sourceOrTheme: "Determination",
    },
    {
        id: "quote-7",
        text: "Believe you can and you are halfway there.",
        author: "Theodore Roosevelt",
        sourceOrTheme: "Self-Belief",
    },
    {
        id: "quote-8",
        text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
        author: "Ralph Waldo Emerson",
        sourceOrTheme: "Inner Potential",
    },
    {
        id: "quote-9",
        text: "The impediment to action advances action. What stands in the way becomes the way.",
        author: "Marcus Aurelius",
        sourceOrTheme: "Stoicism",
    },
    {
        id: "quote-10",
        text: "Life is not easy for any of us. But what of that? We must have perseverance and above all confidence in ourselves.",
        author: "Marie Curie",
        sourceOrTheme: "Perseverance",
    },
    {
        id: "quote-11",
        text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
        author: "Aristotle",
        sourceOrTheme: "Habit & Practice",
    },
    {
        id: "quote-12",
        text: "Great things are done by a series of small things brought together.",
        author: "Vincent van Gogh",
        sourceOrTheme: "Patience",
    },
    {
        id: "quote-13",
        text: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt",
        sourceOrTheme: "Vision",
    },
    {
        id: "quote-14",
        text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.",
        author: "Thomas Edison",
        sourceOrTheme: "Tenacity",
    },
    {
        id: "quote-15",
        text: "Whether you think you can, or you think you cannot, you are right.",
        author: "Henry Ford",
        sourceOrTheme: "Mindset",
    },
    {
        id: "quote-16",
        text: "A journey of a thousand miles begins with a single step.",
        author: "Lao Tzu",
        sourceOrTheme: "Beginning",
    },
    {
        id: "quote-17",
        text: "It is not what happens to you, but how you react to it that matters.",
        author: "Epictetus",
        sourceOrTheme: "Adaptability",
    },
    {
        id: "quote-18",
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs",
        sourceOrTheme: "Passion",
    },
    {
        id: "quote-19",
        text: "When we are no longer able to change a situation, we are challenged to change ourselves.",
        author: "Viktor Frankl",
        sourceOrTheme: "Growth Mindset",
    },
    {
        id: "quote-20",
        text: "I am a slow walker, but I never walk back.",
        author: "Abraham Lincoln",
        sourceOrTheme: "Forward Motion",
    },
    {
        id: "quote-21",
        text: "Do not pray for an easy life, pray for the strength to endure a difficult one.",
        author: "Bruce Lee",
        sourceOrTheme: "Endurance",
    },
    {
        id: "quote-22",
        text: "Knowing is not enough; we must apply. Willing is not enough; we must do.",
        author: "Johann Wolfgang von Goethe",
        sourceOrTheme: "Action",
    },
    {
        id: "quote-23",
        text: "Difficulties strengthen the mind, as labor does the body.",
        author: "Seneca",
        sourceOrTheme: "Neuroplasticity",
    },
    {
        id: "quote-24",
        text: "However difficult life may seem, there is always something you can do and succeed at.",
        author: "Stephen Hawking",
        sourceOrTheme: "Possibility",
    },
    {
        id: "quote-25",
        text: "People of accomplishment rarely sat back and let things happen to them. They went out and happened to things.",
        author: "Leonardo da Vinci",
        sourceOrTheme: "Initiative",
    },
    {
        id: "quote-26",
        text: "Somewhere, something incredible is waiting to be known.",
        author: "Carl Sagan",
        sourceOrTheme: "Curiosity",
    },
    {
        id: "quote-27",
        text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
        author: "Mahatma Gandhi",
        sourceOrTheme: "Lifelong Learning",
    },
    {
        id: "quote-28",
        text: "Mystery creates wonder and wonder is the basis of human desire to understand.",
        author: "Neil Armstrong",
        sourceOrTheme: "Exploration",
    },
    {
        id: "quote-29",
        text: "What you do makes a difference, and you have to decide what kind of difference you want to make.",
        author: "Jane Goodall",
        sourceOrTheme: "Purpose",
    },
    {
        id: "quote-30",
        text: "It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.",
        author: "Charles Darwin",
        sourceOrTheme: "Adaptability",
    },
    {
        id: "quote-31",
        text: "If you cannot fly then run, if you cannot run then walk, if you cannot walk then crawl, but whatever you do you have to keep moving forward.",
        author: "Martin Luther King Jr.",
        sourceOrTheme: "Perseverance",
    },
    {
        id: "quote-32",
        text: "How wonderful it is that nobody need wait a single moment before starting to improve the world.",
        author: "Anne Frank",
        sourceOrTheme: "Optimism",
    },
    {
        id: "quote-33",
        text: "He who has a why to live can bear almost any how.",
        author: "Friedrich Nietzsche",
        sourceOrTheme: "Purpose",
    },
    {
        id: "quote-34",
        text: "Sometimes it is the people no one imagines anything of who do the things that no one can imagine.",
        author: "Alan Turing",
        sourceOrTheme: "Potential",
    },
    {
        id: "quote-35",
        text: "The power of imagination makes us infinite.",
        author: "John Muir",
        sourceOrTheme: "Imagination",
    },
    {
        id: "quote-36",
        text: "That brain of mine is something more than merely mortal; as time will show.",
        author: "Ada Lovelace",
        sourceOrTheme: "Intellect",
    },
    {
        id: "quote-37",
        text: "It is our attitude at the beginning of a difficult task which, more than anything else, will affect its successful outcome.",
        author: "William James",
        sourceOrTheme: "Focus",
    },
    {
        id: "quote-38",
        text: "I attribute my success to this: I never gave or took any excuse.",
        author: "Florence Nightingale",
        sourceOrTheme: "Accountability",
    },
    {
        id: "quote-39",
        text: "It is never too late to be what you might have been.",
        author: "George Eliot",
        sourceOrTheme: "Renewal",
    },
    {
        id: "quote-40",
        text: "Out of suffering have emerged the strongest souls; the most massive characters are seared with scars.",
        author: "Khalil Gibran",
        sourceOrTheme: "Resilience",
    },
    {
        id: "quote-41",
        text: "Do not grieve. Anything you lose comes round in another form.",
        author: "Rumi",
        sourceOrTheme: "Perspective",
    },
    {
        id: "quote-42",
        text: "You cannot cross the sea merely by standing and staring at the water.",
        author: "Rabindranath Tagore",
        sourceOrTheme: "Action",
    },
    {
        id: "quote-43",
        text: "Arise, awake, and stop not until the goal is reached.",
        author: "Swami Vivekananda",
        sourceOrTheme: "Focus",
    },
    {
        id: "quote-44",
        text: "You cannot change your future, but you can change your habits, and surely your habits will change your future.",
        author: "A. P. J. Abdul Kalam",
        sourceOrTheme: "Habit & Growth",
    },
    {
        id: "quote-45",
        text: "The only true wisdom is in knowing you know nothing.",
        author: "Socrates",
        sourceOrTheme: "Humility & Learning",
    },
    {
        id: "quote-46",
        text: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
        sourceOrTheme: "Initiative",
    },
    {
        id: "quote-47",
        text: "All our dreams can come true, if we have the courage to pursue them.",
        author: "Walt Disney",
        sourceOrTheme: "Courage",
    },
    {
        id: "quote-48",
        text: "Energy and persistence conquer all things.",
        author: "Benjamin Franklin",
        sourceOrTheme: "Persistence",
    },
    {
        id: "quote-49",
        text: "You measure the size of the accomplishment by the obstacles you had to overcome to reach your goals.",
        author: "Booker T. Washington",
        sourceOrTheme: "Overcoming",
    },
    {
        id: "quote-50",
        text: "I have learned over the years that when one's mind is made up, this diminishes fear.",
        author: "Rosa Parks",
        sourceOrTheme: "Courage",
    },
    {
        id: "quote-51",
        text: "We are part of this universe; we are in this universe, but perhaps more important is that the universe is in us.",
        author: "Neil deGrasse Tyson",
        sourceOrTheme: "Perspective",
    },
    {
        id: "quote-52",
        text: "The most difficult thing is the decision to act, the rest is merely tenacity.",
        author: "Amelia Earhart",
        sourceOrTheme: "Tenacity",
    },
    {
        id: "quote-53",
        text: "You are never too old to set another goal or to dream a new dream.",
        author: "C. S. Lewis",
        sourceOrTheme: "Growth Mindset",
    },
    {
        id: "quote-54",
        text: "Knowledge is power.",
        author: "Francis Bacon",
        sourceOrTheme: "Knowledge",
    },
    {
        id: "quote-55",
        text: "When one door closes, another opens; but we often look so long and so regretfully upon the closed door that we do not see the one which has opened for us.",
        author: "Alexander Graham Bell",
        sourceOrTheme: "Opportunity",
    },
    {
        id: "quote-56",
        text: "Where there is no vision, there is no hope.",
        author: "George Washington Carver",
        sourceOrTheme: "Vision",
    },
    {
        id: "quote-57",
        text: "I am not afraid of storms, for I am learning how to sail my ship.",
        author: "Louisa May Alcott",
        sourceOrTheme: "Confidence",
    },
    {
        id: "quote-58",
        text: "Have a heart that never hardens, and a temper that never tires, and a touch that never hurts.",
        author: "Charles Dickens",
        sourceOrTheme: "Equanimity",
    },
    {
        id: "quote-59",
        text: "Opportunities multiply as they are seized.",
        author: "Sun Tzu",
        sourceOrTheme: "Readiness",
    },
    {
        id: "quote-60",
        text: "The beginning is the most important part of the work.",
        author: "Plato",
        sourceOrTheme: "Beginning",
    },
    {
        id: "quote-61",
        text: "Start where you are. Use what you have. Do what you can.",
        author: "Arthur Ashe",
        sourceOrTheme: "Resourcefulness",
    },
    {
        id: "quote-62",
        text: "Every great dream begins with a dreamer. Always remember, you have within you the strength, the patience, and the passion to reach for the stars.",
        author: "Harriet Tubman",
        sourceOrTheme: "Inner Strength",
    },
    {
        id: "quote-63",
        text: "If I have seen further, it is by standing on the shoulders of giants.",
        author: "Isaac Newton",
        sourceOrTheme: "Wisdom",
    },
    {
        id: "quote-64",
        text: "You cannot teach a person anything; you can only help them find it within themselves.",
        author: "Galileo Galilei",
        sourceOrTheme: "Self-Discovery",
    },
    {
        id: "quote-65",
        text: "Chance favors only the prepared mind.",
        author: "Louis Pasteur",
        sourceOrTheme: "Preparation",
    },
    {
        id: "quote-66",
        text: "The best way out is always through.",
        author: "Robert Frost",
        sourceOrTheme: "Endurance",
    },
    {
        id: "quote-67",
        text: "Hope is the thing with feathers that perches in the soul.",
        author: "Emily Dickinson",
        sourceOrTheme: "Hope",
    },
    {
        id: "quote-68",
        text: "Go confidently in the direction of your dreams. Live the life you have imagined.",
        author: "Henry David Thoreau",
        sourceOrTheme: "Courage",
    },
    {
        id: "quote-69",
        text: "We choose to do hard things not because they are easy, but because they are hard.",
        author: "John F. Kennedy",
        sourceOrTheme: "Challenge",
    },
    {
        id: "quote-70",
        text: "One child, one teacher, one book, and one pen can change the world.",
        author: "Malala Yousafzai",
        sourceOrTheme: "Education",
    },
    {
        id: "quote-71",
        text: "Hope is being able to see that there is light despite all of the darkness.",
        author: "Desmond Tutu",
        sourceOrTheme: "Hope",
    },
    {
        id: "quote-72",
        text: "Some of us think holding on makes us strong, but sometimes it is letting go.",
        author: "Hermann Hesse",
        sourceOrTheme: "Adaptability",
    },
    {
        id: "quote-73",
        text: "Peace is not an absence of war, it is a virtue, a state of mind, a disposition for benevolence, confidence, justice.",
        author: "Baruch Spinoza",
        sourceOrTheme: "Calm Focus",
    },
    {
        id: "quote-74",
        text: "Beware; for I am fearless, and therefore powerful.",
        author: "Mary Shelley",
        sourceOrTheme: "Bravery",
    },
    {
        id: "quote-75",
        text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.",
        author: "James Baldwin",
        sourceOrTheme: "Clarity",
    },
    {
        id: "quote-76",
        text: "The only defense against the world is a thorough knowledge of it.",
        author: "John Locke",
        sourceOrTheme: "Knowledge",
    },
    {
        id: "quote-77",
        text: "You have to build calluses on your brain just like how you build calluses on your hands.",
        author: "David Goggins",
        sourceOrTheme: "Mental Toughness",
    },
    {
        id: "quote-78",
        text: "Becoming is better than being. The fixed mindset does not allow people the luxury of becoming.",
        author: "Carol Dweck",
        sourceOrTheme: "Growth Mindset",
    },
    {
        id: "quote-79",
        text: "I have failed over and over and over again in my life. And that is why I succeed.",
        author: "Michael Jordan",
        sourceOrTheme: "Resilience",
    },
    {
        id: "quote-80",
        text: "A champion is defined not by their wins but by how they can recover when they fall.",
        author: "Serena Williams",
        sourceOrTheme: "Recovery",
    },
    {
        id: "quote-81",
        text: "The person who can drive themselves further once the effort gets painful is the person who will win.",
        author: "Roger Bannister",
        sourceOrTheme: "Drive",
    },
    {
        id: "quote-82",
        text: "Do not count the days, make the days count.",
        author: "Muhammad Ali",
        sourceOrTheme: "Dedication",
    },
    {
        id: "quote-83",
        text: "The most important thing is to try and inspire people so that they can be great in whatever they want to do.",
        author: "Kobe Bryant",
        sourceOrTheme: "Inspiration",
    },
    {
        id: "quote-84",
        text: "I would rather regret the risks that did not work out than the chances I did not take at all.",
        author: "Simone Biles",
        sourceOrTheme: "Courage",
    },
    {
        id: "quote-85",
        text: "I trained four years to run nine seconds, and people give up when they do not see results in two months.",
        author: "Usain Bolt",
        sourceOrTheme: "Long-term Focus",
    },
    {
        id: "quote-86",
        text: "I admire work, dedication, and competence.",
        author: "Ayrton Senna",
        sourceOrTheme: "Competence",
    },
    {
        id: "quote-87",
        text: "I was born not knowing and have had only a little time to change that here and there.",
        author: "Richard Feynman",
        sourceOrTheme: "Curiosity",
    },
    {
        id: "quote-88",
        text: "The present is theirs; the future, for which I really worked, is mine.",
        author: "Nikola Tesla",
        sourceOrTheme: "Vision",
    },
    {
        id: "quote-89",
        text: "Kind words do not cost much. Yet they accomplish much.",
        author: "Blaise Pascal",
        sourceOrTheme: "Grace",
    },
    {
        id: "quote-90",
        text: "It is not enough to have a good mind; the main thing is to use it well.",
        author: "René Descartes",
        sourceOrTheme: "Mind Application",
    },
    {
        id: "quote-91",
        text: "Science is organized knowledge. Wisdom is organized life.",
        author: "Immanuel Kant",
        sourceOrTheme: "Wisdom",
    },
    {
        id: "quote-92",
        text: "A wise person proportions their belief to the evidence.",
        author: "David Hume",
        sourceOrTheme: "Critical Thinking",
    },
    {
        id: "quote-93",
        text: "One person with a belief is equal to a force of ninety-nine who have only interests.",
        author: "John Stuart Mill",
        sourceOrTheme: "Conviction",
    },
    {
        id: "quote-94",
        text: "The greatest challenge to any thinker is stating the problem in a way that will allow a solution.",
        author: "Bertrand Russell",
        sourceOrTheme: "Problem Solving",
    },
    {
        id: "quote-95",
        text: "I am not what happened to me, I am what I choose to become.",
        author: "Carl Jung",
        sourceOrTheme: "Self-Actualization",
    },
    {
        id: "quote-96",
        text: "Out of your vulnerabilities will come your strength.",
        author: "Sigmund Freud",
        sourceOrTheme: "Inner Strength",
    },
    {
        id: "quote-97",
        text: "It is not in the stars to hold our destiny but in ourselves.",
        author: "William Shakespeare",
        sourceOrTheme: "Agency",
    },
    {
        id: "quote-98",
        text: "The two most powerful warriors are patience and time.",
        author: "Leo Tolstoy",
        sourceOrTheme: "Patience",
    },
    {
        id: "quote-99",
        text: "It takes something more than intelligence to act intelligently.",
        author: "Fyodor Dostoevsky",
        sourceOrTheme: "Wisdom",
    },
    {
        id: "quote-100",
        text: "Even the darkest night will end and the sun will rise.",
        author: "Victor Hugo",
        sourceOrTheme: "Optimism",
    },
];

/**
 * Standardized helper to determine if a performance score meets the threshold for a low score.
 */
export function isLowScore(params: {
    category?: string | null;
    score?: number | null;
    starRating?: number | null;
}): boolean {
    const { category, score, starRating } = params;

    // Check performance category string
    if (category) {
        const normalized = category.toLowerCase().trim();
        if (
            normalized.includes("needs attention") ||
            normalized.includes("below average") ||
            normalized.includes("attention advised") ||
            normalized.includes("possible_risk") ||
            normalized.includes("high risk") ||
            normalized.includes("impaired") ||
            normalized.includes("slow") ||
            normalized.includes("delayed")
        ) {
            return true;
        }
    }

    // Check star rating (<= 2 stars out of 5)
    if (typeof starRating === "number" && starRating > 0 && starRating <= 2) {
        return true;
    }

    // Check numerical percentage or composite score (< 60%)
    if (typeof score === "number" && score < 60) {
        return true;
    }

    return false;
}

/**
 * Returns a motivational quote, selecting either randomly or deterministically by index/seed.
 */
export function getMotivationalQuote(seed?: number | string): MotivationalQuote {
    if (MOTIVATIONAL_QUOTES.length === 0) {
        return {
            id: "fallback",
            text: "Every session is a positive step toward cognitive awareness and growth.",
            author: "VyomFlow",
            sourceOrTheme: "Awareness",
        };
    }

    if (seed !== undefined) {
        let numericSeed = 0;
        if (typeof seed === "number") {
            numericSeed = Math.abs(Math.floor(seed));
        } else {
            for (let i = 0; i < seed.length; i++) {
                numericSeed = (numericSeed << 5) - numericSeed + seed.charCodeAt(i);
                numericSeed |= 0;
            }
            numericSeed = Math.abs(numericSeed);
        }
        return MOTIVATIONAL_QUOTES[numericSeed % MOTIVATIONAL_QUOTES.length];
    }

    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    return MOTIVATIONAL_QUOTES[randomIndex];
}
