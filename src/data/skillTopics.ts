export interface SkillTopic {
  level_number: number;
  topic: string;
}

export const SKILL_TOPICS_MAP: Record<number, SkillTopic[]> = {
  // 1: Data Structures & Algorithms
  1: [
    { level_number: 1, topic: "Time & space complexity analysis (Big-O, Big-Theta, Big-Omega notation)" },
    { level_number: 2, topic: "Arrays, dynamic arrays, strings & two-pointer traversal techniques" },
    { level_number: 3, topic: "Singly & doubly linked lists, sentinel nodes, and reversal algorithms" },
    { level_number: 4, topic: "Stack and Queue primitives, monotonic stacks, and circular queues" },
    { level_number: 5, topic: "Hash maps, hash sets, collision resolution & sliding window patterns" },
    { level_number: 6, topic: "Binary trees, binary search trees (BST), DFS and BFS tree traversals" },
    { level_number: 7, topic: "Heaps, priority queues, and divide-and-conquer sorting algorithms" },
    { level_number: 8, topic: "Dynamic programming: 1D/2D memoization, tabulation, knapsack problems" },
    { level_number: 9, topic: "Graph algorithms: Dijkstra, Bellman-Ford, topological sort & Union-Find" },
    { level_number: 10, topic: "Advanced structures: Segment trees, Fenwick trees & Trie pattern matching" }
  ],
  // 2: Object-Oriented Programming
  2: [
    { level_number: 1, topic: "Classes, objects, attributes, methods, and constructor instantiation" },
    { level_number: 2, topic: "Encapsulation, access modifiers (public, private, protected), and getters" },
    { level_number: 3, topic: "Inheritance hierarchies, base/derived classes, and super constructor calls" },
    { level_number: 4, topic: "Polymorphism: method overloading and runtime method overriding" },
    { level_number: 5, topic: "Abstract classes, interfaces, default methods, and multiple inheritance" },
    { level_number: 6, topic: "SOLID principles: Single responsibility and Open/Closed principles" },
    { level_number: 7, topic: "SOLID principles: Liskov substitution, Interface segregation, Dependency inversion" },
    { level_number: 8, topic: "Creational & Structural design patterns: Singleton, Factory, Builder, Adapter" },
    { level_number: 9, topic: "Behavioral patterns: Observer, Strategy, Command & State machine patterns" },
    { level_number: 10, topic: "Domain-Driven Design (DDD), immutable domain models & anti-corruption layers" }
  ],
  // 3: SQL & Databases
  3: [
    { level_number: 1, topic: "Relational fundamentals: Tables, primary keys, foreign keys & basic SELECT queries" },
    { level_number: 2, topic: "Filtering, sorting, and conditional expressions (WHERE, ORDER BY, LIKE, CASE)" },
    { level_number: 3, topic: "Aggregate functions, grouping (GROUP BY, HAVING), and summary metrics" },
    { level_number: 4, topic: "Table joins: INNER, LEFT, RIGHT, FULL OUTER joins, and cross joins" },
    { level_number: 5, topic: "Subqueries, Common Table Expressions (WITH CTE), and window functions" },
    { level_number: 6, topic: "Database schema normalization: 1NF, 2NF, 3NF & BCNF normal forms" },
    { level_number: 7, topic: "Indexing strategies: B-Trees, Hash indexes, composite indexes & query plans" },
    { level_number: 8, topic: "ACID properties, transactions (COMMIT, ROLLBACK) & isolation levels" },
    { level_number: 9, topic: "Stored procedures, triggers, views, materialization & bulk batch operations" },
    { level_number: 10, topic: "Query performance optimization, partition pruning, sharding & replica lag" }
  ],
  // 4: Cloud Fundamentals (AWS/Azure)
  4: [
    { level_number: 1, topic: "Cloud computing fundamentals: IaaS vs PaaS vs SaaS, regions & availability zones" },
    { level_number: 2, topic: "Identity & Access Management (IAM): Users, groups, roles, policies & MFA" },
    { level_number: 3, topic: "Compute primitives: Virtual machines (EC2 / Azure VMs) and image templates" },
    { level_number: 4, topic: "Object and block storage: S3 bucket policies, Azure Blob & persistent disks" },
    { level_number: 5, topic: "Virtual Private Cloud (VPC): Subnets, route tables, internet gateways & CIDR" },
    { level_number: 6, topic: "Load balancers (ALB), auto-scaling groups, health checks & elasticity" },
    { level_number: 7, topic: "Managed relational and NoSQL databases: RDS, DynamoDB, Cosmos DB" },
    { level_number: 8, topic: "Serverless computing: AWS Lambda, Azure Functions, API Gateways & triggers" },
    { level_number: 9, topic: "Infrastructure as Code (IaC): Terraform and CloudFormation basic templates" },
    { level_number: 10, topic: "Multi-region high availability, disaster recovery architectures & FinOps cost control" }
  ],
  // 5: Operating Systems
  5: [
    { level_number: 1, topic: "OS architecture: Kernel vs user space, system calls & interrupt handling" },
    { level_number: 2, topic: "Process management: Process states, PCB, context switching & fork/exec models" },
    { level_number: 3, topic: "CPU scheduling algorithms: FCFS, SJF, Round Robin & Multi-level priority queues" },
    { level_number: 4, topic: "Threads, concurrency, POSIX pthreads, and kernel vs user-level threads" },
    { level_number: 5, topic: "Process synchronization: Race conditions, critical sections, mutexes & semaphores" },
    { level_number: 6, topic: "Classical synchronization problems: Producer-Consumer, Dining Philosophers" },
    { level_number: 7, topic: "Deadlocks: Necessary conditions, prevention, avoidance (Banker's) & detection" },
    { level_number: 8, topic: "Memory management: Paging, segmentation, TLB, page replacement (LRU, FIFO)" },
    { level_number: 9, topic: "Virtual memory, thrashing, page faults & inverted page tables" },
    { level_number: 10, topic: "File systems: Inodes, disk scheduling (SCAN, C-LOOK), I/O subsystems & drivers" }
  ],
  // 6: Computer Networks
  6: [
    { level_number: 1, topic: "Network fundamentals: OSI 7-layer and TCP/IP protocol stack models" },
    { level_number: 2, topic: "Physical & Data Link layer: MAC addressing, framing, CSMA/CD, switches & VLANs" },
    { level_number: 3, topic: "Network layer: IPv4/IPv6 addressing, subnetting, CIDR & NAT translation" },
    { level_number: 4, topic: "Routing protocols: Distance vector, Link state, RIP, OSPF, and BGP routing" },
    { level_number: 5, topic: "Transport layer: TCP 3-way handshake, 4-way termination, and UDP socket basics" },
    { level_number: 6, topic: "TCP flow control (Sliding Window) & congestion control (Slow Start, AIMD)" },
    { level_number: 7, topic: "Application protocols: HTTP/1.1, HTTP/2, HTTP/3 (QUIC), DNS query resolution" },
    { level_number: 8, topic: "Network security: TLS/SSL handshake, symmetric/asymmetric encryption, certificates" },
    { level_number: 9, topic: "Firewalls, reverse proxies, DMZ configurations & load balancer routing" },
    { level_number: 10, topic: "Packet sniffing analysis (Wireshark), CDN caching & DDoS mitigation strategies" }
  ],
  // 7: Aptitude & Logical Reasoning
  7: [
    { level_number: 1, topic: "Basic arithmetic: Percentages, ratios, proportions, averages and unitary methods" },
    { level_number: 2, topic: "Profit and loss, discounts, simple and compound interest calculations" },
    { level_number: 3, topic: "Time, speed, and distance: Trains, boats, streams, relative velocity" },
    { level_number: 4, topic: "Time and work, pipes and cisterns, efficiency-based problem solving" },
    { level_number: 5, topic: "Permutations, combinations, probability and set theory Venn diagrams" },
    { level_number: 6, topic: "Logical sequences, series completion, coding-decoding, and analogy patterns" },
    { level_number: 7, topic: "Blood relations, direction sense tests, seating arrangements (linear & circular)" },
    { level_number: 8, topic: "Syllogisms, deductive reasoning, statement-assumption & inference deduction" },
    { level_number: 9, topic: "Data interpretation: Bar charts, pie charts, tabular analysis & line graphs" },
    { level_number: 10, topic: "Data sufficiency evaluation and speed-math mental calculation optimization" }
  ],
  // 8: Communication & Behavioral
  8: [
    { level_number: 1, topic: "Clear email writing, workplace etiquette, and professional virtual meetings" },
    { level_number: 2, topic: "Active listening techniques, paraphrasing, and non-verbal body language cues" },
    { level_number: 3, topic: "Structured responses using the STAR method (Situation, Task, Action, Result)" },
    { level_number: 4, topic: "Handling self-introduction, career aspirations, and strength/weakness framing" },
    { level_number: 5, topic: "Cross-functional team collaboration, psychological safety, and giving feedback" },
    { level_number: 6, topic: "Constructive conflict resolution, de-escalation, and objection handling" },
    { level_number: 7, topic: "Technical presentation skills: simplifying complex concepts for non-tech audiences" },
    { level_number: 8, topic: "Negotiation fundamentals, prioritization trade-offs, and expectation setting" },
    { level_number: 9, topic: "Leadership qualities, ownership mindset, accountability, and mentorship" },
    { level_number: 10, topic: "Crisis communication, executive stakeholder management, and organizational diplomacy" }
  ],
  // 9: Web Development Basics
  9: [
    { level_number: 1, topic: "Semantic HTML5 structure, forms, inputs, validations & document accessibility (ARIA)" },
    { level_number: 2, topic: "CSS3 fundamentals: Box model, typography, selectors, specificity & cascade rules" },
    { level_number: 3, topic: "Responsive design: Flexbox layouts, CSS Grid systems & fluid media queries" },
    { level_number: 4, topic: "Modern JavaScript: ES6+ syntax, scope, closures, array methods, and DOM APIs" },
    { level_number: 5, topic: "Asynchronous JS: Promises, async/await, Fetch API & JSON data manipulation" },
    { level_number: 6, topic: "Component-based architecture: React JSX, props, state, and lifecycle basics" },
    { level_number: 7, topic: "React hooks: useState, useEffect, useCallback, useMemo, and custom hooks" },
    { level_number: 8, topic: "Client-side routing, single-page application state management & context" },
    { level_number: 9, topic: "Web performance: Lazy loading, code-splitting, asset compression & caching" },
    { level_number: 10, topic: "Web security essentials: CORS, XSS, CSRF prevention, Content Security Policy (CSP)" }
  ],
  // 10: System Design (Intro)
  10: [
    { level_number: 1, topic: "System design basics: Latency vs throughput, SLA/SLO, and availability metrics" },
    { level_number: 2, topic: "Vertical vs horizontal scaling, monolithic vs distributed service architectures" },
    { level_number: 3, topic: "Load balancers: Round-robin, least connections, hashing, Layer 4 vs Layer 7" },
    { level_number: 4, topic: "Caching strategies: Cache-aside, write-through, write-back, Redis & Memcached" },
    { level_number: 5, topic: "CDN architecture, edge caching, and static asset distribution networks" },
    { level_number: 6, topic: "Database scaling: Read replicas, master-slave replication, master-master models" },
    { level_number: 7, topic: "Database sharding, partitioning keys, consistent hashing & rebalancing" },
    { level_number: 8, topic: "Message queues & event streaming: Kafka, RabbitMQ, pub/sub, asynchronous tasks" },
    { level_number: 9, topic: "CAP theorem, PACELC theorem, eventual consistency vs strong consistency" },
    { level_number: 10, topic: "Designing scalable services: URL shortener, rate limiter, or notification system" }
  ],
  // 11: Git & Version Control
  11: [
    { level_number: 1, topic: "Version control concepts: Working directory, staging area, local & remote repos" },
    { level_number: 2, topic: "Basic commands: git init, clone, add, commit, status, diff, log, and checkout" },
    { level_number: 3, topic: "Branching strategies: Creating, switching, deleting branches & Git Flow basics" },
    { level_number: 4, topic: "Remote workflows: git remote, push, fetch, pull, and tracking upstream branches" },
    { level_number: 5, topic: "Merging code: Fast-forward vs 3-way merge, identifying and resolving merge conflicts" },
    { level_number: 6, topic: "Git rebase: Linear commit history, interactive rebase, squashing & fixing commits" },
    { level_number: 7, topic: "Undoing changes: git reset (soft, mixed, hard), git revert, and git restore" },
    { level_number: 8, topic: "Stashing, tags, releases, git cherry-pick, and bisect for binary bug hunting" },
    { level_number: 9, topic: "Pull requests, code review etiquette, branch protection rules & signed commits" },
    { level_number: 10, topic: "CI/CD integration: GitHub Actions triggers, automated lint/test workflows & hooks" }
  ],
  // 12: Generative AI Basics
  12: [
    { level_number: 1, topic: "Generative AI definitions: Discriminative vs Generative models & foundation LLMs" },
    { level_number: 2, topic: "Tokenization, context window length, embeddings, and vector similarity metrics" },
    { level_number: 3, topic: "Prompt engineering: Zero-shot, few-shot prompting, system roles & constraints" },
    { level_number: 4, topic: "Advanced prompting: Chain-of-Thought (CoT), ReAct framework & structured JSON" },
    { level_number: 5, topic: "Model parameters: Temperature, Top-p, Top-k, frequency/presence penalties" },
    { level_number: 6, topic: "Retrieval-Augmented Generation (RAG): Document chunking, indexing & vector search" },
    { level_number: 7, topic: "Function calling, tool use, and integrating APIs with conversational models" },
    { level_number: 8, topic: "AI Safety, hallucination mitigation, guardrails, and prompt injection defense" },
    { level_number: 9, topic: "Evaluation metrics: BLEU, ROUGE, LLM-as-a-judge, latency and token cost analysis" },
    { level_number: 10, topic: "Fine-tuning fundamentals (LoRA, QLoRA) vs in-context learning deployment trade-offs" }
  ]
};
