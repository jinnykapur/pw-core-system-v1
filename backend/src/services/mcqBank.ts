import type { Difficulty, McqQuestion } from "../models/TestAttempt";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleWithIndex<T>(arr: T[]) {
  const indexed = arr.map((value, index) => ({ value, index }));
  return shuffle(indexed);
}

function uniqBy<T>(arr: T[], key: (x: T) => string) {
  const out: T[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function qid(skill: string, difficulty: Difficulty, slugPart: string) {
  return `${slug(skill)}:${difficulty}:${slug(slugPart)}`;
}

const SKILL_ALIASES: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  py: "Python",
  python: "Python",
  reactjs: "React",
  react: "React",
  "node": "Node.js",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  docker: "Docker",
  testing: "Testing",
  communication: "Communication",
  git: "Git",
  cybersecurity: "Cybersecurity"
};

function canonicalSkill(skill: string) {
  const key = skill.trim().toLowerCase();
  return SKILL_ALIASES[key] ?? skill.trim();
}

const CORE_TOPICS: Record<string, Record<Difficulty, string[]>> = {
  JavaScript: {
    beginner: ["scope", "closures", "array methods", "async basics", "objects"],
    intermediate: ["event loop", "promises", "error handling", "module design", "performance"],
    advanced: ["memory patterns", "concurrency", "runtime trade-offs", "security", "architecture"]
  },
  TypeScript: {
    beginner: ["types", "interfaces", "unions", "type narrowing", "generics basics"],
    intermediate: ["advanced generics", "utility types", "type guards", "api contracts", "strict config"],
    advanced: ["type-level design", "library typing", "schema-driven typing", "inference limits", "maintainability"]
  },
  Python: {
    beginner: ["data structures", "functions", "exceptions", "modules", "file handling"],
    intermediate: ["comprehensions", "iterators", "virtual environments", "testing", "debugging"],
    advanced: ["concurrency", "profiling", "packaging", "architecture", "security"]
  },
  React: {
    beginner: ["state", "props", "component structure", "forms", "list rendering"],
    intermediate: ["effects", "memoization", "state management", "routing", "api integration"],
    advanced: ["render optimization", "concurrency", "bundle strategy", "testing strategy", "scalability"]
  },
  "Node.js": {
    beginner: ["modules", "async io", "express routing", "middlewares", "env config"],
    intermediate: ["error handling", "authentication", "db integration", "queues", "observability"],
    advanced: ["scaling", "caching", "security hardening", "distributed systems", "reliability"]
  },
  SQL: {
    beginner: ["select basics", "joins", "where clause", "group by", "indexes basics"],
    intermediate: ["query optimization", "transactions", "normalization", "window functions", "constraints"],
    advanced: ["execution plans", "partitioning", "locking", "consistency models", "schema evolution"]
  },
  HTML: {
    beginner: ["semantic tags", "forms", "accessibility", "document structure", "media elements"],
    intermediate: ["a11y patterns", "metadata", "seo basics", "forms validation", "component markup"],
    advanced: ["rendering strategy", "semantics at scale", "performance", "a11y auditing", "spec compliance"]
  },
  CSS: {
    beginner: ["box model", "flexbox", "grid basics", "selectors", "specificity"],
    intermediate: ["responsive design", "layout systems", "custom properties", "animations", "maintainable styles"],
    advanced: ["architecture", "design tokens", "performance", "cross-browser issues", "scalable theming"]
  },
  Testing: {
    beginner: ["unit testing", "test cases", "assertions", "edge cases", "mocking basics"],
    intermediate: ["integration testing", "test pyramid", "coverage strategy", "regression testing", "test data"],
    advanced: ["flaky test reduction", "quality gates", "contract testing", "observability", "release confidence"]
  },
  Communication: {
    beginner: ["clarity", "listening", "feedback", "status updates", "written communication"],
    intermediate: ["stakeholder alignment", "conflict handling", "decision framing", "meeting efficiency", "collaboration"],
    advanced: ["influence", "cross-team leadership", "risk communication", "mentoring", "strategic storytelling"]
  },
  Docker: {
    beginner: ["images vs containers", "dockerfile basics", "volumes", "ports", "environment variables"],
    intermediate: ["layer caching", "multi-stage builds", "compose", "registry workflows", "security basics"],
    advanced: ["runtime hardening", "supply chain", "orchestration patterns", "observability", "cost-performance"]
  },
  Git: {
    beginner: ["commit hygiene", "branching", "merge basics", "rebase basics", "pull requests"],
    intermediate: ["review workflow", "conflict resolution", "history cleanup", "release branching", "ci integration"],
    advanced: ["mono-repo strategy", "policy automation", "large team workflows", "disaster recovery", "traceability"]
  },
  Cybersecurity: {
    beginner: ["least privilege", "authentication", "secure passwords", "input validation", "phishing awareness"],
    intermediate: ["authorization", "owasp", "encryption in transit", "logging", "incident response basics"],
    advanced: ["threat modeling", "defense in depth", "key management", "zero trust", "security architecture"]
  }
};

const BANK: McqQuestion[] = [
  {
    id: qid("Python", "beginner", "list-vs-tuple"),
    skill: "Python",
    topic: "data structures",
    difficulty: "beginner",
    prompt: "What is the key difference between Python lists and tuples?",
    options: ["Tuples are mutable, lists are immutable", "Lists are immutable by default", "Tuples are immutable, lists are mutable", "Lists can only store strings"],
    correctIndex: 2,
    explain: "Use tuples for fixed collections and lists for mutable collections."
  },
  {
    id: qid("Python", "beginner", "exception-handling"),
    skill: "Python",
    topic: "exceptions",
    difficulty: "beginner",
    prompt: "Which pattern is best for handling expected runtime errors in Python?",
    options: ["Use try/except around risky operations", "Ignore all exceptions and continue", "Use assert for production control flow", "Wrap code in a while True loop"],
    correctIndex: 0,
    explain: "try/except is the explicit and safe way to handle expected failures."
  },
  {
    id: qid("Python", "intermediate", "virtualenv"),
    skill: "Python",
    topic: "virtual environments",
    difficulty: "intermediate",
    prompt: "Why should Python projects use virtual environments?",
    options: ["To avoid writing requirements files", "To isolate dependencies per project", "To speed CPU execution", "To replace version control"],
    correctIndex: 1,
    explain: "Isolation prevents dependency conflicts between projects."
  },
  {
    id: qid("SQL", "beginner", "where-vs-having"),
    skill: "SQL",
    topic: "group by",
    difficulty: "beginner",
    prompt: "What is the correct difference between WHERE and HAVING?",
    options: ["HAVING filters rows before grouping", "WHERE filters rows before grouping, HAVING filters groups after aggregation", "They are equivalent", "WHERE can only be used with joins"],
    correctIndex: 1,
    explain: "WHERE applies before aggregate calculation, HAVING after."
  },
  {
    id: qid("SQL", "intermediate", "index-query"),
    skill: "SQL",
    topic: "query optimization",
    difficulty: "intermediate",
    prompt: "Which change often improves query performance on large filtered datasets?",
    options: ["Add an index on frequently filtered columns", "Convert all numbers to strings", "Use SELECT * everywhere", "Disable constraints"],
    correctIndex: 0,
    explain: "Indexes reduce scan cost when used correctly by the optimizer."
  },
  {
    id: qid("React", "beginner", "props"),
    skill: "React",
    topic: "props",
    difficulty: "beginner",
    prompt: "In React, props are best described as:",
    options: ["Mutable local state", "Read-only inputs passed to a component", "Global cache values", "DOM-only metadata"],
    correctIndex: 1,
    explain: "Props flow down and should be treated as read-only by children."
  },
  {
    id: qid("React", "intermediate", "useeffect"),
    skill: "React",
    topic: "effects",
    difficulty: "intermediate",
    prompt: "What is the most common issue when a dependency is missing from useEffect dependency array?",
    options: ["Stale state/props usage and inconsistent behavior", "Bundle build failure", "Loss of JSX support", "Automatic memory cleanup"],
    correctIndex: 0,
    explain: "Missing dependencies can create stale closures and subtle bugs."
  },
  {
    id: qid("JavaScript", "beginner", "closure"),
    skill: "JavaScript",
    topic: "closures",
    difficulty: "beginner",
    prompt: "What is a closure in JavaScript?",
    options: ["A function bundled with its lexical scope", "A class inheritance shortcut", "A JSON serializer", "A promise state"],
    correctIndex: 0,
    explain: "Closures retain access to outer variables even after outer execution ends."
  },
  {
    id: qid("JavaScript", "intermediate", "event-loop"),
    skill: "JavaScript",
    topic: "event loop",
    difficulty: "intermediate",
    prompt: "What does the JavaScript event loop coordinate?",
    options: ["Only DOM rendering", "Sync stack, task queues, and async callbacks", "Git operations", "CSS parsing only"],
    correctIndex: 1,
    explain: "It orchestrates non-blocking async execution with queued callbacks."
  },
  {
    id: qid("TypeScript", "beginner", "union-narrowing"),
    skill: "TypeScript",
    topic: "type narrowing",
    difficulty: "beginner",
    prompt: "How do you safely use a value with union type string | number?",
    options: ["Use it directly without checks", "Use type narrowing with typeof checks", "Cast everything to any", "Disable strict mode"],
    correctIndex: 1,
    explain: "Narrowing gives safe access to type-specific operations."
  },
  {
    id: qid("HTML", "beginner", "semantic-tags"),
    skill: "HTML",
    topic: "semantic tags",
    difficulty: "beginner",
    prompt: "Why are semantic HTML elements important?",
    options: ["They only improve color styling", "They improve structure, accessibility, and maintainability", "They replace CSS", "They reduce internet usage automatically"],
    correctIndex: 1,
    explain: "Semantics improve accessibility and document meaning."
  },
  {
    id: qid("CSS", "beginner", "specificity"),
    skill: "CSS",
    topic: "specificity",
    difficulty: "beginner",
    prompt: "What determines which CSS rule wins when multiple rules match an element?",
    options: ["Alphabetical selector order", "Specificity and source order", "Browser version only", "File name length"],
    correctIndex: 1,
    explain: "Specificity first, then source order breaks ties."
  },
  {
    id: qid("Testing", "beginner", "edge-cases"),
    skill: "Testing",
    topic: "edge cases",
    difficulty: "beginner",
    prompt: "Why include edge cases in test design?",
    options: ["To increase test count only", "To detect failures under uncommon but realistic conditions", "To slow the CI pipeline", "To replace code review"],
    correctIndex: 1,
    explain: "Edge cases surface defects not found by happy-path tests."
  },
  {
    id: qid("Communication", "beginner", "status-update"),
    skill: "Communication",
    topic: "status updates",
    difficulty: "beginner",
    prompt: "What makes a status update most effective for a team?",
    options: ["Lengthy paragraphs without actions", "Clear progress, blockers, and next steps", "Only positive news", "Technical jargon without context"],
    correctIndex: 1,
    explain: "Teams align faster with concise progress, blockers, and actions."
  }
];

type Pattern = {
  prompt: (skill: string, topic: string) => string;
  options: string[];
  correctIndex: number;
  explain: (skill: string, topic: string) => string;
};

const BEGINNER_PATTERNS: Pattern[] = [
  {
    prompt: (skill, topic) => `In ${skill}, which practice most improves fundamentals for ${topic}?`,
    options: [
      "Skip examples and rely only on theory",
      "Build small focused exercises and review mistakes",
      "Avoid feedback until project end",
      "Memorize syntax without usage"
    ],
    correctIndex: 1,
    explain: (skill, topic) => `Consistent practice with review builds real skill in ${topic} for ${skill}.`
  },
  {
    prompt: (skill, topic) => `You are new to ${skill}. What is the best first move for learning ${topic}?`,
    options: [
      "Read random advanced articles only",
      "Start with core concepts, then apply in mini-projects",
      "Ignore official documentation",
      "Copy full solutions without understanding"
    ],
    correctIndex: 1,
    explain: (skill, topic) => `Core concepts plus direct practice is the most reliable learning path for ${topic}.`
  },
  {
    prompt: (skill, topic) => `Which habit reduces beginner errors in ${skill} while working on ${topic}?`,
    options: [
      "No testing or validation",
      "Incremental checks and quick feedback loops",
      "One giant change before run",
      "Disable warnings"
    ],
    correctIndex: 1,
    explain: (skill, topic) => `Incremental validation catches defects early and improves understanding of ${topic}.`
  }
];

const INTERMEDIATE_PATTERNS: Pattern[] = [
  {
    prompt: (skill, topic) => `For intermediate ${skill}, what most improves reliability in ${topic}?`,
    options: [
      "Hardcode values for speed",
      "Use repeatable workflows, tests, and observability",
      "Rely on manual checks only",
      "Defer all refactoring indefinitely"
    ],
    correctIndex: 1,
    explain: (skill, topic) => `Reliability improves when ${topic} is validated through repeatable engineering workflows.`
  },
  {
    prompt: (skill, topic) => `You are optimizing ${topic} in ${skill}. Which decision is strongest?`,
    options: [
      "Pick changes without measurement",
      "Measure baseline, apply targeted optimization, re-measure",
      "Optimize every file equally",
      "Ignore regressions"
    ],
    correctIndex: 1,
    explain: (skill, topic) => `Measure-change-measure avoids blind optimization and keeps ${topic} grounded in data.`
  },
  {
    prompt: (skill, topic) => `What is the best collaboration pattern for complex ${topic} tasks in ${skill}?`,
    options: [
      "No design discussion",
      "Clear contracts, reviews, and documented decisions",
      "Single-person knowledge silo",
      "Skip post-implementation validation"
    ],
    correctIndex: 1,
    explain: (skill, topic) => `Explicit contracts and reviews reduce defects and improve scalability for ${topic}.`
  }
];

const ADVANCED_PATTERNS: Pattern[] = [
  {
    prompt: (skill, topic) => `At an advanced ${skill} level, which trade-off is most critical for ${topic}?`,
    options: [
      "Only short-term speed",
      "Balance performance, maintainability, and security",
      "Only feature volume",
      "Only visual polish"
    ],
    correctIndex: 1,
    explain: (skill, topic) => `Advanced work in ${topic} requires balancing multiple quality attributes, not one.`
  },
  {
    prompt: (skill, topic) => `You are designing a long-term ${topic} strategy in ${skill}. What is best?`,
    options: [
      "Ad hoc decisions with no documentation",
      "Use architecture principles, risk analysis, and measurable goals",
      "Lock all decisions permanently",
      "Avoid feedback loops"
    ],
    correctIndex: 1,
    explain: (skill, topic) => `Long-term quality in ${topic} depends on principled decisions and measurable outcomes.`
  },
  {
    prompt: (skill, topic) => `For advanced ${skill} systems, what protects ${topic} quality over time?`,
    options: [
      "No observability or guardrails",
      "Automation, quality gates, and proactive monitoring",
      "Manual-only deployments",
      "Ignore incident learnings"
    ],
    correctIndex: 1,
    explain: (skill, topic) => `Sustained quality in ${topic} comes from automation plus feedback from production behavior.`
  }
];

function patternsFor(difficulty: Difficulty) {
  if (difficulty === "advanced") return ADVANCED_PATTERNS;
  if (difficulty === "intermediate") return INTERMEDIATE_PATTERNS;
  return BEGINNER_PATTERNS;
}

function fallbackTopics(skill: string, difficulty: Difficulty) {
  const base = [
    "core concepts",
    "problem solving",
    "debugging",
    "testing",
    "performance",
    "maintainability",
    "security",
    "communication"
  ];
  if (difficulty === "beginner") return base.slice(0, 5);
  if (difficulty === "intermediate") return base.slice(1, 7);
  return base.slice(2);
}

function generatedQuestion(skill: string, difficulty: Difficulty, topic: string, i: number): McqQuestion {
  const patterns = patternsFor(difficulty);
  const p = patterns[i % patterns.length];
  return {
    id: qid(skill, difficulty, `generated-${topic}-${i}`),
    skill,
    topic,
    difficulty,
    prompt: p.prompt(skill, topic),
    options: [...p.options],
    correctIndex: p.correctIndex,
    explain: p.explain(skill, topic)
  };
}

function bankFor(skill: string, difficulty: Difficulty) {
  return BANK.filter((q) => q.skill.toLowerCase() === skill.toLowerCase() && q.difficulty === difficulty);
}

function topicsFor(skill: string, difficulty: Difficulty) {
  const canonical = canonicalSkill(skill);
  const fromMap = CORE_TOPICS[canonical]?.[difficulty] ?? fallbackTopics(canonical, difficulty);
  return uniqBy(fromMap, (x) => x.toLowerCase());
}

function distributedSkills(skills: string[]) {
  const canonical = skills.map(canonicalSkill).filter(Boolean);
  const uniq = uniqBy(canonical, (x) => x.toLowerCase());
  return uniq.length ? uniq : ["Problem Solving"];
}

export function generateMcqTest(input: { skills: string[]; difficulty: Difficulty; count: number }) {
  const skills = distributedSkills(input.skills);
  const difficulty = input.difficulty;
  const count = Math.max(8, input.count);

  const picked: McqQuestion[] = [];
  const seen = new Set<string>();

  const shuffledSkills = shuffle(skills);
  const topicCursors = new Map<string, number>();
  const generatedCount = new Map<string, number>();

  while (picked.length < count) {
    const skill = shuffledSkills[picked.length % shuffledSkills.length];

    const curated = shuffle(bankFor(skill, difficulty)).find((q) => !seen.has(q.id));
    if (curated) {
      seen.add(curated.id);
      picked.push(curated);
      continue;
    }

    const topics = topicsFor(skill, difficulty);
    const cursor = topicCursors.get(skill) ?? 0;
    const topic = topics[cursor % topics.length];
    topicCursors.set(skill, cursor + 1);

    const genIdx = generatedCount.get(skill) ?? 0;
    const gq = generatedQuestion(skill, difficulty, topic, genIdx);
    generatedCount.set(skill, genIdx + 1);

    if (!seen.has(gq.id)) {
      seen.add(gq.id);
      picked.push(gq);
    }
  }

  const test = picked.slice(0, count);
  return rebalanceOptionOrder(test);
}

function rebalanceOptionOrder(questions: McqQuestion[]) {
  // Keep correct option positions spread across A/B/C/D to avoid predictable answer patterns.
  const positionCounts = [0, 0, 0, 0];

  return questions.map((q) => {
    const optionCount = q.options.length;
    if (optionCount <= 1) return q;

    const correct = q.options[q.correctIndex];
    const incorrect = q.options.filter((_, i) => i !== q.correctIndex);
    const shuffledIncorrect = shuffle(incorrect);

    const allowed = Array.from({ length: optionCount }, (_, i) => i);
    let minCount = Number.POSITIVE_INFINITY;
    for (const i of allowed) minCount = Math.min(minCount, positionCounts[i] ?? 0);
    const bestSlots = allowed.filter((i) => (positionCounts[i] ?? 0) === minCount);
    const targetCorrectIndex = bestSlots[Math.floor(Math.random() * bestSlots.length)];

    const nextOptions: string[] = [];
    let cursor = 0;
    for (let i = 0; i < optionCount; i++) {
      if (i === targetCorrectIndex) nextOptions.push(correct);
      else nextOptions.push(shuffledIncorrect[cursor++]);
    }

    if (targetCorrectIndex < positionCounts.length) positionCounts[targetCorrectIndex] += 1;

    return {
      ...q,
      options: nextOptions,
      correctIndex: targetCorrectIndex
    };
  });
}
