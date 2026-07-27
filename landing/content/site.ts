export type NavigationItem = {
  label: string;
  href: string;
};

export type QuickFact = {
  label: string;
  value: string;
};

export type ClassMenuItem = {
  key: string;
  title: string;
  description: string;
  details: string;
  category: string;
  level: string;
  highlights: string[];
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
  { label: "Hours", value: "9 AM-2 PM ET" },
  { label: "Format", value: "Unlimited classes" },
  { label: "3-Day Pass", value: "$100" },
];

export const classMenuItems: ClassMenuItem[] = [
  {
    key: "cuban-motion",
    title: "Cuban Motion",
    description: "Grounded movement for Rumba, Cha Cha, and Salsa.",
    details:
      "Build expressive Cuban Motion from the floor up through forward and back walks, quarter-beat analysis, weight transfer, and arm coordination.",
    category: "Latin Rhythms",
    level: "All levels",
    highlights: ["Rumba, Cha Cha & Salsa", "Forward & back walks", "Quarter-beat analysis", "Arm coordination"],
    image: "/assets/classes/cuban-motion.jpg",
    imageAlt: "Dance students learning Cuban motion in a studio",
  },
  {
    key: "samba",
    title: "Samba",
    description: "Rhythm, body action, and buoyant footwork.",
    details:
      "Explore Samba rhythm through focused foot and body work, with elements drawn from both American and International styles.",
    category: "Latin Rhythms",
    level: "All levels",
    highlights: ["Rhythm", "Foot & body work", "American & International elements"],
    image: "/assets/classes/samba-beats.jpg",
    imageAlt: "Dance students practicing Samba rhythm and footwork",
  },
  {
    key: "bolero",
    title: "Bolero",
    description: "Sustained movement with softness, control, and connection.",
    details:
      "Develop Bolero's basic movement, rise and fall, contra body movement, and contra body movement position.",
    category: "Latin Rhythms",
    level: "All levels",
    highlights: ["Basic movement", "Rise & fall", "Contra body movement", "Partner position"],
    image: "/assets/classes/bolero.webp",
    imageAlt: "Adult partners practicing a graceful Bolero line",
  },
  {
    key: "crossovers-fifths",
    title: "Just Crossovers & Fifths",
    description: "A focused study of two versatile Latin patterns.",
    details:
      "Refine direction, timing, and body action through concentrated work on Crossovers and Fifth Position Breaks.",
    category: "Latin Rhythms",
    level: "All levels",
    highlights: ["Crossovers", "Fifth Position Breaks", "Direction & timing"],
    image: "/assets/classes/crossovers-fifths.webp",
    imageAlt: "Partners practicing Latin crossover patterns in a bright studio",
  },
  {
    key: "latin-arms",
    title: "Latin Arms",
    description: "Expressive lines that belong to the whole body.",
    details:
      "Shape confident arm pathways, hands, and transitions without losing timing or balance. Styling becomes part of the movement, not an afterthought.",
    category: "Latin Rhythms",
    level: "All levels",
    highlights: ["Arm pathways", "Hand shaping", "Movement transitions"],
    image: "/assets/classes/latin-arms.jpg",
    imageAlt: "Dancers practicing Latin arm styling and lines",
  },
  {
    key: "swing-fundamentals",
    title: "East & West Coast Swing Fundamentals",
    description: "Clear rhythm, grounded direction, and easy partner movement.",
    details:
      "Find the essential differences between East Coast and West Coast Swing through rhythm, body swing, foot direction, and foot action.",
    category: "Swing Rhythms",
    level: "Beginner friendly",
    highlights: ["East & West Coast Swing", "Body swing", "Foot direction & action"],
    image: "/assets/classes/swing-fundamentals.webp",
    imageAlt: "Adult partners practicing swing dance fundamentals",
  },
  {
    key: "hustle-fundamentals",
    title: "Hustle Fundamentals",
    description: "Dynamic shapes, syncopation, and social-floor confidence.",
    details:
      "Move through closed syncopation, forward progression, pivots, and the geometric patterns that give Hustle its momentum.",
    category: "Swing Rhythms",
    level: "Beginner friendly",
    highlights: ["Closed syncopation", "Square, triangle & diamond", "Pivot action", "Forward progression"],
    image: "/assets/classes/hustle-fundamentals.jpg",
    imageAlt: "Social dancers practicing Hustle partner turns",
  },
  {
    key: "nightclub-elements",
    title: "Nightclub Elements",
    description: "Smooth, intimate movement shaped by rise and fall.",
    details:
      "Explore pivots, slip actions, tombé, and rise and fall as expressive elements for Nightclub dance.",
    category: "Swing Rhythms",
    level: "All levels",
    highlights: ["Pivots", "Slip actions", "Tombé", "Rise & fall"],
    image: "/assets/classes/nightclub-elements.webp",
    imageAlt: "Partners practicing smooth Nightclub dance in an intimate studio",
  },
  {
    key: "argentine-tango",
    title: "Argentine Tango",
    description: "Grounded walks, close connection, and precise improvisation.",
    details:
      "Develop forward and back ochos, left and right molinetes, the chair, and sacada hook-and-release actions.",
    category: "Smooth Rhythms",
    level: "All levels",
    highlights: ["Forward & back ochos", "Left & right molinetes", "The chair", "Sacada hook & release"],
    image: "/assets/classes/argentine-tango.jpg",
    imageAlt: "Adult dancers practicing Argentine Tango technique",
  },
  {
    key: "waltz",
    title: "Waltz",
    description: "Lift, flight, and balance through every measure.",
    details:
      "Connect rise and fall with foot and body placement, then carry it through open box, straight box, and traveling movement.",
    category: "Smooth Rhythms",
    level: "All levels",
    highlights: ["Rise & fall", "Foot & body placement", "Open box", "Straight box"],
    image: "/assets/classes/waltz-rise-fall.jpg",
    imageAlt: "Ballroom dancers practicing Waltz rise and fall",
  },
  {
    key: "tango",
    title: "Tango",
    description: "Crisp rhythm and grounded direction with unmistakable character.",
    details:
      "Study Tango rhythms, curved walks, promenade, and backward heel walks with clarity and intention.",
    category: "Smooth Rhythms",
    level: "All levels",
    highlights: ["Tango rhythms", "Curved walk", "Promenade", "Back walks"],
    image: "/assets/classes/ballroom-tango.webp",
    imageAlt: "Ballroom partners practicing a precise Tango promenade",
  },
  {
    key: "viennese-waltz",
    title: "Viennese Waltz",
    description: "Continuous rotation with calm control and musical sweep.",
    details:
      "Work through directional timing, line-of-dance alignments, and left and right fleckerls with a checked action.",
    category: "Smooth Rhythms",
    level: "Intermediate",
    highlights: ["Directional timing", "Line-of-dance alignment", "Left & right fleckerls"],
    image: "/assets/classes/viennese-waltz.webp",
    imageAlt: "Adult partners practicing Viennese Waltz rotation",
  },
  {
    key: "quickstep",
    title: "Quickstep",
    description: "Light, rhythmic movement with energy to spare.",
    details:
      "Build the basic step, footwork, and body positioning before adding gallops, hops, skips, and jumping-jack actions.",
    category: "Smooth Rhythms",
    level: "All levels",
    highlights: ["Basic step", "Footwork & positioning", "Galloping, hopping & skipping"],
    image: "/assets/classes/quickstep.webp",
    imageAlt: "Partners moving through an energetic Quickstep",
  },
  {
    key: "foxtrot",
    title: "Foxtrot",
    description: "Unhurried travel, generous sway, and seamless partnership.",
    details:
      "Explore Foxtrot rhythms, forward body sway, backward and feather footwork, contra body movement, and partner position.",
    category: "Smooth Rhythms",
    level: "All levels",
    highlights: ["Rhythms", "Forward body sway", "Feather footwork", "Contra body movement"],
    image: "/assets/classes/foxtrot.webp",
    imageAlt: "Mature ballroom partners practicing a smooth Foxtrot line",
  },
  {
    key: "foam-rolling-stretches",
    title: "Foam Rolling & Dancer's Stretches",
    description: "Release, restore, and move with greater ease.",
    details:
      "Target the calves, hips, back, and shoulders with guided foam rolling and dancer-focused stretching before or after class.",
    category: "Movement & Recovery",
    level: "All levels",
    highlights: ["Lower-body release", "Active flexibility", "Recovery technique"],
    image: "/assets/classes/foam-rolling-stretches.jpg",
    imageAlt: "Dancer using a foam roller and stretching in a studio",
  },
  {
    key: "latin-smooth-rhythms",
    title: "Latin & Smooth Rhythms",
    description: "Hear the difference. Move with confidence.",
    details:
      "Shift between Latin drive and Smooth flow with timing drills that sharpen your ear and your feet.",
    category: "Movement & Recovery",
    level: "All levels",
    highlights: ["Beat recognition", "Timing changes", "Cross-style drills"],
    image: "/assets/classes/latin-smooth-rhythms.jpg",
    imageAlt: "Students practicing rhythm training and dance footwork",
  },
  {
    key: "adult-barre",
    title: "Adult Barre",
    description: "Classic barre work for strength, posture, and balance.",
    details:
      "Strengthen the legs, organize posture, and find steadier balance through accessible ballet barre exercises. Every movement can meet you at your level.",
    category: "Movement & Recovery",
    level: "All levels",
    highlights: ["Postural alignment", "Leg strength", "Balance control"],
    image: "/assets/classes/adult-barre.jpg",
    imageAlt: "Adult students practicing ballet barre alignment",
  },
  {
    key: "juggling",
    title: "Juggling",
    description: "A playful reset for rhythm, focus, and coordination.",
    details:
      "Start with simple tosses and build a repeatable pattern at your own pace. It is lighthearted cross-training for timing, visual focus, and relaxed concentration.",
    category: "Movement & Recovery",
    level: "No experience needed",
    highlights: ["Two-in-one", "The two cross", "Three on the wall", "Waltz, Foxtrot, Tango & Viennese Waltz"],
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
