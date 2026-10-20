import natural from 'natural';

let classifierInstance = null;

const trainingData = [
  // GREETING
  { text: "hi", intent: "GREETING" },
  { text: "hello", intent: "GREETING" },
  { text: "hey there", intent: "GREETING" },
  { text: "yo", intent: "GREETING" },
  { text: "what's up", intent: "GREETING" },
  { text: "good morning", intent: "GREETING" },
  { text: "good night", intent: "GREETING" },
  { text: "thanks", intent: "GREETING" },
  { text: "thank you", intent: "GREETING" },
  { text: "bye", intent: "GREETING" },
  { text: "see ya", intent: "GREETING" },
  { text: "how are you doing", intent: "GREETING" },
  
  // TOOL
  { text: "what is the weather today", intent: "TOOL" },
  { text: "is it going to rain tomorrow", intent: "TOOL" },
  { text: "what's the temperature", intent: "TOOL" },
  { text: "did the lakers win", intent: "TOOL" },
  { text: "what was the score of the game", intent: "TOOL" },
  { text: "who is playing tonight in the nba", intent: "TOOL" },
  { text: "what is the latest nfl football game", intent: "TOOL" },
  { text: "what was the latest cowboys game score", intent: "TOOL" },
  { text: "did the yankees win their baseball game", intent: "TOOL" },
  { text: "play some music", intent: "TOOL" },
  { text: "play jazz on spotify", intent: "TOOL" },
  { text: "what song is playing right now", intent: "TOOL" },
  { text: "what is apples stock today", intent: "TOOL" },
  { text: "show me tsla stock price", intent: "TOOL" },
  { text: "what is the current price of bitcoin", intent: "TOOL" },
  { text: "check bitcoin ticker and price", intent: "TOOL" },
  { text: "what are the top headlines", intent: "TOOL" },
  { text: "breaking news", intent: "TOOL" },
  { text: "top tech news today", intent: "TOOL" },
  { text: "how is nvidia stock doing", intent: "TOOL" },
  { text: "price of amzn", intent: "TOOL" },
  { text: "check the weather in new york", intent: "TOOL" },
  { text: "set a timer for 5 minutes", intent: "TOOL" },
  { text: "show my tasks", intent: "TOOL" },
  { text: "add a task to buy groceries", intent: "TOOL" },
  { text: "check my system health and ram usage", intent: "TOOL" },
  
  // CODE
  { text: "how do I center a div in css", intent: "CODE" },
  { text: "write a python script to parse xml", intent: "CODE" },
  { text: "why is this javascript code throwing a typeerror", intent: "CODE" },
  { text: "explain react useeffect and usestate hooks", intent: "CODE" },
  { text: "debug this typescript function", intent: "CODE" },
  { text: "how to use the fetch api in node", intent: "CODE" },
  { text: "write a sql query to join two tables", intent: "CODE" },
  { text: "implement binary search in python", intent: "CODE" },
  
  // MATH
  { text: "what is 54 times 23", intent: "MATH" },
  { text: "solve this integral", intent: "MATH" },
  { text: "graph y equals x squared", intent: "MATH" },
  { text: "plot sin(x)", intent: "MATH" },
  { text: "how do you find the derivative", intent: "MATH" },
  { text: "calculate the square root of 144", intent: "MATH" },
  { text: "what is the quadratic formula", intent: "MATH" },
  
  // TRANSLATION
  { text: "how do you say hello in spanish", intent: "TRANSLATION" },
  { text: "translate this to french", intent: "TRANSLATION" },
  { text: "what is thank you in japanese", intent: "TRANSLATION" },
  { text: "translate good morning into german", intent: "TRANSLATION" },
  { text: "translate good morning how are you to spanish and japanese", intent: "TRANSLATION" },
  
  // HISTORY
  { text: "who was abraham lincoln", intent: "HISTORY" },
  { text: "when did world war 2 end", intent: "HISTORY" },
  { text: "explain the fall of the roman empire", intent: "HISTORY" },
  { text: "what caused the french revolution", intent: "HISTORY" },
  
  // SCIENCE
  { text: "how does photosynthesis work", intent: "SCIENCE" },
  { text: "what is the theory of relativity", intent: "SCIENCE" },
  { text: "why is the sky blue", intent: "SCIENCE" },
  { text: "what are black holes", intent: "SCIENCE" },
  { text: "explain quantum computing in 2 sentences", intent: "SCIENCE" },
  { text: "explain quantum mechanics and qubits", intent: "SCIENCE" },
  { text: "how does dna replication work", intent: "SCIENCE" },
  { text: "explain gravity and general relativity", intent: "SCIENCE" },
  
  // BUSINESS
  { text: "what is inflation", intent: "BUSINESS" },
  { text: "what is bitcoin", intent: "BUSINESS" },
  { text: "what is cryptocurrency", intent: "BUSINESS" },
  { text: "how does bitcoin work", intent: "BUSINESS" },
  { text: "what is blockchain technology", intent: "BUSINESS" },
  { text: "what is ethereum", intent: "BUSINESS" },
  { text: "explain cryptocurrency and bitcoin", intent: "BUSINESS" },
  { text: "what is the stock market", intent: "BUSINESS" },
  { text: "explain the difference between stocks and bonds", intent: "BUSINESS" },
  { text: "how does a central bank work", intent: "BUSINESS" },
  { text: "what is a marketing funnel", intent: "BUSINESS" },
  
  // ENGINEERING
  { text: "how does a jet engine work", intent: "ENGINEERING" },
  { text: "explain ohms law", intent: "ENGINEERING" },
  { text: "what is tensile strength", intent: "ENGINEERING" },
  
  // GAMING
  { text: "what is the best build in elden ring", intent: "GAMING" },
  { text: "how to beat the final boss", intent: "GAMING" },
  { text: "explain the new patch notes", intent: "GAMING" },
  
  // COMPLEX
  { text: "write an essay on the philosophical implications of AI", intent: "COMPLEX" },
  { text: "debate the pros and cons of utilitarianism", intent: "COMPLEX" },
  
  // STANDARD
  { text: "what is the capital of france", intent: "STANDARD" },
  { text: "tell me a joke", intent: "STANDARD" },
  { text: "who wrote harry potter", intent: "STANDARD" },
  { text: "what should i make for dinner", intent: "STANDARD" },
  { text: "how do i bake a cake", intent: "STANDARD" },
  { text: "explain this concept in 2 sentences", intent: "STANDARD" },
  { text: "summarize this for me briefly", intent: "STANDARD" }
];

/**
 * Initializes and trains the Naive Bayes classifier on the first run.
 * Returns the trained instance.
 */
function getClassifier() {
  if (classifierInstance) return classifierInstance;
  
  console.log('[AI Router] Initializing local ML classifier...');
  classifierInstance = new natural.BayesClassifier();
  
  trainingData.forEach(item => {
    classifierInstance.addDocument(item.text.toLowerCase(), item.intent);
  });
  
  classifierInstance.train();
  console.log('[AI Router] ML classifier trained and ready.');
  
  return classifierInstance;
}

/**
 * Classifies a user message using the custom trained ML model.
 * Includes a guard against false-positive CODE classifications when no programming keywords exist.
 */
export function classifyWithML(userMessage) {
  const classifier = getClassifier();
  const lower = userMessage.toLowerCase();
  const prediction = classifier.classify(lower);

  // Prevent general "explain X" queries from being misclassified as CODE
  if (prediction === 'CODE') {
    const codeKeywords = /\b(code|coding|script|function|class|method|variable|bug|debug|error|compile|runtime|javascript|typescript|python|java|rust|golang|c\+\+|html|css|react|vue|angular|node|sql|api|json|xml|regex|array|loop|algorithm|git|docker|terminal|bash|powershell)\b/i;
    if (!codeKeywords.test(lower)) {
      if (/\b(quantum|physics|chemistry|biology|atom|molecule|cell|planet|space|universe|relativity|energy|photon|electron|gravity)\b/i.test(lower)) {
        return 'SCIENCE';
      }
      return 'STANDARD';
    }
  }

  return prediction;
}
