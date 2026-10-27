"""Normalization and canonicalization utilities for RADIX Resume Parser.
Handles skill name canonicalization, RADIX category mapping, deduplication, and confidence assessment.
"""
import re
from typing import Dict, List, Optional, Tuple

from app.schemas import ExtractionConfidence, Skill, SkillCategory

# Canonical skill dictionary mapping normalized lower-case keys to (Canonical Name, Category Code)
CANONICAL_SKILL_CATALOG: Dict[str, Tuple[str, SkillCategory]] = {
    # COD - Coding / Programming Languages
    "python": ("Python", SkillCategory.COD),
    "python3": ("Python", SkillCategory.COD),
    "c++": ("C++", SkillCategory.COD),
    "cpp": ("C++", SkillCategory.COD),
    "c": ("C", SkillCategory.COD),
    "java": ("Java", SkillCategory.COD),
    "c#": ("C#", SkillCategory.COD),
    "csharp": ("C#", SkillCategory.COD),
    "javascript": ("JavaScript", SkillCategory.COD),
    "js": ("JavaScript", SkillCategory.COD),
    "typescript": ("TypeScript", SkillCategory.COD),
    "ts": ("TypeScript", SkillCategory.COD),
    "go": ("Go", SkillCategory.COD),
    "golang": ("Go", SkillCategory.COD),
    "rust": ("Rust", SkillCategory.COD),
    "ruby": ("Ruby", SkillCategory.COD),
    "php": ("PHP", SkillCategory.COD),
    "kotlin": ("Kotlin", SkillCategory.COD),
    "swift": ("Swift", SkillCategory.COD),
    "scala": ("Scala", SkillCategory.COD),
    "r": ("R", SkillCategory.COD),
    "dart": ("Dart", SkillCategory.COD),
    "html": ("HTML", SkillCategory.COD),
    "css": ("CSS", SkillCategory.COD),
    "html/css": ("HTML/CSS", SkillCategory.COD),
    "bash": ("Bash", SkillCategory.COD),
    "shell": ("Shell Scripting", SkillCategory.COD),
    "shell scripting": ("Shell Scripting", SkillCategory.COD),

    # DSA - Data Structures & Algorithms
    "dsa": ("Data Structures & Algorithms", SkillCategory.DSA),
    "data structures": ("Data Structures", SkillCategory.DSA),
    "algorithms": ("Algorithms", SkillCategory.DSA),
    "data structures & algorithms": ("Data Structures & Algorithms", SkillCategory.DSA),
    "data structures and algorithms": ("Data Structures & Algorithms", SkillCategory.DSA),
    "competitive programming": ("Competitive Programming", SkillCategory.DSA),
    "dynamic programming": ("Dynamic Programming", SkillCategory.DSA),
    "graph algorithms": ("Graph Algorithms", SkillCategory.DSA),
    "trees": ("Trees", SkillCategory.DSA),
    "sorting & searching": ("Sorting & Searching", SkillCategory.DSA),

    # OOD - Object-Oriented Design
    "ood": ("Object-Oriented Design", SkillCategory.OOD),
    "oop": ("Object-Oriented Programming", SkillCategory.OOD),
    "object-oriented design": ("Object-Oriented Design", SkillCategory.OOD),
    "object oriented design": ("Object-Oriented Design", SkillCategory.OOD),
    "object-oriented programming": ("Object-Oriented Programming", SkillCategory.OOD),
    "design patterns": ("Design Patterns", SkillCategory.OOD),
    "low-level design": ("Low-Level Design", SkillCategory.OOD),
    "lld": ("Low-Level Design", SkillCategory.OOD),
    "solid principles": ("SOLID Principles", SkillCategory.OOD),

    # APTI - Aptitude & Problem Solving
    "aptitude": ("Aptitude", SkillCategory.APTI),
    "problem solving": ("Problem Solving", SkillCategory.APTI),
    "analytical skills": ("Analytical Skills", SkillCategory.APTI),
    "logical reasoning": ("Logical Reasoning", SkillCategory.APTI),
    "quantitative analysis": ("Quantitative Analysis", SkillCategory.APTI),

    # COMM - Communication & Soft Skills
    "communication": ("Communication", SkillCategory.COMM),
    "technical writing": ("Technical Writing", SkillCategory.COMM),
    "presentation": ("Presentation", SkillCategory.COMM),
    "mentoring": ("Mentoring", SkillCategory.COMM),
    "leadership": ("Leadership", SkillCategory.COMM),
    "collaboration": ("Collaboration", SkillCategory.COMM),

    # AI - Artificial Intelligence / Machine Learning / Data Science
    "ai": ("Artificial Intelligence", SkillCategory.AI),
    "artificial intelligence": ("Artificial Intelligence", SkillCategory.AI),
    "machine learning": ("Machine Learning", SkillCategory.AI),
    "ml": ("Machine Learning", SkillCategory.AI),
    "deep learning": ("Deep Learning", SkillCategory.AI),
    "dl": ("Deep Learning", SkillCategory.AI),
    "nlp": ("Natural Language Processing", SkillCategory.AI),
    "natural language processing": ("Natural Language Processing", SkillCategory.AI),
    "computer vision": ("Computer Vision", SkillCategory.AI),
    "scikit-learn": ("scikit-learn", SkillCategory.AI),
    "sklearn": ("scikit-learn", SkillCategory.AI),
    "pandas": ("pandas", SkillCategory.AI),
    "numpy": ("NumPy", SkillCategory.AI),
    "tensorflow": ("TensorFlow", SkillCategory.AI),
    "pytorch": ("PyTorch", SkillCategory.AI),
    "data science": ("Data Science", SkillCategory.AI),
    "statistics": ("Statistics", SkillCategory.AI),
    "a/b testing": ("A/B Testing", SkillCategory.AI),
    "ab testing": ("A/B Testing", SkillCategory.AI),
    "feature engineering": ("Feature Engineering", SkillCategory.AI),
    "anomaly detection": ("Anomaly Detection", SkillCategory.AI),
    "logistic regression": ("Logistic Regression", SkillCategory.AI),
    "collaborative filtering": ("Collaborative Filtering", SkillCategory.AI),
    "recommendation engine": ("Recommendation Engine", SkillCategory.AI),

    # CLOUD - Cloud Computing & Infrastructure
    "cloud": ("Cloud Computing", SkillCategory.CLOUD),
    "cloud computing": ("Cloud Computing", SkillCategory.CLOUD),
    "aws": ("AWS", SkillCategory.CLOUD),
    "amazon web services": ("AWS", SkillCategory.CLOUD),
    "azure": ("Azure", SkillCategory.CLOUD),
    "microsoft azure": ("Azure", SkillCategory.CLOUD),
    "gcp": ("GCP", SkillCategory.CLOUD),
    "google cloud": ("Google Cloud", SkillCategory.CLOUD),
    "google cloud platform": ("Google Cloud", SkillCategory.CLOUD),
    "docker": ("Docker", SkillCategory.CLOUD),
    "kubernetes": ("Kubernetes", SkillCategory.CLOUD),
    "k8s": ("Kubernetes", SkillCategory.CLOUD),
    "terraform": ("Terraform", SkillCategory.CLOUD),

    # SQL - Databases & SQL
    "sql": ("SQL", SkillCategory.SQL),
    "mysql": ("MySQL", SkillCategory.SQL),
    "postgresql": ("PostgreSQL", SkillCategory.SQL),
    "postgres": ("PostgreSQL", SkillCategory.SQL),
    "psql": ("PostgreSQL", SkillCategory.SQL),
    "sqlite": ("SQLite", SkillCategory.SQL),
    "oracle db": ("Oracle Database", SkillCategory.SQL),
    "oracle database": ("Oracle Database", SkillCategory.SQL),
    "sql server": ("SQL Server", SkillCategory.SQL),
    "relational database": ("Relational Databases", SkillCategory.SQL),
    "database normalization": ("Database Normalization", SkillCategory.SQL),

    # SWE - Software Engineering Practices & Tooling
    "swe": ("Software Engineering", SkillCategory.SWE),
    "software engineering": ("Software Engineering", SkillCategory.SWE),
    "git": ("Git", SkillCategory.SWE),
    "github": ("GitHub", SkillCategory.SWE),
    "version control": ("Version Control", SkillCategory.SWE),
    "ci/cd": ("CI/CD", SkillCategory.SWE),
    "continuous integration": ("Continuous Integration", SkillCategory.SWE),
    "unit testing": ("Unit Testing", SkillCategory.SWE),
    "testing": ("Testing", SkillCategory.SWE),
    "agile": ("Agile", SkillCategory.SWE),
    "scrum": ("Scrum", SkillCategory.SWE),
    "ticketing tools": ("Ticketing Tools", SkillCategory.SWE),
    "helpdesk": ("IT Helpdesk / Support", SkillCategory.SWE),
    "troubleshooting": ("Troubleshooting", SkillCategory.SWE),

    # SYSD - System Design & Distributed Systems
    "system design": ("System Design", SkillCategory.SYSD),
    "distributed systems": ("Distributed Systems", SkillCategory.SYSD),
    "microservices": ("Microservices", SkillCategory.SYSD),
    "scalability": ("Scalability", SkillCategory.SYSD),
    "horizontal scaling": ("Horizontal Scaling", SkillCategory.SYSD),
    "caching": ("Caching", SkillCategory.SYSD),
    "redis": ("Redis", SkillCategory.SYSD),
    "pub-sub": ("Pub-Sub Architecture", SkillCategory.SYSD),
    "kafka": ("Kafka", SkillCategory.SYSD),
    "rabbitmq": ("RabbitMQ", SkillCategory.SYSD),
    "rate limiter": ("Rate Limiting", SkillCategory.SYSD),
    "rate limiting": ("Rate Limiting", SkillCategory.SYSD),
    "api design": ("API Design", SkillCategory.SYSD),
    "rest api": ("REST APIs", SkillCategory.SYSD),
    "rest apis": ("REST APIs", SkillCategory.SYSD),

    # NETW - Networking
    "networking": ("Computer Networks", SkillCategory.NETW),
    "computer networks": ("Computer Networks", SkillCategory.NETW),
    "networking fundamentals": ("Networking Fundamentals", SkillCategory.NETW),
    "cisco networking": ("Cisco Networking", SkillCategory.NETW),
    "tcp/ip": ("TCP/IP", SkillCategory.NETW),
    "http/https": ("HTTP/HTTPS", SkillCategory.NETW),
    "dns": ("DNS", SkillCategory.NETW),
    "websockets": ("WebSockets", SkillCategory.NETW),

    # OS - Operating Systems
    "operating systems": ("Operating Systems", SkillCategory.OS),
    "os": ("Operating Systems", SkillCategory.OS),
    "linux": ("Linux", SkillCategory.OS),
    "unix": ("Unix", SkillCategory.OS),
    "process scheduling": ("Process Scheduling", SkillCategory.OS),
    "multithreading": ("Multithreading", SkillCategory.OS),
    "concurrency": ("Concurrency", SkillCategory.OS),
    "memory management": ("Memory Management", SkillCategory.OS),

    # OTHER - Non-technical, Business, Analytics, Visualizations
    "power bi": ("Power BI", SkillCategory.OTHER),
    "powerbi": ("Power BI", SkillCategory.OTHER),
    "excel": ("MS Excel", SkillCategory.OTHER),
    "ms excel": ("MS Excel", SkillCategory.OTHER),
    "tableau": ("Tableau", SkillCategory.OTHER),
    "data visualization": ("Data Visualization", SkillCategory.OTHER),
}

# Confidence hierarchy for deduplication
CONFIDENCE_RANK = {
    ExtractionConfidence.high: 3,
    ExtractionConfidence.medium: 2,
    ExtractionConfidence.low: 1,
}


def normalize_skill_name(raw_name: str) -> str:
    """Normalize skill name spelling and casing variations."""
    cleaned = raw_name.strip()
    key = cleaned.lower()
    if key in CANONICAL_SKILL_CATALOG:
        return CANONICAL_SKILL_CATALOG[key][0]
    return cleaned


def resolve_category(skill_name: str, candidate_category: Optional[str] = None) -> SkillCategory:
    """Assign appropriate SkillCategory. Prioritizes canonical knowledge catalog over raw strings."""
    key = skill_name.strip().lower()
    if key in CANONICAL_SKILL_CATALOG:
        return CANONICAL_SKILL_CATALOG[key][1]

    if candidate_category:
        try:
            return SkillCategory(candidate_category.upper().strip())
        except (ValueError, AttributeError):
            pass

    return SkillCategory.OTHER


def deduplicate_skills(skills: List[Skill]) -> List[Skill]:
    """Deduplicate genuine duplicate skills without removing distinct skills.

    When duplicate skills exist, retain the highest confidence record,
    and preserve the richest evidence.
    """
    dedup_map: Dict[str, Skill] = {}

    for s in skills:
        key = s.skill_name.strip().lower()
        if key not in dedup_map:
            dedup_map[key] = s
        else:
            existing = dedup_map[key]
            existing_rank = CONFIDENCE_RANK.get(existing.confidence, 1)
            new_rank = CONFIDENCE_RANK.get(s.confidence, 1)

            if new_rank > existing_rank:
                # Replace with higher confidence version
                dedup_map[key] = s
            elif new_rank == existing_rank:
                # Same confidence: preserve longer evidence if different
                if len(s.evidence) > len(existing.evidence):
                    dedup_map[key] = s

    return list(dedup_map.values())

