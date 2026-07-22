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
    description: "Release work and dancer-specific stretches for cleaner movement.",
    details:
      "Ease common areas of dancer tension and prepare the body for the next class. Learn how to use pressure, breath, and active mobility without forcing range of motion.",
    category: "Mobility & recovery",
    level: "All levels",
    highlights: ["Lower-body release", "Active flexibility", "Recovery technique"],
    image: "/assets/classes/foam-rolling-stretches.jpg",
    imageAlt: "Dancer using a foam roller and stretching in a studio",
  },
  {
    title: "Argentine Tango Proficiency",
    duration: "20 min",
    description: "Connection, posture, walking technique, and musical response.",
    details:
      "Build the grounded, attentive movement that gives Argentine Tango its character. Connect individual balance with clear partner communication and responsive musical choices.",
    category: "Partner dance",
    level: "All levels",
    highlights: ["Tango walk", "Partner connection", "Musical phrasing"],
    image: "/assets/classes/argentine-tango.jpg",
    imageAlt: "Adult dancers practicing Argentine Tango technique",
  },
  {
    title: "Waltz Rise & Fall",
    duration: "20 min",
    description: "Foot pressure, frame, timing, and controlled rise through movement.",
    details:
      "Explore how the feet, knees, and body work together to create smooth elevation and lowering. Break rise and fall into practical mechanics that carry into partnered Waltz movement.",
    category: "Ballroom technique",
    level: "All levels",
    highlights: ["Foot pressure", "Body flight", "Controlled lowering"],
    image: "/assets/classes/waltz-rise-fall.jpg",
    imageAlt: "Ballroom dancers practicing waltz rise and fall",
  },
  {
    title: "Cuban Motion",
    duration: "20 min",
    description: "Grounded weight transfer, hip action, and Latin body mechanics.",
    details:
      "Develop Cuban motion from the floor upward through deliberate weight changes and coordinated body action. The class emphasizes usable mechanics rather than decorative movement alone.",
    category: "Latin technique",
    level: "All levels",
    highlights: ["Weight transfer", "Hip action", "Body coordination"],
    image: "/assets/classes/cuban-motion.jpg",
    imageAlt: "Dance students learning Cuban motion in a studio",
  },
  {
    title: "Latin Arms",
    duration: "20 min",
    description: "Arm styling, hand lines, transitions, and upper-body confidence.",
    details:
      "Turn arm styling into a connected part of the whole body. Practice clear pathways, intentional hand shapes, and transitions that complement rhythm without interrupting balance or timing.",
    category: "Styling",
    level: "All levels",
    highlights: ["Arm pathways", "Hand shaping", "Movement transitions"],
    image: "/assets/classes/latin-arms.jpg",
    imageAlt: "Dancers practicing Latin arm styling and lines",
  },
  {
    title: "Samba Beats",
    duration: "20 min",
    description: "Pulse, bounce, foot rhythm, and musical timing for Samba basics.",
    details:
      "Find the rhythmic engine behind Samba through pulse, bounce, and compact foot patterns. Develop coordination gradually so the music and movement begin to feel connected.",
    category: "Rhythm training",
    level: "All levels",
    highlights: ["Samba pulse", "Bounce action", "Rhythmic footwork"],
    image: "/assets/classes/samba-beats.jpg",
    imageAlt: "Dance students practicing Samba rhythm and footwork",
  },
  {
    title: "Latin & Smooth Rhythms",
    duration: "20 min",
    description: "Timing drills for Latin, smooth, and social dance patterns.",
    details:
      "Train the ability to recognize, count, and move through contrasting musical structures. Short drills connect what you hear to practical foot timing across several ballroom and social dance styles.",
    category: "Musicality",
    level: "All levels",
    highlights: ["Beat recognition", "Timing changes", "Cross-style drills"],
    image: "/assets/classes/latin-smooth-rhythms.jpg",
    imageAlt: "Students practicing rhythm training and dance footwork",
  },
  {
    title: "Hustle Fundamentals",
    duration: "20 min",
    description: "Lead-follow connection, turns, timing, and social dance confidence.",
    details:
      "Learn a compact set of Hustle fundamentals that can be used immediately on a social floor. Balance personal timing with comfortable partner connection and clearly led turns.",
    category: "Social dance",
    level: "Beginner friendly",
    highlights: ["Core timing", "Lead and follow", "Foundational turns"],
    image: "/assets/classes/hustle-fundamentals.jpg",
    imageAlt: "Social dancers practicing Hustle partner turns",
  },
  {
    title: "Adult Barre",
    duration: "20 min",
    description: "Ballet-based strength, balance, posture, and alignment work.",
    details:
      "Use accessible ballet barre exercises to organize posture, strengthen the legs, and improve balance. Every movement is taught through functional alignment with options for different ranges and experience levels.",
    category: "Strength & alignment",
    level: "All levels",
    highlights: ["Postural alignment", "Leg strength", "Balance control"],
    image: "/assets/classes/adult-barre.jpg",
    imageAlt: "Adult students practicing ballet barre alignment",
  },
  {
    title: "Juggling Introduction",
    duration: "20 min",
    description: "Coordination, rhythm, focus, and playful dancer cross-training.",
    details:
      "Approach juggling as a practical coordination exercise, beginning with simple tosses and repeatable patterns. The work challenges visual tracking, timing, and relaxed focus in a low-pressure format.",
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
      "Frame, floorcraft, musical phrasing, and partner connection across Waltz, Tango, and smooth dance foundations.",
    image: "/assets/classes/waltz-rise-fall.jpg",
    imageAlt: "Ballroom dancers demonstrating waltz technique in a bright studio",
    specialties: ["Waltz Rise & Fall", "Argentine Tango", "Bolero Basics"],
    teachingFormat: "Private coaching + group technique",
  },
  {
    role: "Latin & Rhythm",
    description:
      "Grounded movement, expressive styling, and musical confidence through Latin body mechanics and rhythm training.",
    image: "/assets/classes/cuban-motion.jpg",
    imageAlt: "Dance instructor demonstrating Cuban motion to a student",
    specialties: ["Cuban Motion", "Latin Arms", "Samba Beats"],
    teachingFormat: "Technique labs + guided practice",
  },
  {
    role: "Social Dance",
    description:
      "Practical lead-and-follow skills, clear timing, and adaptable partner technique for an inviting social floor.",
    image: "/assets/classes/hustle-fundamentals.jpg",
    imageAlt: "Partners practicing Hustle turns during a social dance lesson",
    specialties: ["Hustle Fundamentals", "West Coast Swing", "Partner Connection"],
    teachingFormat: "Partner sessions + group rotations",
  },
  {
    role: "Mobility & Recovery",
    description:
      "Dancer-specific recovery, range of motion, and sustainable movement practices that support the full camp day.",
    image: "/assets/classes/foam-rolling-stretches.jpg",
    imageAlt: "Dancer using a foam roller during a mobility and recovery session",
    specialties: ["Foam Rolling", "Dancer's Stretches", "Wellness & Recovery"],
    teachingFormat: "Guided recovery + individual support",
  },
];

export const studioProfiles: StudioProfile[] = [
  {
    name: "Belleville Lake Dance Company",
    locationLabel: "Belleville, Michigan",
    description:
      "Belleville Lake Dance Company offers dance programming across styles including jazz, tap, ballet, hip-hop, ballroom, and acro. The studio is based at 500 E. Huron River Drive in Belleville.",
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
      "Rhizome Roots Studio focuses on inclusive wellness programming for all ages, genders, and ability levels, with movement, education, community-building, and nature-centered activities.",
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
