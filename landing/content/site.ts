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
  image: string;
  imageAlt: string;
};

export type StudioProfile = {
  name: string;
  locationLabel: string;
  description: string;
  image: string;
  imageAlt: string;
  imageTone?: "light" | "dark";
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

export const navigationItems: NavigationItem[] = [
  { label: "Program", href: "/#program" },
  { label: "Class Menu", href: "/#menu" },
  { label: "Studios", href: "/studios" },
  { label: "Schedule", href: "/#schedule" },
  { label: "Pass", href: "/#pass" },
];

export const quickFacts: QuickFact[] = [
  { label: "Days", value: "Mon-Wed" },
  { label: "Class Blocks", value: "20 min" },
  { label: "Open Window", value: "9 AM-2 PM" },
  { label: "3-Day Pass", value: "$100" },
];

export const classMenuItems: ClassMenuItem[] = [
  {
    title: "Foam Rolling & Dancer's Stretches",
    duration: "20 min",
    description: "Release work and dancer-specific stretches for cleaner movement.",
    image: "/assets/classes/foam-rolling-stretches.jpg",
    imageAlt: "Dancer using a foam roller and stretching in a studio",
  },
  {
    title: "Argentine Tango Proficiency",
    duration: "20 min",
    description: "Connection, posture, walking technique, and musical response.",
    image: "/assets/classes/argentine-tango.jpg",
    imageAlt: "Adult dancers practicing Argentine Tango technique",
  },
  {
    title: "Waltz Rise & Fall",
    duration: "20 min",
    description: "Foot pressure, frame, timing, and controlled rise through movement.",
    image: "/assets/classes/waltz-rise-fall.jpg",
    imageAlt: "Ballroom dancers practicing waltz rise and fall",
  },
  {
    title: "Cuban Motion",
    duration: "20 min",
    description: "Grounded weight transfer, hip action, and Latin body mechanics.",
    image: "/assets/classes/cuban-motion.jpg",
    imageAlt: "Dance students learning Cuban motion in a studio",
  },
  {
    title: "Latin Arms",
    duration: "20 min",
    description: "Arm styling, hand lines, transitions, and upper-body confidence.",
    image: "/assets/classes/latin-arms.jpg",
    imageAlt: "Dancers practicing Latin arm styling and lines",
  },
  {
    title: "Samba Beats",
    duration: "20 min",
    description: "Pulse, bounce, foot rhythm, and musical timing for Samba basics.",
    image: "/assets/classes/samba-beats.jpg",
    imageAlt: "Dance students practicing Samba rhythm and footwork",
  },
  {
    title: "Latin & Smooth Rhythms",
    duration: "20 min",
    description: "Timing drills for Latin, smooth, and social dance patterns.",
    image: "/assets/classes/latin-smooth-rhythms.jpg",
    imageAlt: "Students practicing rhythm training and dance footwork",
  },
  {
    title: "Hustle Fundamentals",
    duration: "20 min",
    description: "Lead-follow connection, turns, timing, and social dance confidence.",
    image: "/assets/classes/hustle-fundamentals.jpg",
    imageAlt: "Social dancers practicing Hustle partner turns",
  },
  {
    title: "Adult Barre",
    duration: "20 min",
    description: "Ballet-based strength, balance, posture, and alignment work.",
    image: "/assets/classes/adult-barre.jpg",
    imageAlt: "Adult students practicing ballet barre alignment",
  },
  {
    title: "Juggling Introduction",
    duration: "20 min",
    description: "Coordination, rhythm, focus, and playful dancer cross-training.",
    image: "/assets/classes/juggling-introduction.jpg",
    imageAlt: "Adult students practicing juggling for coordination",
  },
];

export const studioProfiles: StudioProfile[] = [
  {
    name: "Belleville Lake Dance Company",
    locationLabel: "Belleville, Michigan",
    description:
      "Belleville Lake Dance Company offers dance programming across styles including jazz, tap, ballet, hip-hop, ballroom, and acro. The studio is based at 500 E. Huron River Drive in Belleville.",
    image: "/assets/studios/belleville-lake-dance-company.webp",
    imageAlt: "Belleville Lake Dance Company logo",
    imageTone: "dark",
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
    image: "/assets/studios/rhizome-roots-studio.jpg",
    imageAlt: "Rhizome Roots Studio movement and wellness collage",
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
        label: "Program mix",
        value: "Social dance, yoga, outdoor adventures, and wellness education",
      },
    ],
    website: {
      href: "https://rhizomeroots.com",
      label: "Visit rhizomeroots.com",
    },
  },
];
