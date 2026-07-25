export type NavigationItem = {
  label: string;
  href: string;
};

export type QuickFact = {
  label: string;
  value: string;
};

export type ClassMenuItem = {
  title: string;
  duration: string;
  description: string;
  details: string;
  category: string;
  level: string;
  highlights: [string, string, string];
  image: string;
  imageAlt: string;
};

export type StudioProfile = {
  name: string;
  locationLabel: string;
  description: string;
  image: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageVariant: "portrait" | "emblem";
  imageTheme: "belleville" | "rhizome";
  tags: string[];
  details: Array<{
    label: string;
    value: string;
  }>;
  website: {
    href: string;
    label: string;
  };
};

export type InstructorProfile = {
  role: string;
  description: string;
  image: string;
  imageAlt: string;
  specialties: string[];
  teachingFormat: string;
};

export const navigationItems: NavigationItem[] = [
  { label: "Program", href: "/#program" },
  { label: "Classes", href: "/#menu" },
  { label: "Studios", href: "/studios" },
  { label: "Instructors", href: "/instructors" },
  { label: "Schedule", href: "/#schedule" },
  { label: "Pass", href: "/#pass" },
];

export const quickFacts: QuickFact[] = [
  { label: "Days", value: "Mon-Wed" },
  { label: "Class Length", value: "20 min" },
  { label: "Daily Hours", value: "9 AM-2 PM ET" },
  { label: "3-Day Pass", value: "$100" },
];

export const classMenuItems: ClassMenuItem[] = [
  {
    title: "Foam Rolling & Dancer's Stretches",
    duration: "20 min",
    description: "Roll out, open up, and leave feeling ready to dance.",
    details:
      "Target the calves, hips, back, and shoulders with guided foam rolling and dancer-focused stretching. A practical reset before class or a restorative finish to the day.",
    category: "Mobility & recovery",
    level: "All levels",
    highlights: ["Lower-body release", "Active flexibility", "Recovery technique"],
    image: "/assets/classes/foam-rolling-stretches.jpg",
    imageAlt: "Dancer using a foam roller and stretching in a studio",
  },
  {
    title: "Argentine Tango Proficiency",
    duration: "20 min",
    description: "Grounded walks, close connection, and unmistakable Tango character.",
    details:
      "Settle into the walk, refine your posture, and find a clearer connection with your partner. Musical phrasing gives every step somewhere to go.",
    category: "Partner dance",
    level: "All levels",
    highlights: ["Tango walk", "Partner connection", "Musical phrasing"],
    image: "/assets/classes/argentine-tango.jpg",
    imageAlt: "Adult dancers practicing Argentine Tango technique",
  },
  {
    title: "Waltz Rise & Fall",
    duration: "20 min",
    description: "Stronger feet, smoother flight, and effortless-looking elevation.",
    details:
      "Feel rise and fall from the floor up. Foot pressure, knees, and body flight come together for a Waltz that moves with ease.",
    category: "Ballroom technique",
    level: "All levels",
    highlights: ["Foot pressure", "Body flight", "Controlled lowering"],
    image: "/assets/classes/waltz-rise-fall.jpg",
    imageAlt: "Ballroom dancers practicing waltz rise and fall",
  },
  {
    title: "Cuban Motion",
    duration: "20 min",
    description: "Find the grounded rhythm that brings Latin dancing to life.",
    details:
      "Cuban Motion starts with the floor. Build clear weight changes, natural hip action, and coordinated movement you can carry into every Latin dance.",
    category: "Latin technique",
    level: "All levels",
    highlights: ["Weight transfer", "Hip action", "Body coordination"],
    image: "/assets/classes/cuban-motion.jpg",
    imageAlt: "Dance students learning Cuban motion in a studio",
  },
  {
    title: "Latin Arms",
    duration: "20 min",
    description: "Expressive lines that belong to the whole body.",
    details:
      "Shape confident arm pathways, hands, and transitions without losing timing or balance. Styling becomes part of the movement, not something added afterward.",
    category: "Styling",
    level: "All levels",
    highlights: ["Arm pathways", "Hand shaping", "Movement transitions"],
    image: "/assets/classes/latin-arms.jpg",
    imageAlt: "Dancers practicing Latin arm styling and lines",
  },
  {
    title: "Samba Beats",
    duration: "20 min",
    description: "Catch the pulse, settle into the bounce, and let the rhythm lead.",
    details:
      "Explore Samba's unmistakable energy through bounce action, compact footwork, and musical timing. We build the rhythm first, then let the movement grow.",
    category: "Rhythm training",
    level: "All levels",
    highlights: ["Samba pulse", "Bounce action", "Rhythmic footwork"],
    image: "/assets/classes/samba-beats.jpg",
    imageAlt: "Dance students practicing Samba rhythm and footwork",
  },
  {
    title: "Latin & Smooth Rhythms",
    duration: "20 min",
    description: "Hear the difference. Move with confidence.",
    details:
      "Shift between Latin drive and Smooth flow with timing drills that sharpen your ear and your feet. A musicality workout for every style.",
    category: "Musicality",
    level: "All levels",
    highlights: ["Beat recognition", "Timing changes", "Cross-style drills"],
    image: "/assets/classes/latin-smooth-rhythms.jpg",
    imageAlt: "Students practicing rhythm training and dance footwork",
  },
  {
    title: "Hustle Fundamentals",
    duration: "20 min",
    description: "Easy timing, clear turns, and instant social-floor confidence.",
    details:
      "Build the timing, lead-and-follow connection, and foundational turns that make Hustle feel natural. Practical, upbeat, and ready for the social floor.",
    category: "Social dance",
    level: "Beginner friendly",
    highlights: ["Core timing", "Lead and follow", "Foundational turns"],
    image: "/assets/classes/hustle-fundamentals.jpg",
    imageAlt: "Social dancers practicing Hustle partner turns",
  },
  {
    title: "Adult Barre",
    duration: "20 min",
    description: "Classic barre work for strength, posture, and balance.",
    details:
      "Strengthen the legs, organize posture, and find steadier balance through accessible ballet barre exercises. Every movement can meet you at your level.",
    category: "Strength & alignment",
    level: "All levels",
    highlights: ["Postural alignment", "Leg strength", "Balance control"],
    image: "/assets/classes/adult-barre.jpg",
    imageAlt: "Adult students practicing ballet barre alignment",
  },
  {
    title: "Juggling Introduction",
    duration: "20 min",
    description: "A playful reset for rhythm, focus, and coordination.",
    details:
      "Start with simple tosses and build a repeatable pattern at your own pace. It is lighthearted cross-training for timing, visual focus, and relaxed concentration.",
    category: "Coordination",
    level: "No experience needed",
    highlights: ["Basic tosses", "Visual tracking", "Rhythmic coordination"],
    image: "/assets/classes/juggling-introduction.jpg",
    imageAlt: "Adult students practicing juggling for coordination",
  },
];

export const instructorProfiles: InstructorProfile[] = [
  {
    role: "Ballroom & Smooth",
    description:
      "Move with greater ease and connection through Waltz, Tango, and Smooth foundations.",
    image: "/assets/classes/waltz-rise-fall.jpg",
    imageAlt: "Ballroom dancers demonstrating waltz technique in a bright studio",
    specialties: ["Waltz Rise & Fall", "Argentine Tango", "Bolero Basics"],
    teachingFormat: "Private coaching and group classes",
  },
  {
    role: "Latin & Rhythm",
    description:
      "Find grounded movement, expressive styling, and a more confident relationship with the music.",
    image: "/assets/classes/cuban-motion.jpg",
    imageAlt: "Dance instructor demonstrating Cuban motion to a student",
    specialties: ["Cuban Motion", "Latin Arms", "Samba Beats"],
    teachingFormat: "Technique classes and guided practice",
  },
  {
    role: "Social Dance",
    description:
      "Build comfortable lead-and-follow skills, clear timing, and confidence for the social floor.",
    image: "/assets/classes/hustle-fundamentals.jpg",
    imageAlt: "Partners practicing Hustle turns during a social dance lesson",
    specialties: ["Hustle Fundamentals", "West Coast Swing", "Partner Connection"],
    teachingFormat: "Partner sessions and group classes",
  },
  {
    role: "Mobility & Recovery",
    description:
      "Recover well, move more freely, and build habits that support a full day of dancing.",
    image: "/assets/classes/foam-rolling-stretches.jpg",
    imageAlt: "Dancer using a foam roller during a mobility and recovery session",
    specialties: ["Foam Rolling", "Dancer's Stretches", "Wellness & Recovery"],
    teachingFormat: "Guided recovery and personal support",
  },
];

export const studioProfiles: StudioProfile[] = [
  {
    name: "Belleville Lake Dance Company",
    locationLabel: "Belleville, Michigan",
    description:
      "A welcoming Belleville studio where dancers of all ages can grow through jazz, tap, ballet, hip-hop, ballroom, and acro.",
    image: "/assets/studios/belleville-lake-dance-logo-official.webp",
    imageAlt: "Belleville Lake Dance Company logo",
    imageWidth: 577,
    imageHeight: 618,
    imageVariant: "portrait",
    imageTheme: "belleville",
    tags: ["Jazz", "Tap", "Ballet", "Hip-hop", "Ballroom", "Acro"],
    details: [
      {
        label: "Location",
        value: "500 E. Huron River Drive, Belleville, MI 48111",
      },
      {
        label: "Contact",
        value: "734-787-0018",
      },
    ],
    website: {
      href: "https://www.bellevillelakedance.com",
      label: "Visit bellevillelakedance.com",
    },
  },
  {
    name: "Rhizome Roots Studio",
    locationLabel: "Ypsilanti, Michigan",
    description:
      "An inclusive Ypsilanti space for movement, wellness, creativity, and community, open to all ages and ability levels.",
    image: "/assets/studios/rhizome-roots-contact-logo.png",
    imageAlt: "Rhizome Roots Studio logo",
    imageWidth: 594,
    imageHeight: 460,
    imageVariant: "emblem",
    imageTheme: "rhizome",
    tags: [
      "Social dancing",
      "Yoga",
      "Mindful movement",
      "Qigong",
      "Foraging",
      "Cooking classes",
    ],
    details: [
      {
        label: "Location",
        value: "108 Pearl St, Ypsilanti, MI",
      },
      {
        label: "Classes and activities",
        value: "Social dance, yoga, outdoor adventures, and wellness education",
      },
    ],
    website: {
      href: "https://rhizomeroots.com",
      label: "Visit rhizomeroots.com",
    },
  },
];
