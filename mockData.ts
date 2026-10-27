
import { CandidateProfile } from "./types";


export const MOCK_PARSED_RESUME: CandidateProfile = {
  source_type: "candidate",
  source_file: "john_doe_resume.pdf",
  name: "John Doe",
  email: "demo",
  phone: "demo",
  summary: "Senior Backend Engineer with 5+ years of experience building scalable microservices and distributed systems.",
  skills: [
    {
      skill_name: "Python",
      category_code: "COD",
      confidence: "high",
      evidence: "5 years of professional experience"
    },
    {
      skill_name: "System Design",
      category_code: "SYSD",
      confidence: "medium",
      evidence: "Designed microservices architecture for payment gateway"
    },
    {
      skill_name: "PostgreSQL",
      category_code: "SQL",
      confidence: "high",
      evidence: "Optimized complex queries reducing latency by 40%"
    }
  ],
  experience: [
    {
      title: "Senior Backend Engineer",
      company: "TechCorp Inc.",
      duration: "Jan 2021 - Present",
      description: "Led a team of 4 developers to rebuild the core billing engine using Python and FastAPI."
    }
  ]
};