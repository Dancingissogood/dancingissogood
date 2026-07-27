export type NavigationItem = {
  label: string;
  href: string;
};

export type ClassMenuItem = {
  key: string;
  title: string;
  description: string;
  category: string;
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
  };
};

export const navigationItems: NavigationItem[] = [
  { label: "Program", href: "/#program" },
  { label: "Classes", href: "/#menu" },
  { label: "Studios", href: "/studios" },
  { label: "Schedule", href: "/#schedule" },
  { label: "Pass", href: "/#pass" },
];

export const classMenuItems: ClassMenuItem[] = [
  {
    key: "cuban-motion",
    title: "Cuban Motion",
    description:
      "Rumba, Cha Cha, and Salsa with forward and back walks, quarter-beat analysis, and arm coordination.",
    category: "Latin Rhythms",
    highlights: ["Rumba, Cha Cha & Salsa", "Forward & back walks", "Quarter-beat analysis", "Arm coordination"],
    image: "/assets/classes/cuban-motion.webp",
    imageAlt: "Dance students learning Cuban motion in a studio",
  },
  {
    key: "samba",
    title: "Samba",
    description:
      "Rhythm, foot and body work, and American and International elements.",
    category: "Latin Rhythms",
    highlights: ["Rhythm", "Foot & body work", "American & International Elements"],
    image: "/assets/classes/samba-beats.webp",
    imageAlt: "Dance students practicing Samba rhythm and footwork",
  },
  {
    key: "bolero",
    title: "Bolero",
    description:
      "Basic movement, rise and fall, contra body movement, and contra body movement position.",
    category: "Latin Rhythms",
    highlights: ["Basic movement", "Rise & fall", "Contra body movement", "Contra body movement position"],
    image: "/assets/classes/bolero.webp",
    imageAlt: "Adult partners practicing a graceful Bolero line",
  },
  {
    key: "crossovers-fifths",
    title: "Just Crossovers & 5ths",
    description: "Crossovers and 5ths.",
    category: "Latin Rhythms",
    highlights: ["Crossovers", "5ths"],
    image: "/assets/classes/crossovers-fifths.webp",
    imageAlt: "Partners practicing Latin crossover patterns in a bright studio",
  },
  {
    key: "swing-fundamentals",
    title: "ECS & WCS Swing Fundamentals",
    description: "Rhythm, body swing, foot direction, and foot action.",
    category: "Swing Rhythms",
    highlights: ["Rhythm", "Body swing", "Foot direction & action"],
    image: "/assets/classes/swing-fundamentals.webp",
    imageAlt: "Adult partners practicing swing dance fundamentals",
  },
  {
    key: "hustle-fundamentals",
    title: "Hustle Fundamentals",
    description:
      "Closed syncopation, forward progression, the square, triangle, line, pivot action, and the leader's diamond.",
    category: "Swing Rhythms",
    highlights: ["Closed syncopation", "Forward progression", "The square", "The triangle", "Pivot action", "The line", "The diamond (leaders)"],
    image: "/assets/classes/hustle-fundamentals.webp",
    imageAlt: "Social dancers practicing Hustle partner turns",
  },
  {
    key: "nightclub-elements",
    title: "Night Club Elements",
    description: "Pivots, slip actions, tombé, and rise and fall.",
    category: "Swing Rhythms",
    highlights: ["Pivots", "Slip actions", "Tombé", "Rise & fall"],
    image: "/assets/classes/nightclub-elements.webp",
    imageAlt: "Partners practicing smooth Nightclub dance in an intimate studio",
  },
  {
    key: "argentine-tango",
    title: "A. Tango",
    description:
      "Forward and back ochos, left and right molinetes, the chair, and sacada hook and release.",
    category: "Smooth Rhythms",
    highlights: ["Forward & back ochos", "Left & right molinetes", "The chair", "Sacada hook & release"],
    image: "/assets/classes/argentine-tango.webp",
    imageAlt: "Adult dancers practicing Argentine Tango technique",
  },
  {
    key: "waltz",
    title: "Waltz",
    description:
      "Rise and fall, foot and body work, foot and body placement, open box, and straight box.",
    category: "Smooth Rhythms",
    highlights: ["Rise & fall", "Foot & body work", "Foot & body placement", "Open box (square)", "Straight box (line)"],
    image: "/assets/classes/waltz-rise-fall.webp",
    imageAlt: "Ballroom dancers practicing Waltz rise and fall",
  },
  {
    key: "tango",
    title: "Tango",
    description: "Rhythms, curved walk, promenade, and back walks led with the heels.",
    category: "Smooth Rhythms",
    highlights: ["Rhythms", "Curved walk", "Promenade", "Back walks (heels)"],
    image: "/assets/classes/ballroom-tango.webp",
    imageAlt: "Ballroom partners practicing a precise Tango promenade",
  },
  {
    key: "viennese-waltz",
    title: "V. Waltz",
    description:
      "The 1/8 - 1/4 - 1/8 - 1/8 - 3/8 sequence, line of dance alignments, and left and right fleckerls with a check.",
    category: "Smooth Rhythms",
    highlights: ["1/8 - 1/4 - 1/8 - 1/8 - 3/8", "Line of dance alignments", "Left & right fleckerls with check"],
    image: "/assets/classes/viennese-waltz.webp",
    imageAlt: "Adult partners practicing Viennese Waltz rotation",
  },
  {
    key: "quickstep",
    title: "Quickstep",
    description:
      "Basic step, footwork, body positioning, galloping, hopping, skipping, and jumping jacks.",
    category: "Smooth Rhythms",
    highlights: ["Basic step", "Footwork", "Body positioning", "Galloping, hopping, skipping & jumping jacks"],
    image: "/assets/classes/quickstep.webp",
    imageAlt: "Partners moving through an energetic Quickstep",
  },
  {
    key: "foxtrot",
    title: "Foxtrot",
    description:
      "Rhythms, forward body sway, backward and feather footwork, contra body movement, and contra body movement position.",
    category: "Smooth Rhythms",
    highlights: ["Rhythms", "Forward body sway", "Backward & feather footwork", "Contra body movement", "Contra body movement position"],
    image: "/assets/classes/foxtrot.webp",
    imageAlt: "Mature ballroom partners practicing a smooth Foxtrot line",
  },
  {
    key: "juggling",
    title: "Juggling",
    description:
      "Two in one, the two cross, three on the wall, and patterns in Waltz, Foxtrot, Tango, and Viennese Waltz.",
    category: "Smooth Rhythms",
    highlights: ["Two in one", "The two cross", "Three on the wall", "In Waltz, Foxtrot, Tango & Viennese Waltz"],
    image: "/assets/classes/juggling-introduction.webp",
    imageAlt: "Adult students practicing juggling for coordination",
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
    },
  },
];
