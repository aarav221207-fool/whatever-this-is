// src/lib/radixCatalog.ts
import { RadixCategoryCode } from "../types/radix";

export interface CanonicalSkillDefinition {
  canonicalName: string;
  category: RadixCategoryCode;
  aliases: string[];
}

export const CANONICAL_SKILLS: CanonicalSkillDefinition[] = [
  // COD: Coding & Languages
  { canonicalName: "Python", category: "COD", aliases: ["python", "python3", "py"] },
  { canonicalName: "JavaScript", category: "COD", aliases: ["javascript", "js", "ecmascript"] },
  { canonicalName: "TypeScript", category: "COD", aliases: ["typescript", "ts"] },
  { canonicalName: "Java", category: "COD", aliases: ["java", "core java", "j2ee"] },
  { canonicalName: "C++", category: "COD", aliases: ["c++", "cpp", "c plus plus"] },
  { canonicalName: "C#", category: "COD", aliases: ["c#", "csharp", "c sharp", ".net"] },
  { canonicalName: "Go", category: "COD", aliases: ["go", "golang"] },
  { canonicalName: "Rust", category: "COD", aliases: ["rust", "rustlang"] },
  { canonicalName: "Kotlin", category: "COD", aliases: ["kotlin"] },
  { canonicalName: "Swift", category: "COD", aliases: ["swift"] },
  { canonicalName: "Ruby", category: "COD", aliases: ["ruby", "ruby on rails"] },
  { canonicalName: "PHP", category: "COD", aliases: ["php"] },
  { canonicalName: "Scala", category: "COD", aliases: ["scala"] },
  { canonicalName: "C", category: "COD", aliases: ["c programming", "ansi c"] },

  // DSA: Data Structures & Algorithms
  {
    canonicalName: "Data Structures & Algorithms",
    category: "DSA",
    aliases: ["dsa", "data structures", "algorithms", "data structures & algorithms", "algo"],
  },
  { canonicalName: "Dynamic Programming", category: "DSA", aliases: ["dp", "dynamic programming"] },
  { canonicalName: "Graph Algorithms", category: "DSA", aliases: ["graph algorithms", "dijkstra", "bfs/dfs", "tree traversal"] },
  { canonicalName: "Algorithmic Complexity", category: "DSA", aliases: ["big-o", "time complexity", "space complexity", "algorithmic complexity"] },

  // OOD: Object-Oriented Design
  {
    canonicalName: "Object-Oriented Design",
    category: "OOD",
    aliases: ["ood", "oop", "object oriented programming", "object-oriented design", "object oriented design"],
  },
  { canonicalName: "Design Patterns", category: "OOD", aliases: ["design patterns", "gang of four", "gof patterns"] },
  { canonicalName: "SOLID Principles", category: "OOD", aliases: ["solid", "solid principles"] },

  // APTI: Aptitude
  { canonicalName: "Problem Solving", category: "APTI", aliases: ["problem solving", "analytical skills", "analytical thinking", "critical thinking"] },
  { canonicalName: "Aptitude", category: "APTI", aliases: ["aptitude", "quantitative reasoning", "quantitative aptitude", "logical reasoning"] },

  // COMM: Communication & Behavioral
  { canonicalName: "Communication Skills", category: "COMM", aliases: ["communication", "communication skills", "verbal communication", "written communication"] },
  { canonicalName: "Team Collaboration", category: "COMM", aliases: ["collaboration", "teamwork", "cross-functional collaboration", "team player"] },
  { canonicalName: "Leadership", category: "COMM", aliases: ["leadership", "mentoring", "technical leadership"] },
  { canonicalName: "Stakeholder Management", category: "COMM", aliases: ["stakeholder management", "client interaction", "presentation skills"] },

  // AI: Artificial Intelligence & Machine Learning
  { canonicalName: "Machine Learning", category: "AI", aliases: ["machine learning", "ml", "statistical learning"] },
  { canonicalName: "Deep Learning", category: "AI", aliases: ["deep learning", "neural networks", "cnn", "rnn", "transformers"] },
  { canonicalName: "Natural Language Processing", category: "AI", aliases: ["nlp", "natural language processing", "llm", "large language models"] },
  { canonicalName: "PyTorch", category: "AI", aliases: ["pytorch", "torch"] },
  { canonicalName: "TensorFlow", category: "AI", aliases: ["tensorflow", "keras"] },
  { canonicalName: "Generative AI", category: "AI", aliases: ["generative ai", "genai", "prompt engineering", "langchain", "rag"] },

  // CLOUD: Cloud & DevOps
  { canonicalName: "Amazon Web Services", category: "CLOUD", aliases: ["aws", "amazon web services", "ec2", "s3", "lambda"] },
  { canonicalName: "Microsoft Azure", category: "CLOUD", aliases: ["azure", "microsoft azure", "azure devops"] },
  { canonicalName: "Google Cloud Platform", category: "CLOUD", aliases: ["gcp", "google cloud", "google cloud platform"] },
  { canonicalName: "Docker", category: "CLOUD", aliases: ["docker", "containerization", "containers"] },
  { canonicalName: "Kubernetes", category: "CLOUD", aliases: ["kubernetes", "k8s"] },
  { canonicalName: "Terraform", category: "CLOUD", aliases: ["terraform", "iac", "infrastructure as code"] },
  { canonicalName: "CI/CD", category: "CLOUD", aliases: ["ci/cd", "ci cd", "continuous integration", "github actions", "jenkins"] },

  // SQL: SQL & Databases
  { canonicalName: "PostgreSQL", category: "SQL", aliases: ["postgres", "postgresql", "psql"] },
  { canonicalName: "MySQL", category: "SQL", aliases: ["mysql"] },
  { canonicalName: "SQL", category: "SQL", aliases: ["sql", "structured query language", "relational database", "rdbms"] },
  { canonicalName: "MongoDB", category: "SQL", aliases: ["mongodb", "mongo", "nosql"] },
  { canonicalName: "Redis", category: "SQL", aliases: ["redis", "caching", "in-memory database"] },
  { canonicalName: "Database Optimization", category: "SQL", aliases: ["query optimization", "indexing", "database tuning", "database sharding"] },

  // SWE: Software Engineering & Web
  { canonicalName: "React", category: "SWE", aliases: ["react", "react.js", "reactjs"] },
  { canonicalName: "Node.js", category: "SWE", aliases: ["node", "node.js", "nodejs", "express", "express.js"] },
  { canonicalName: "REST APIs", category: "SWE", aliases: ["rest", "rest api", "restful", "api development", "graphql"] },
  { canonicalName: "Git", category: "SWE", aliases: ["git", "version control", "github", "gitlab"] },
  { canonicalName: "Unit Testing", category: "SWE", aliases: ["unit testing", "testing", "jest", "pytest", "vitest", "tdd"] },
  { canonicalName: "HTML/CSS", category: "SWE", aliases: ["html", "css", "html5", "css3", "tailwind", "tailwindcss"] },

  // SYSD: System Design
  { canonicalName: "System Design", category: "SYSD", aliases: ["system design", "distributed systems", "software architecture"] },
  { canonicalName: "Microservices", category: "SYSD", aliases: ["microservices", "microservice architecture"] },
  { canonicalName: "Message Queues", category: "SYSD", aliases: ["kafka", "rabbitmq", "message queue", "pub/sub", "event driven"] },
  { canonicalName: "Load Balancing", category: "SYSD", aliases: ["load balancing", "reverse proxy", "nginx", "api gateway"] },

  // NETW: Computer Networks
  { canonicalName: "Computer Networks", category: "NETW", aliases: ["networking", "computer networks", "tcp/ip", "udp", "osi model"] },
  { canonicalName: "HTTP/HTTPS", category: "NETW", aliases: ["http", "https", "ssl/tls", "dns", "websockets"] },

  // OS: Operating Systems
  { canonicalName: "Linux", category: "OS", aliases: ["linux", "unix", "bash", "shell scripting", "ubuntu", "debian"] },
  { canonicalName: "Operating Systems", category: "OS", aliases: ["operating systems", "concurrency", "multithreading", "processes", "memory management"] }
];

// Fast lookup map: alias -> CanonicalSkillDefinition
const ALIAS_LOOKUP = new Map<string, CanonicalSkillDefinition>();

CANONICAL_SKILLS.forEach((def) => {
  ALIAS_LOOKUP.set(def.canonicalName.toLowerCase(), def);
  def.aliases.forEach((alias) => {
    ALIAS_LOOKUP.set(alias.toLowerCase(), def);
  });
});

export function normalizeSkill(rawName: string): { canonicalName: string; category: RadixCategoryCode } {
  if (!rawName) {
    return { canonicalName: "General", category: "OTHER" };
  }
  const clean = rawName.trim().toLowerCase();
  const match = ALIAS_LOOKUP.get(clean);
  if (match) {
    return { canonicalName: match.canonicalName, category: match.category };
  }

  // Substring check for compound terms
  for (const def of CANONICAL_SKILLS) {
    for (const alias of def.aliases) {
      if (clean.includes(alias) && alias.length >= 3) {
        return { canonicalName: def.canonicalName, category: def.category };
      }
    }
  }

  // Capitalize title
  const formatted = rawName.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  return { canonicalName: formatted, category: "OTHER" };
}
