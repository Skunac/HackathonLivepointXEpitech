// Technical domains that are considered appropriate for the assistant
export const technicalDomains = [
  "programming",
  "software development",
  "computer science",
  "web development",
  "databases",
  "networking",
  "cybersecurity",
  "operating systems",
  "artificial intelligence",
  "machine learning",
  "data science",
  "cloud computing",
  "devops",
  "system administration",
  "it infrastructure",
  "hardware",
  "software engineering",
  "algorithms",
  "data structures",
  "computer architecture",
  "programming languages",
  "version control",
  "computer graphics",
  "game development",
  "mobile development",
  "embedded systems",
  "robotics",
  "automation"
];

// Technical keywords that strongly indicate a technical question
export const technicalKeywords = [
  // Languages
  "javascript", "python", "java", "c++", "c#", "php", "ruby", "go", "rust", "swift",
  "kotlin", "typescript", "html", "css", "sql", "bash", "shell", "powershell", "perl",
  "scala", "r", "matlab", "assembly", "fortran", "cobol", "lisp", "haskell", "erlang",

  // Frameworks & Libraries
  "react", "angular", "vue", "node", "express", "django", "flask", "spring", "laravel",
  "rails", "pytorch", "tensorflow", "keras", "pandas", "numpy", "scikit-learn", "matplotlib",
  "bootstrap", "jquery", "next.js", "gatsby", "svelte", "tailwind", "redux", "dotnet",

  // Databases
  "sql", "mysql", "postgresql", "mongodb", "nosql", "database", "oracle", "sqlite",
  "mariadb", "redis", "cassandra", "elasticsearch", "neo4j", "dynamodb", "firestore",

  // Development concepts
  "api", "rest", "graphql", "json", "xml", "ajax", "http", "https", "websocket",
  "algorithm", "data structure", "interface", "inheritance", "polymorphism", "encapsulation",
  "abstraction", "function", "variable", "class", "object", "method", "recursion",
  "iteration", "loop", "conditional", "asynchronous", "synchronous", "thread", "process",
  "compile", "runtime", "debug", "exception", "error", "stack", "heap", "memory",

  // Tools & Systems
  "git", "github", "gitlab", "bitbucket", "docker", "kubernetes", "jenkins", "ci/cd",
  "linux", "unix", "windows", "macos", "ubuntu", "debian", "fedora", "centos",
  "apache", "nginx", "iis", "ssh", "ftp", "aws", "azure", "gcp", "terminal", "command line",

  // Technical components
  "server", "client", "frontend", "backend", "full-stack", "microservice", "monolith",
  "middleware", "cache", "load balancer", "proxy", "cdn", "dns", "domain", "hosting",
  "repository", "webhook", "firewall", "vpn", "router", "switch", "gateway", "protocol"
];

/**
 * Check if a text contains technical keywords
 */
export function containsTechnicalKeywords(text: string): boolean {
  const lowercaseText = text.toLowerCase();

  return technicalKeywords.some(keyword => 
    lowercaseText.includes(keyword.toLowerCase())
  );
}

/**
 * Quick check if a question is likely technical based on keywords
 * This is a preliminary filter before using the more expensive LLM classification
 */
export function isLikelyTechnical(question: string): boolean {
  // If it contains technical keywords, it's likely technical
  if (containsTechnicalKeywords(question)) {
    return true;
  }

  // Additional heuristics
  const lowercaseQuestion = question.toLowerCase();

  // Questions about "how to" with technical context
  if (lowercaseQuestion.includes("how to") && 
      technicalDomains.some(domain => lowercaseQuestion.includes(domain.toLowerCase()))) {
    return true;
  }

  // Questions about specific technical errors
  if (lowercaseQuestion.includes("error") || 
      lowercaseQuestion.includes("bug") || 
      lowercaseQuestion.includes("exception")) {
    return true;
  }

  // By default, we can't be sure, so we'll let the classifier decide
  return false;
}