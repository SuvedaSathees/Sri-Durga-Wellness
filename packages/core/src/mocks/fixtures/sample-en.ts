/**
 * Development sample data served by the mock backend. Every record is flagged `isSample: true`;
 * the real backend replaces all of it with clinic-approved details before launch.
 *
 * Deliberately NOT invented: practitioner names and qualifications, registration numbers,
 * addresses, phone numbers, UPI details, patient testimonials and medical claims.
 */

export const SAMPLE_BRANCHES = [
  {
    slug: "main-clinic",
    name: "Main Clinic",
    addressLine: "Street address to be added",
    city: "City",
    state: null,
    pincode: null,
    openingHours: "Mon – Sat · 9:00 AM – 7:00 PM (sample)\nSunday · Closed (sample)",
    isPickupPoint: true,
    sortOrder: 0,
  },
];

export const SAMPLE_SERVICES = [
  {
    slug: "wellness-consultation",
    name: "Wellness Consultation",
    icon: "care",
    durationMinutes: 45,
    price: 80000,
    mode: "IN_PERSON" as const,
    summary:
      "An unhurried first conversation about your health, daily routines and goals, ending with a plan you understand.",
    description:
      "Your first visit is a chance to talk things through without feeling rushed.\n\n## What to expect\n- A conversation about your health history, routines, sleep, movement and nutrition\n- Time to ask questions and share what matters most to you\n- A clear, written summary of the next steps we agree on\n\n## Before you come\nPlease bring any recent reports or prescriptions you'd like us to see, and a list of medicines or supplements you take.",
  },
  {
    slug: "follow-up-consultation",
    name: "Follow-up Consultation",
    icon: "stethoscope",
    durationMinutes: 30,
    price: 50000,
    mode: "BOTH" as const,
    summary: "A shorter visit to review how things are going and adjust your plan together.",
    description:
      "Follow-up visits help us see what's working and what could change.\n\n## What to expect\n- A review of the plan agreed at your last visit\n- Adjustments based on how you've been feeling\n- Answers to any new questions\n\nFollow-ups can be in person or by video call.",
  },
  {
    slug: "lifestyle-nutrition-guidance",
    name: "Lifestyle & Nutrition Guidance",
    icon: "nutrition",
    durationMinutes: 45,
    price: 70000,
    mode: "BOTH" as const,
    summary: "Practical, realistic guidance on meals, routines and habits that fit your everyday life.",
    description:
      "A practical session focused on small, sustainable changes.\n\n## What to expect\n- A look at your current meals, schedule and preferences\n- Simple suggestions you can try straight away\n- A follow-up plan to review progress",
  },
  {
    slug: "yoga-therapy-session",
    name: "Yoga Therapy Session",
    icon: "activity",
    durationMinutes: 60,
    price: 90000,
    mode: "IN_PERSON" as const,
    summary: "A one-to-one yoga session adapted to your body, comfort level and goals.",
    description:
      "A personal session where every posture and breathing practice is adapted to you.\n\n## What to expect\n- A short conversation about your comfort level and any limitations\n- Gentle, guided practice at your own pace\n- A simple routine to continue at home\n\nPlease wear comfortable clothing. Mats and props are provided.",
  },
  {
    slug: "breath-relaxation-session",
    name: "Breath & Relaxation Session",
    icon: "breath",
    durationMinutes: 45,
    price: 60000,
    mode: "IN_PERSON" as const,
    summary: "Guided breathing and relaxation techniques you can return to whenever you need a pause.",
    description:
      "A calm, guided session introducing breathing and relaxation practices.\n\n## What to expect\n- An introduction to a few simple techniques\n- Guided practice in a quiet room\n- Suggestions for using them in daily life",
  },
  {
    slug: "online-video-consultation",
    name: "Online Video Consultation",
    icon: "sparkle",
    durationMinutes: 30,
    price: 50000,
    mode: "ONLINE" as const,
    summary: "Speak with a practitioner from home by video call — ideal for follow-ups and quick questions.",
    description:
      "Convenient video consultations for when visiting the clinic isn't practical.\n\n## How it works\n- Book a time below\n- We'll email you the video call details before your appointment\n- Join from your phone or computer in a quiet, private space",
  },
];

export const SAMPLE_DOCTORS = [
  {
    slug: "consulting-physician",
    name: "Consulting Physician",
    specialisation: "Wellness consultations",
    qualifications: "Qualifications to be added by the clinic",
    shortBio:
      "Sample profile — the clinic will add this practitioner's name, photograph, qualifications and introduction.",
    bio: "This is a sample practitioner profile. The clinic will replace it with the practitioner's verified details before launch.",
    languages: null,
    services: ["wellness-consultation", "follow-up-consultation", "online-video-consultation"],
    // [dayOfWeek, start "HH:MM", end "HH:MM"] — morning and evening sessions with a lunch break
    schedule: [1, 2, 3, 4, 5, 6].flatMap((day) => [
      [day, "10:00", "13:00"],
      [day, "16:00", "19:00"],
    ]) as Array<[number, string, string]>,
  },
  {
    slug: "yoga-therapist",
    name: "Yoga Therapist",
    specialisation: "Yoga & breathwork",
    qualifications: "Qualifications to be added by the clinic",
    shortBio:
      "Sample profile — the clinic will add this practitioner's name, photograph, qualifications and introduction.",
    bio: "This is a sample practitioner profile. The clinic will replace it with verified details before launch.",
    languages: null,
    services: ["yoga-therapy-session", "breath-relaxation-session"],
    schedule: [1, 3, 5].map((day) => [day, "07:00", "11:00"]) as Array<[number, string, string]>,
  },
  {
    slug: "nutrition-consultant",
    name: "Nutrition Consultant",
    specialisation: "Lifestyle & nutrition",
    qualifications: "Qualifications to be added by the clinic",
    shortBio:
      "Sample profile — the clinic will add this practitioner's name, photograph, qualifications and introduction.",
    bio: "This is a sample practitioner profile. The clinic will replace it with verified details before launch.",
    languages: null,
    services: ["lifestyle-nutrition-guidance", "follow-up-consultation", "online-video-consultation"],
    schedule: [2, 4, 6].map((day) => [day, "11:00", "15:00"]) as Array<[number, string, string]>,
  },
];

/**
 * Sample live classes. They show each way the clinic charges (decision 2): monthly, one fee per
 * batch and per session. Every session is under 60 minutes (decision 3) and no batch has a seat
 * limit (decision 4).
 */
export const SAMPLE_CLASSES = [
  {
    slug: "morning-yoga-flow",
    title: "Morning Yoga Flow",
    instructor: "yoga-therapist",
    summary: "A gentle, steady practice three mornings a week, paid month by month.",
    description:
      "Three guided live sessions a week, building a calm and steady practice. The fee is paid month by month, so you can continue for as long as it suits you.\n\nEach session includes a short warm-up, a sequence of gentle postures and a few minutes of breathing and relaxation. Options are offered for every posture so you can work at your own comfort level.",
    audience: "Adults who are new to yoga or returning after a break",
    level: "BEGINNER" as const,
    language: "English & Hindi",
    feeType: "MONTHLY" as const,
    fee: 120000,
    feeIncludes:
      "12 live sessions a month on Google Meet\nA short practice sheet to keep\nQuestions answered at the end of each session",
    materials: "A yoga mat or a soft rug\nComfortable clothing\nA cushion or folded blanket",
    batches: [
      {
        name: "Morning batch",
        startInDays: 3,
        hour: 6,
        minute: 30,
        durationMinutes: 55,
        sessionsCount: 12,
        scheduleNote: "Mon, Wed & Fri · 6:30 – 7:25 AM",
        seatLimit: null,
      },
      {
        name: "Evening batch",
        startInDays: 4,
        hour: 18,
        minute: 30,
        durationMinutes: 55,
        sessionsCount: 12,
        scheduleNote: "Mon, Wed & Fri · 6:30 – 7:25 PM",
        seatLimit: null,
      },
    ],
  },
  {
    slug: "yoga-nidra-drop-in",
    title: "Yoga Nidra Drop-in",
    instructor: "yoga-therapist",
    summary: "Guided deep relaxation you can join one evening at a time. Pay only for the sessions you book.",
    description:
      "Yoga nidra is a guided relaxation practice done lying down. Each session stands on its own, so you can choose the evenings that suit you.\n\nEvery session lasts 40 minutes. If you'd like to come regularly, book the four-week pack.",
    audience: "Anyone who would like to unwind at the end of the day",
    level: "ALL_LEVELS" as const,
    language: "English & Tamil",
    feeType: "PER_SESSION" as const,
    fee: 25000,
    feeIncludes: "A live 40-minute session on Google Meet\nPay only for the sessions you book",
    materials: "A mat or blanket to lie on\nA small pillow",
    batches: [
      {
        name: "Single session",
        startInDays: 2,
        hour: 20,
        minute: 0,
        durationMinutes: 40,
        sessionsCount: 1,
        scheduleNote: "8:00 – 8:40 PM",
        seatLimit: null,
      },
      {
        name: "4-week pack",
        startInDays: 2,
        hour: 20,
        minute: 0,
        durationMinutes: 40,
        sessionsCount: 4,
        scheduleNote: "Once a week for 4 weeks · 8:00 – 8:40 PM",
        seatLimit: null,
      },
      {
        name: "Single session",
        startInDays: 9,
        hour: 20,
        minute: 0,
        durationMinutes: 40,
        sessionsCount: 1,
        scheduleNote: "8:00 – 8:40 PM",
        seatLimit: null,
      },
    ],
  },
  {
    slug: "guided-meditation-circle",
    title: "Guided Meditation Circle",
    instructor: "yoga-therapist",
    summary: "A quiet weekly gathering for guided meditation and reflection. Free to join.",
    description:
      "A relaxed, 45-minute guided meditation held every week. No experience is needed — simply find a quiet spot and join in.\n\nThe circle is free and open to everyone.",
    audience: "Anyone who would like a calm pause in their week",
    level: "ALL_LEVELS" as const,
    language: "English",
    feeType: "PER_SESSION" as const,
    fee: 0,
    feeIncludes: "One live 45-minute session",
    materials: "A quiet space where you won't be disturbed\nHeadphones (optional)",
    batches: [
      {
        name: "This week",
        startInDays: 5,
        hour: 19,
        minute: 0,
        durationMinutes: 45,
        sessionsCount: 1,
        scheduleNote: "Sunday · 7:00 – 7:45 PM",
        seatLimit: null,
      },
    ],
  },
  {
    slug: "breathwork-basics",
    title: "Breathwork Basics",
    instructor: "yoga-therapist",
    summary: "Two weekend sessions introducing simple breathing practices for everyday calm. One fee for both.",
    description:
      "Learn a handful of simple breathing practices across two relaxed weekend sessions, with time for questions.\n\nYou'll leave with a short routine you can use at home.",
    audience: "Beginners and anyone curious about breathwork",
    level: "BEGINNER" as const,
    language: "English",
    feeType: "PER_BATCH" as const,
    fee: 80000,
    feeIncludes: "2 live sessions of 50 minutes\nA printable practice guide",
    materials: "A chair or cushion to sit on\nA glass of water",
    batches: [
      {
        name: "Weekend batch",
        startInDays: 9,
        hour: 10,
        minute: 0,
        durationMinutes: 50,
        sessionsCount: 2,
        scheduleNote: "Two Saturdays · 10:00 – 10:50 AM",
        seatLimit: null,
      },
    ],
  },
];

export const SAMPLE_COURSES = [
  {
    slug: "foundations-of-mindful-breathing",
    title: "Foundations of Mindful Breathing",
    cover: "/images/placeholders/course-breath.webp",
    category: "Breathwork",
    level: "BEGINNER" as const,
    language: "English",
    price: 149900,
    accessDays: 365,
    summary: "Six short lessons introducing calm, simple breathing practices you can use anywhere.",
    description:
      "A step-by-step introduction to breathing practices that fit into everyday life. Each lesson is short, so you can learn a little at a time and practise along.",
    outcomes: [
      "Settle into a comfortable posture for practice",
      "Use three simple breathing techniques",
      "Build a five-minute daily routine",
      "Know when to pause and rest",
    ],
    instructor: "yoga-therapist",
    lessons: [
      { title: "Welcome and how to use this course", durationMinutes: 6, isFreePreview: true },
      { title: "Finding a comfortable posture", durationMinutes: 9 },
      { title: "Noticing the natural breath", durationMinutes: 11 },
      { title: "Slow, even breathing", durationMinutes: 12 },
      { title: "Alternate-nostril breathing", durationMinutes: 14 },
      { title: "Building your daily routine", durationMinutes: 10 },
    ],
  },
  {
    slug: "gentle-yoga-everyday-movement",
    title: "Gentle Yoga for Everyday Movement",
    cover: "/images/placeholders/course-yoga.webp",
    category: "Yoga",
    level: "BEGINNER" as const,
    language: "English & Hindi",
    price: 199900,
    accessDays: null,
    summary: "Eight follow-along sessions of gentle yoga, with options for every posture.",
    description:
      "Gentle, follow-along practices designed for everyday comfort and ease of movement. Every posture includes simpler options, and you can repeat lessons as often as you like.",
    outcomes: [
      "Follow a complete gentle practice at home",
      "Adapt postures to your comfort level",
      "Combine movement with steady breathing",
      "Create a routine that suits your week",
    ],
    instructor: "yoga-therapist",
    lessons: [
      { title: "Before you begin: setting up your space", durationMinutes: 7, isFreePreview: true },
      { title: "Morning wake-up sequence", durationMinutes: 18 },
      { title: "Gentle standing postures", durationMinutes: 20 },
      { title: "Seated stretches", durationMinutes: 16 },
      { title: "Practice for desk workers", durationMinutes: 15 },
      { title: "Evening wind-down", durationMinutes: 17 },
      { title: "Putting it together: full practice", durationMinutes: 30 },
      { title: "Keeping your practice going", durationMinutes: 8 },
    ],
  },
  {
    slug: "mindful-eating-basics",
    title: "Mindful Eating Basics",
    cover: "/images/placeholders/course-eating.webp",
    category: "Nutrition",
    level: "ALL_LEVELS" as const,
    language: "English",
    price: 0,
    accessDays: null,
    summary: "A free, short course on slowing down and enjoying meals with more attention.",
    description:
      "Four short lessons on bringing more attention and enjoyment to everyday meals. Free for everyone with an account.",
    outcomes: ["Notice hunger and fullness cues", "Slow down at mealtimes", "Plan simple, balanced meals"],
    instructor: "nutrition-consultant",
    lessons: [
      { title: "What mindful eating means", durationMinutes: 8, isFreePreview: true },
      { title: "Noticing hunger and fullness", durationMinutes: 10 },
      { title: "Slowing down at mealtimes", durationMinutes: 9 },
      { title: "Simple meal planning", durationMinutes: 12 },
    ],
  },
];

export const SAMPLE_CATEGORIES = [
  { slug: "teas-infusions", name: "Teas & Infusions", sortOrder: 0 },
  { slug: "oils-body-care", name: "Oils & Body Care", sortOrder: 1 },
  { slug: "practice-essentials", name: "Practice Essentials", sortOrder: 2 },
];

export const SAMPLE_PRODUCTS = [
  {
    slug: "calm-evening-herbal-tea",
    name: "Calm Evening Herbal Tea",
    category: "teas-infusions",
    image: "/images/placeholders/product-tea.webp",
    size: "100 g",
    price: 35000,
    mrp: 40000,
    stock: 24,
    isFeatured: true,
    shortDescription: "A caffeine-free loose-leaf blend for a quiet evening cup.",
    description:
      "A gentle, caffeine-free blend of dried herbs, packed in small batches. Steep a teaspoon in hot water for five minutes and enjoy slowly.",
    benefits: "Caffeine-free\nLoose-leaf, packed in small batches\nResealable kraft pouch",
    ingredients: "Sample ingredients — to be confirmed by the clinic",
    usage: "Add one teaspoon to a cup of freshly boiled water. Cover and steep for 5 minutes, then strain.",
  },
  {
    slug: "cold-pressed-sesame-oil",
    name: "Cold-Pressed Sesame Oil",
    category: "oils-body-care",
    image: "/images/placeholders/product-oil.webp",
    size: "200 ml",
    price: 42000,
    mrp: null,
    stock: 18,
    isFeatured: true,
    shortDescription: "Cold-pressed sesame oil in an amber glass bottle.",
    description: "Cold-pressed oil in an amber glass bottle to protect it from light. Store in a cool, dry place.",
    benefits: "Cold-pressed\nAmber glass bottle",
    ingredients: "Sample ingredients — to be confirmed by the clinic",
    usage: "For external use. Patch-test on a small area of skin first.",
  },
  {
    slug: "meditation-cushion",
    name: "Meditation Cushion",
    category: "practice-essentials",
    image: "/images/placeholders/product-cushion.webp",
    size: "Round · 38 cm",
    price: 165000,
    mrp: null,
    stock: 6,
    isFeatured: true,
    shortDescription: "A firm, round cushion for comfortable seated practice.",
    description:
      "A firm, round cushion with a removable cotton cover, sized for seated meditation and breathing practice.",
    benefits: "Removable, washable cover\nCarry handle",
    ingredients: null,
    usage: "Sit towards the front edge of the cushion so your knees rest lower than your hips.",
  },
  {
    slug: "copper-water-bottle",
    name: "Copper Water Bottle",
    category: "practice-essentials",
    image: "/images/placeholders/product-bottle.webp",
    size: "950 ml",
    price: 120000,
    mrp: 145000,
    stock: 3,
    isFeatured: true,
    shortDescription: "A hand-finished copper bottle with a leak-proof cap.",
    description: "A hand-finished copper bottle with a leak-proof screw cap. Each piece may vary slightly in colour.",
    benefits: "Leak-proof cap\nHand-finished",
    ingredients: null,
    usage:
      "Rinse before first use. Clean with lemon and salt when the surface darkens. Not suitable for the dishwasher.",
  },
  {
    slug: "neem-turmeric-soap-set",
    name: "Neem & Turmeric Soap (Set of 3)",
    category: "oils-body-care",
    image: "/images/placeholders/product-soap.webp",
    size: "3 × 75 g",
    price: 29900,
    mrp: null,
    stock: 40,
    isFeatured: false,
    shortDescription: "Three handmade soap bars, wrapped in recycled paper.",
    description: "Three handmade soap bars, each wrapped in recycled paper.",
    benefits: "Handmade\nPlastic-free packaging",
    ingredients: "Sample ingredients — to be confirmed by the clinic",
    usage: "Lather with water and rinse. Keep the bar dry between uses.",
  },
  {
    slug: "natural-rubber-yoga-mat",
    name: "Natural Rubber Yoga Mat",
    category: "practice-essentials",
    image: "/images/placeholders/product-mat.webp",
    size: "183 × 61 cm · 4 mm",
    price: 240000,
    mrp: null,
    stock: 0,
    isFeatured: false,
    shortDescription: "A grippy 4 mm mat for home practice.",
    description: "A 4 mm mat with a textured surface, supplied with a cotton carry strap.",
    benefits: "Textured surface\nCotton carry strap included",
    ingredients: null,
    usage: "Wipe with a damp cloth after use and dry flat, away from direct sunlight.",
  },
];

export const SAMPLE_POSTS = [
  {
    slug: "building-a-gentle-morning-routine",
    title: "Building a Gentle Morning Routine",
    cover: "/images/placeholders/blog-routine.webp",
    tags: ["Daily living"],
    daysAgo: 4,
    excerpt:
      "Small, unhurried habits can make mornings feel calmer. Here's a simple way to start — no early alarms required.",
    content:
      "Mornings often set the tone for the rest of the day. A routine doesn't need to be long or complicated to make a difference — a few quiet minutes can be enough.\n\n## Start smaller than you think\nChoose one small habit, such as a glass of water before your phone or five minutes of stretching, and repeat it for a week before adding anything else.\n\n## Make it easy\n- Lay out what you need the night before\n- Keep the routine the same length every day\n- Pair a new habit with something you already do\n\n## Be kind to yourself\nSome days won't go to plan, and that's fine. The aim is a routine that supports you — not another task to feel guilty about.",
  },
  {
    slug: "what-to-expect-at-your-first-consultation",
    title: "What to Expect at Your First Consultation",
    cover: "/images/placeholders/blog-first-visit.webp",
    tags: ["Visiting us"],
    daysAgo: 11,
    excerpt: "From booking to your follow-up plan, here's how a first visit to the clinic usually works.",
    content:
      "Visiting somewhere new can feel daunting. Here's what usually happens at a first consultation, so you know what to expect.\n\n## Before your visit\nBook online and choose a time that suits you. You'll receive a confirmation email with your booking reference.\n\n## During the consultation\nWe'll start with a conversation about your health history, your routines and what you hope to get from your visit. There's always time for questions.\n\n## Afterwards\nYou'll leave with a clear summary of the next steps we've agreed together, and the option to book a follow-up.\n\n## What to bring\n1. Any recent reports or prescriptions\n2. A list of medicines and supplements you take\n3. Questions you'd like to ask",
  },
  {
    slug: "how-our-live-online-classes-work",
    title: "How Our Live Online Classes Work",
    cover: "/images/placeholders/blog-classes.webp",
    tags: ["Classes"],
    daysAgo: 20,
    excerpt: "Registering, paying, and joining on Google Meet — a quick guide to our live classes.",
    content:
      "Our live classes take place on Google Meet, so you can join from home on your phone, tablet or computer.\n\n## Registering\nChoose a class and batch, sign in or create an account, and review the fee.\n\n## Paying\nPay using the clinic's UPI QR code and enter your UPI transaction reference. Our team verifies every payment — usually within one working day.\n\n## Joining\nOnce your payment is verified, the joining link appears in **My account → Classes**. Links are private to registered students, so please don't share them.\n\n## Tips for a good session\n- Find a quiet space with enough room to move\n- Join a few minutes early to check your sound and video\n- Keep water nearby",
  },
];

export const SAMPLE_FAQS = [
  {
    question: "How do I book an appointment?",
    answer:
      "Choose **Book Appointment**, then pick a service, a practitioner, a date and an available time. You'll see a booking reference straight away and receive a confirmation email.",
  },
  {
    question: "Can I cancel or reschedule my appointment?",
    answer:
      "Yes. Use the link in your confirmation email or go to **My account → Appointments**. Online changes are possible up to the cut-off shown in your booking; after that, please contact the clinic.",
  },
  {
    question: "What is the free consultation?",
    answer:
      "It's a 10-minute, no-cost conversation to understand what you're looking for and suggest a starting point. It can be a phone call, a video call or a visit to the clinic — choose what suits you on the free consultation form and our team will contact you to arrange a time.",
  },
  {
    question: "How do the live online classes work?",
    answer:
      "Classes run on Google Meet and each session is under an hour. Depending on the class, you pay once for the batch, once a month, or for each session. After you register and your payment is verified, the private joining link appears in your account. Free classes are confirmed straight away.",
  },
  {
    question: "How do I pay for classes, courses and products?",
    answer:
      "We accept UPI. Scan the clinic's QR code (or tap to open your UPI app on a phone), pay the amount shown, then enter the UPI transaction reference so our team can verify it.",
  },
  {
    question: "How long does payment verification take?",
    answer:
      "Our team checks UPI payments once a day, so confirmation can take up to a day. You'll get an email as soon as your payment is verified.",
  },
  {
    question: "How long can I access a recorded course?",
    answer:
      "Each course shows its access period before you enrol: some are yours for life, others stay open for 12 months. Access starts when your payment is verified, and you can watch the lessons as many times as you like during that period.",
  },
  {
    question: "Do you deliver, or can I collect my order?",
    answer:
      "Both. We deliver to any PIN code in India, or you can collect your order from the clinic. Delivery charges, if any, are shown before you place your order.",
  },
  {
    question: "Is my personal information kept private?",
    answer:
      "Yes. Your details are used only to provide our services and are visible only to authorised clinic staff. See our Privacy Policy for more.",
  },
];
