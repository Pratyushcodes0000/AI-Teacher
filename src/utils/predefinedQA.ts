// Predefined Q&A for multiple research domains
export interface PredefinedQA {
  question: string;
  answer: string;
}

export const ML_RESEARCH_QA: PredefinedQA[] = [
  {
    question: "Difference between traditional programming and machine learning?",
    answer: "In traditional programming, humans write explicit rules and logic (Program + Data → Output). In machine learning, the system learns rules automatically by analyzing patterns in data (Data + Output → Program). Thus, ML automates the process of creating programs."
  },
  {
    question: "What are the main types of machine learning methods discussed in the paper?",
    answer: "**Supervised Learning** – Uses labeled data to predict outcomes (e.g., fraud detection, spam filtering).\n\n**Unsupervised Learning** – Works on unlabeled data to find hidden structures (e.g., clustering customers).\n\n**Semi-Supervised Learning** – Uses a small set of labeled data with a large set of unlabeled data (cost-effective).\n\n**Reinforcement Learning** – Uses trial-and-error with rewards to learn the best actions (used in robotics, gaming, navigation)."
  },
  {
    question: "What are the three key elements of every machine learning algorithm?",
    answer: "**Representation** – How knowledge is represented (decision trees, neural networks, SVMs, etc.).\n\n**Evaluation** – How models are judged (accuracy, recall, cost, etc.).\n\n**Optimization** – How models are improved (gradient descent, convex optimization, etc.)."
  },
  {
    question: "What real-world applications of machine learning are highlighted in the paper?",
    answer: "• **Data security** (detecting malware, breaches)\n• **Financial trading** (predicting stock market trends)\n• **Healthcare** (early disease detection, risk prediction)\n• **Fraud detection** (PayPal, banking systems)\n• **Recommendation systems** (Netflix, Amazon)\n• **Natural Language Processing** (chatbots, translation)\n• **Smart cars and IoT** (autonomous vehicles)"
  },
  {
    question: "What are the main advantages of machine learning mentioned?",
    answer: "• Identifies hidden trends & patterns in large datasets\n• Automation with minimal human intervention\n• Continuous improvement over time\n• Handles multi-dimensional, complex data effectively\n• Wide applications across industries"
  },
  {
    question: "What are some limitations or disadvantages of machine learning?",
    answer: "• Requires large, unbiased datasets\n• Time and computationally expensive\n• Difficult to interpret complex models\n• Prone to bias and errors if training data is flawed"
  },
  {
    question: "Which programming languages are most used in machine learning according to the paper?",
    answer: "• **Python** – General-purpose, flexible, widely used\n• **R** – Best for statistics and data analysis\n• **Java** – Used with big data tools like Hadoop, Kafka\n• **MATLAB** – Strong for numerical and engineering tasks\n• **Scala** – Functional + object-oriented, scalable\n• **C/C++** – For performance-heavy ML models\n• **SQL** – For handling large databases and ETL processes"
  },
  {
    question: "Which companies are highlighted as using ML, and how?",
    answer: "• **Yelp** – Image classification\n• **Pinterest** – Content discovery & recommendation\n• **Facebook** – Chatbots & spam filtering\n• **Twitter** – Timeline curation\n• **Google** – DeepMind, NLP, search ranking\n• **HubSpot** – Predictive lead scoring\n• **IBM Watson** – Healthcare and business applications"
  },
  {
    question: "How does reinforcement learning differ from supervised learning?",
    answer: "**Supervised Learning:** Learns from labeled data with known outcomes.\n\n**Reinforcement Learning:** Learns through trial and error, guided by rewards/punishments, without predefined \"correct\" answers.\n\n**Introduction**\n\nMachine Learning (ML) is a subset of Artificial Intelligence that enables systems to learn from data without explicit programming.\n\nIt relies on algorithms and statistical models to detect patterns and make predictions.\n\nApplications span across healthcare, finance, security, robotics, marketing, and more."
  },
  {
    question: "Summarize the document",
    answer: "## Machine Learning (ML) Overview\n\nML, a branch of AI, enables systems to learn from data and make predictions without explicit programming. It uses algorithms to detect patterns and improve performance.\n\n### Key Concepts\n• **Traditional vs ML:** In ML, data + output → machine learns rules\n• **Core Elements:** Representation, evaluation, optimization\n\n### Types of ML\n• **Supervised:** Learns from labeled data\n• **Unsupervised:** Finds patterns in unlabeled data\n• **Semi-Supervised:** Mix of both, cost-effective\n• **Reinforcement:** Learns via rewards/trial-and-error\n\n### Applications\nSecurity (malware detection), finance (fraud, trading), healthcare (diagnosis), marketing (recommendations), smart systems (self-driving, NLP), robotics, and more.\n\n### Pros\n• Pattern detection in big data\n• Reduces human effort\n• Continuous improvement\n• Handles complex data\n• Broad industry use\n\n### Cons\n• Requires large, unbiased data\n• High computational cost\n• Hard-to-interpret results\n• Error-prone with flawed data\n\n### Tools\nPopular languages: Python, R, Java, MATLAB, Scala, C/C++, SQL.\n\n### Companies Using ML\nGoogle, Facebook, Twitter, Pinterest, Yelp, IBM Watson, HubSpot.\n\n### Conclusion\nML enhances decision-making, prediction, and automation. Supervised suits small datasets, unsupervised for large, and reinforcement for robotics. With deep learning, ML continues to transform industries and daily life."
  }
];

// Nuclear Physics Q&A Knowledge Base
export const NUCLEAR_PHYSICS_QA: PredefinedQA[] = [
  {
    question: "What does nuclear physics study and what are its main applications?",
    answer: "Nuclear physics studies the properties of atomic nuclei, the particles inside them, their interactions, radioactivity, and nuclear reactions. Applications include medical isotopes, MRI, material identification, carbon dating, power generation (fission & fusion), and nuclear weapons."
  },
  {
    question: "What are the basic properties of nuclei?",
    answer: "A nucleus consists of protons (positive) and neutrons (neutral). Isotopes have the same number of protons (Z) but different neutrons (N). Nuclear size is given by R = R₀A¹ᐟ³ with R₀ ≈ 1.2×10⁻¹⁵ m. Nuclear density is extremely high (~10¹⁷ kg/m³) and nearly constant for all nuclei."
  },
  {
    question: "What is nuclear binding energy and why is it important?",
    answer: "Nuclear binding energy is the energy gained when nucleons form a nucleus. The binding energy per nucleon is nearly constant, indicating the nuclear force is short-ranged and saturated. It measures nuclear stability—the higher the binding energy per nucleon, the more stable the nucleus."
  },
  {
    question: "What are the characteristics of the nuclear force?",
    answer: "The nuclear force is very strong and short-ranged (~10⁻¹⁵ m), independent of charge, and favors spin-paired nucleons. It is saturated, meaning each nucleon interacts mainly with its nearest neighbors."
  },
  {
    question: "What is radioactivity and what are its types?",
    answer: "Radioactivity is the spontaneous emission of particles or radiation from unstable nuclei. Types include:\n- Alpha decay: emission of a ²⁴He nucleus\n- Beta decay: β⁻ (n → p + e⁻ + ν̅), β⁺ (p → n + e⁺ + ν)\n- Electron capture: p + e⁻ → n + ν\n- Gamma decay: emission of high-energy photons\nRadioactive decay is statistical, characterized by decay constant (λ), half-life (T₁/₂), and mean life (τ)."
  },
  {
    question: "What are nuclear reactions and what is the Q-value?",
    answer: "Nuclear reactions involve rearrangement of nucleons by bombardment. The Q-value determines if a reaction is exoergic (Q>0) or endoergic (Q<0). Neutron-induced reactions are used in fission, fusion, and analysis (e.g., neutron activation analysis)."
  },
  {
    question: "Explain nuclear fission and its use in reactors.",
    answer: "Fission is the splitting of heavy nuclei (e.g., U-235) into lighter nuclei, releasing neutrons and about 200 MeV of energy. A chain reaction is sustained if the reproduction constant k ≈ 1. Nuclear reactors use moderators (to slow neutrons) and control rods (to absorb excess neutrons) to control the reaction."
  },
  {
    question: "What is nuclear fusion and why is it important?",
    answer: "Fusion is the combination of light nuclei (e.g., D + T) to form He-4 and a neutron, releasing 17.6 MeV. Fusion releases more energy per nucleon than fission and uses abundant, clean fuel, but requires extremely high temperatures (T > 10⁷ K) and plasma confinement. Fusion powers the sun."
  },
  {
    question: "How does Carbon-14 dating work?",
    answer: "Living organisms maintain a fixed ratio of ¹⁴C/¹²C. After death, ¹⁴C decays (T₁/₂ = 5730 years). Measuring the reduced ratio in remains reveals their age. Activity is measured in curie (Ci)."
  },
  {
    question: "Summarize the differences between fission and fusion, and their significance.",
    answer: "Fission splits heavy nuclei into medium-mass nuclei and energy (e.g., U-235), used in reactors and weapons. Fusion combines light nuclei into heavier ones, releasing more energy per nucleon (e.g., D + T → He), with cleaner fuel and less radioactive waste. Fusion is more promising for future power but is technologically challenging."
  }
];

// Combined knowledge base
export const ALL_QA_DOMAINS = [
  ...ML_RESEARCH_QA,
  ...NUCLEAR_PHYSICS_QA
];

/**
 * Matches a user question against predefined Q&A pairs from all domains
 * Returns the predefined answer if a match is found, null otherwise
 */
export function findPredefinedAnswer(userQuestion: string): string | null {
  const question = userQuestion.toLowerCase().trim();
  
  // Direct keyword matching for ML research questions
  const mlKeywordMatches: { [key: string]: string } = {
    // Traditional vs ML
    'traditional programming': ML_RESEARCH_QA[0].answer,
    'difference between traditional': ML_RESEARCH_QA[0].answer,
    'traditional vs machine learning': ML_RESEARCH_QA[0].answer,
    'traditional vs ml': ML_RESEARCH_QA[0].answer,
    
    // Types of ML
    'types of machine learning': ML_RESEARCH_QA[1].answer,
    'kinds of machine learning': ML_RESEARCH_QA[1].answer,
    'main types': ML_RESEARCH_QA[1].answer,
    'supervised unsupervised': ML_RESEARCH_QA[1].answer,
    
    // Key elements
    'three key elements': ML_RESEARCH_QA[2].answer,
    'key elements': ML_RESEARCH_QA[2].answer,
    'representation evaluation optimization': ML_RESEARCH_QA[2].answer,
    
    // Applications
    'real-world applications': ML_RESEARCH_QA[3].answer,
    'applications of machine learning': ML_RESEARCH_QA[3].answer,
    'applications highlighted': ML_RESEARCH_QA[3].answer,
    'use cases': ML_RESEARCH_QA[3].answer,
    
    // Advantages
    'advantages of machine learning': ML_RESEARCH_QA[4].answer,
    'benefits of machine learning': ML_RESEARCH_QA[4].answer,
    'main advantages': ML_RESEARCH_QA[4].answer,
    'pros of machine learning': ML_RESEARCH_QA[4].answer,
    
    // Disadvantages
    'limitations': ML_RESEARCH_QA[5].answer,
    'disadvantages': ML_RESEARCH_QA[5].answer,
    'cons of machine learning': ML_RESEARCH_QA[5].answer,
    'problems with machine learning': ML_RESEARCH_QA[5].answer,
    
    // Programming languages
    'programming languages': ML_RESEARCH_QA[6].answer,
    'languages used': ML_RESEARCH_QA[6].answer,
    'python r java': ML_RESEARCH_QA[6].answer,
    'most used languages': ML_RESEARCH_QA[6].answer,
    
    // Companies
    'companies using ml': ML_RESEARCH_QA[7].answer,
    'companies highlighted': ML_RESEARCH_QA[7].answer,
    'google facebook twitter': ML_RESEARCH_QA[7].answer,
    'which companies': ML_RESEARCH_QA[7].answer,
    
    // Reinforcement vs Supervised
    'reinforcement learning differ': ML_RESEARCH_QA[8].answer,
    'reinforcement vs supervised': ML_RESEARCH_QA[8].answer,
    'difference reinforcement': ML_RESEARCH_QA[8].answer,
    
    // Summary
    'summarize': ML_RESEARCH_QA[9].answer,
    'summary': ML_RESEARCH_QA[9].answer,
    'overview': ML_RESEARCH_QA[9].answer,
    'summarize the document': ML_RESEARCH_QA[9].answer,
    'give me a summary': ML_RESEARCH_QA[9].answer,
    'what is this document about': ML_RESEARCH_QA[9].answer,
  };

  // Direct keyword matching for Nuclear Physics questions
  const nuclearKeywordMatches: { [key: string]: string } = {
    // Nuclear physics overview
    'nuclear physics study': NUCLEAR_PHYSICS_QA[0].answer,
    'what does nuclear physics': NUCLEAR_PHYSICS_QA[0].answer,
    'nuclear physics applications': NUCLEAR_PHYSICS_QA[0].answer,
    'applications of nuclear physics': NUCLEAR_PHYSICS_QA[0].answer,
    
    // Nuclear properties
    'basic properties of nuclei': NUCLEAR_PHYSICS_QA[1].answer,
    'properties of nuclei': NUCLEAR_PHYSICS_QA[1].answer,
    'nuclear properties': NUCLEAR_PHYSICS_QA[1].answer,
    'protons neutrons': NUCLEAR_PHYSICS_QA[1].answer,
    'isotopes': NUCLEAR_PHYSICS_QA[1].answer,
    'nuclear size': NUCLEAR_PHYSICS_QA[1].answer,
    'nuclear density': NUCLEAR_PHYSICS_QA[1].answer,
    
    // Binding energy
    'nuclear binding energy': NUCLEAR_PHYSICS_QA[2].answer,
    'binding energy': NUCLEAR_PHYSICS_QA[2].answer,
    'nuclear stability': NUCLEAR_PHYSICS_QA[2].answer,
    'binding energy per nucleon': NUCLEAR_PHYSICS_QA[2].answer,
    
    // Nuclear force
    'nuclear force': NUCLEAR_PHYSICS_QA[3].answer,
    'characteristics of nuclear force': NUCLEAR_PHYSICS_QA[3].answer,
    'strong force': NUCLEAR_PHYSICS_QA[3].answer,
    'short-ranged force': NUCLEAR_PHYSICS_QA[3].answer,
    
    // Radioactivity
    'radioactivity': NUCLEAR_PHYSICS_QA[4].answer,
    'types of radioactivity': NUCLEAR_PHYSICS_QA[4].answer,
    'alpha decay': NUCLEAR_PHYSICS_QA[4].answer,
    'beta decay': NUCLEAR_PHYSICS_QA[4].answer,
    'gamma decay': NUCLEAR_PHYSICS_QA[4].answer,
    'radioactive decay': NUCLEAR_PHYSICS_QA[4].answer,
    'half-life': NUCLEAR_PHYSICS_QA[4].answer,
    
    // Nuclear reactions
    'nuclear reactions': NUCLEAR_PHYSICS_QA[5].answer,
    'q-value': NUCLEAR_PHYSICS_QA[5].answer,
    'exoergic endoergic': NUCLEAR_PHYSICS_QA[5].answer,
    'neutron-induced reactions': NUCLEAR_PHYSICS_QA[5].answer,
    
    // Fission
    'nuclear fission': NUCLEAR_PHYSICS_QA[6].answer,
    'fission': NUCLEAR_PHYSICS_QA[6].answer,
    'nuclear reactors': NUCLEAR_PHYSICS_QA[6].answer,
    'chain reaction': NUCLEAR_PHYSICS_QA[6].answer,
    'u-235': NUCLEAR_PHYSICS_QA[6].answer,
    'uranium-235': NUCLEAR_PHYSICS_QA[6].answer,
    'moderators control rods': NUCLEAR_PHYSICS_QA[6].answer,
    
    // Fusion
    'nuclear fusion': NUCLEAR_PHYSICS_QA[7].answer,
    'fusion': NUCLEAR_PHYSICS_QA[7].answer,
    'deuterium tritium': NUCLEAR_PHYSICS_QA[7].answer,
    'plasma confinement': NUCLEAR_PHYSICS_QA[7].answer,
    'fusion energy': NUCLEAR_PHYSICS_QA[7].answer,
    'sun energy': NUCLEAR_PHYSICS_QA[7].answer,
    
    // Carbon dating
    'carbon-14 dating': NUCLEAR_PHYSICS_QA[8].answer,
    'carbon dating': NUCLEAR_PHYSICS_QA[8].answer,
    'c-14 dating': NUCLEAR_PHYSICS_QA[8].answer,
    'radiocarbon dating': NUCLEAR_PHYSICS_QA[8].answer,
    'age determination': NUCLEAR_PHYSICS_QA[8].answer,
    
    // Fission vs Fusion
    'fission vs fusion': NUCLEAR_PHYSICS_QA[9].answer,
    'difference between fission and fusion': NUCLEAR_PHYSICS_QA[9].answer,
    'fission fusion comparison': NUCLEAR_PHYSICS_QA[9].answer,
    'nuclear energy comparison': NUCLEAR_PHYSICS_QA[9].answer,
  };
  
  // Check for ML keyword matches first
  for (const [keywords, answer] of Object.entries(mlKeywordMatches)) {
    if (question.includes(keywords)) {
      return answer;
    }
  }
  
  // Check for Nuclear Physics keyword matches
  for (const [keywords, answer] of Object.entries(nuclearKeywordMatches)) {
    if (question.includes(keywords)) {
      return answer;
    }
  }
  
  // Fuzzy matching for direct questions (similarity scoring) across all domains
  let bestMatch: { answer: string; score: number; domain: string } | null = null;
  
  for (const qa of ALL_QA_DOMAINS) {
    const score = calculateSimilarity(question, qa.question.toLowerCase());
    
    // If similarity is high enough (80%+), consider it a match
    if (score > 0.8 && (!bestMatch || score > bestMatch.score)) {
      const domain = ML_RESEARCH_QA.includes(qa) ? 'ML Research' : 'Nuclear Physics';
      bestMatch = { answer: qa.answer, score, domain };
    }
  }
  
  return bestMatch ? bestMatch.answer : null;
}

/**
 * Simple similarity calculation based on common words
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords.length / totalWords;
}

/**
 * Check if the question is asking about any research paper content
 */
export function isResearchPaperQuestion(question: string): boolean {
  return isMLResearchQuestion(question) || isNuclearPhysicsQuestion(question);
}

/**
 * Check if the question is asking about ML research paper content
 */
export function isMLResearchQuestion(question: string): boolean {
  const mlKeywords = [
    'machine learning', 'ml', 'supervised', 'unsupervised', 'reinforcement',
    'algorithm', 'traditional programming', 'representation', 'evaluation',
    'optimization', 'neural networks', 'deep learning', 'artificial intelligence',
    'ai', 'data science', 'python', 'applications', 'advantages', 'disadvantages'
  ];
  
  const lowerQuestion = question.toLowerCase();
  return mlKeywords.some(keyword => lowerQuestion.includes(keyword));
}

/**
 * Check if the question is asking about nuclear physics content
 */
export function isNuclearPhysicsQuestion(question: string): boolean {
  const nuclearKeywords = [
    'nuclear', 'nuclei', 'nucleus', 'fission', 'fusion', 'radioactive', 'radioactivity',
    'alpha decay', 'beta decay', 'gamma decay', 'binding energy', 'nuclear force',
    'proton', 'neutron', 'isotope', 'uranium', 'plutonium', 'carbon-14', 'c-14',
    'half-life', 'decay constant', 'nuclear reactor', 'chain reaction', 'moderator',
    'control rod', 'q-value', 'exoergic', 'endoergic', 'deuterium', 'tritium',
    'plasma', 'nuclear physics', 'atomic nucleus', 'nuclear reaction'
  ];
  
  const lowerQuestion = question.toLowerCase();
  return nuclearKeywords.some(keyword => lowerQuestion.includes(keyword));
}