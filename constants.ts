export const SUBJECTS = ["Computer Science", "Biology"] as const;
export const STANDARDS = ["1st PUC (11th Std)", "2nd PUC (12th Std)"] as const;

export type Subject = (typeof SUBJECTS)[number];
export type Standard = (typeof STANDARDS)[number];

export const CHAPTERS: Record<Subject, Partial<Record<Standard, string[]>>> = {
  "Computer Science": {
    "1st PUC (11th Std)": [
      "Computer System",
      "Encoding Schemes and Number System",
      "Emerging Trends",
      "Introduction to Problem Solving",
      "Getting Started with Python",
      "Flow of Control",
      "Functions",
      "Strings",
      "Lists",
      "Tuples and Dictionaries",
      "Societal Impact"
    ],
    "2nd PUC (12th Std)": [
      "Exception Handling in Python",
      "File Handling in Python",
      "Stack",
      "Queue",
      "Sorting",
      "Searching",
      "Understanding Data",
      "Database Concepts",
      "Structured Query Language (SQL)",
      "Computer Networks",
      "Data Communication",
      "Security Aspects",
      "Project Based Learning",
    ],
  },
  "Biology": {
    "1st PUC (11th Std)": [
        "The Living World",
        "Biological Classification",
        "Plant Kingdom",
        "Animal Kingdom",
        "Morphology of Flowering Plants",
        "Anatomy of Flowering Plants",
        "Structural Organisation in Animals",
        "Cell: The Unit of Life",
        "Biomolecules",
        "Cell Cycle and Cell Division",
        "Transport in Plants",
        "Mineral Nutrition",
        "Photosynthesis in Higher Plants",
        "Respiration in Plants",
        "Plant Growth and Development",
        "Digestion and Absorption",
        "Breathing and Exchange of Gases",
        "Body Fluids and Circulation",
        "Excretory Products and their Elimination",
        "Locomotion and Movement",
        "Neural Control and Coordination",
        "Chemical Coordination and Integration"
    ],
    "2nd PUC (12th Std)": [
        "Reproduction in Organisms",
        "Sexual Reproduction in Flowering Plants",
        "Human Reproduction",
        "Reproductive Health",
        "Principles of Inheritance and Variation",
        "Molecular Basis of Inheritance",
        "Evolution",
        "Human Health and Disease",
        "Strategies for Enhancement in Food Production",
        "Microbes in Human Welfare",
        "Biotechnology : Principles and Processes",
        "Biotechnology and its Applications",
        "Organisms and Populations",
        "Ecosystem",
        "Biodiversity and Conservation",
        "Environmental Issues"
    ]
  }
};