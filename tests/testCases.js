export const testCases = [
  {
    name: "Math with Graphs",
    domain: "MATH",
    prompt: "Graph the equation y = 2x^2 - 4x + 1",
    expectedTools: [],
    expectedContentMatch: ["```graph", "2x^2"]
  },
  {
    name: "Math with LaTeX",
    domain: "MATH",
    prompt: "Calculate the derivative of f(x) = x^3 * sin(x) using the product rule. Show the steps in LaTeX.",
    expectedTools: [],
    expectedContentMatch: ["$$", "\\frac{d}{dx}"]
  },
  {
    name: "Web Scraper",
    domain: "TOOL",
    prompt: "Search the web and tell me who won the Super Bowl in 2024.",
    expectedTools: ["search_web"],
    expectedContentMatch: []
  },
  {
    name: "Latest News",
    domain: "TOOL",
    prompt: "What is the latest breaking news in technology?",
    expectedTools: ["get_news"],
    expectedContentMatch: []
  },
  {
    name: "Sciences (Biology)",
    domain: "SCIENCE",
    prompt: "Explain how CRISPR-Cas9 works at a molecular level to edit genes.",
    expectedTools: [],
    expectedContentMatch: ["RNA", "DNA", "Cas9"]
  },
  {
    name: "Economics (Finance)",
    domain: "BUSINESS",
    prompt: "Explain how quantitative easing by a central bank impacts inflation and bond yields.",
    expectedTools: [],
    expectedContentMatch: ["inflation", "bond yields", "central bank"]
  },
  {
    name: "Sports Widget",
    domain: "TOOL",
    prompt: "What was the score of the latest Lakers game?",
    expectedTools: ["get_sports"],
    expectedContentMatch: []
  },
  {
    name: "Stock Market Widget",
    domain: "TOOL",
    prompt: "What is the current stock price of Apple?",
    expectedTools: ["get_stocks"],
    expectedContentMatch: []
  },
  {
    name: "Language Translation",
    domain: "TRANSLATION",
    prompt: "Translate 'Where is the nearest train station?' into Japanese and provide the romaji.",
    expectedTools: [],
    expectedContentMatch: ["駅", "eki"]
  },
  {
    name: "Engineering Architecture",
    domain: "ENGINEERING",
    prompt: "Explain the difference between a monocoque chassis and a body-on-frame chassis in automotive engineering.",
    expectedTools: [],
    expectedContentMatch: ["monocoque", "body-on-frame"]
  },
  {
    name: "Standard Conversational",
    domain: "STANDARD",
    prompt: "Hello! How are you doing today?",
    expectedTools: [],
    expectedContentMatch: []
  }
];
