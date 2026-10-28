import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { CandidateProfile, JobDescriptionResponse, SkillItem, SkillMatchResult } from "../types/radix";
import { normalizeSkill } from "./radixCatalog";
import { matchCandidateToJD } from "./skillMatchingEngine";

export interface StoredJob {
  id: string;
  company_id: number | null;
  company_name: string;
  role_title: string;
  source_file: string | null;
  description: string;
  description_summary: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_years_required: number | null;
  location: string | null;
  extracted_data: Record<string, unknown>;
  status: "active" | "closed" | "draft";
  created_at: string;
}

export interface JobRecommendation {
  job: StoredJob;
  match: SkillMatchResult;
}

export interface StoredStudent {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  summary: string;
  source_file: string | null;
  experience: CandidateProfile["experience"];
  education: CandidateProfile["education"];
  certifications: string[];
  skills: SkillItem[];
}

function requireConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify and redeploy.");
  }
}

export async function requireSignedInUser() {
  requireConfigured();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error("Could not verify your sign-in: " + error.message);
  if (!data.user) throw new Error("Sign in first. Open /auth, then upload your resume or continue the placement workflow.");
  return data.user;
}

export async function isPlacementStaff(): Promise<boolean> {
  const user = await requireSignedInUser();
  const { data, error } = await supabase
    .from("placement_staff")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Could not check placement staff access: " + error.message);
  return Boolean(data);
}

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function jobToDescription(job: StoredJob): JobDescriptionResponse {
  const required = Array.isArray(job.required_skills) ? job.required_skills : [];
  const preferred = Array.isArray(job.preferred_skills) ? job.preferred_skills : [];
  const skillNames = Array.from(new Set([...required, ...preferred]));
  const skills: SkillItem[] = skillNames.map((name) => {
    const normalized = normalizeSkill(name);
    return {
      skill_name: normalized.canonicalName,
      category_code: normalized.category || "OTHER",
      confidence: required.includes(name) ? "high" : "medium",
      evidence: required.includes(name) ? "Required skill extracted from saved job description" : "Preferred skill extracted from saved job description",
    };
  });
  return {
    source_type: "jd",
    source_file: job.source_file || undefined,
    company: job.company_name || undefined,
    role: job.role_title || undefined,
    skills,
    required_skills: required,
    preferred_skills: preferred,
    experience_years_required: job.experience_years_required === null ? undefined : job.experience_years_required,
    description_summary: job.description_summary || "",
  };
}

function rowToCandidate(row: any, skills: SkillItem[]): CandidateProfile {
  return {
    source_type: "candidate",
    source_file: row.source_file || undefined,
    name: row.full_name || "",
    email: row.email || "",
    phone: row.phone || "",
    summary: row.summary || "",
    skills,
    experience: Array.isArray(row.experience) ? row.experience : [],
    education: Array.isArray(row.education) ? row.education : [],
    certifications: Array.isArray(row.certifications) ? row.certifications : [],
  };
}

function mapSkillRows(rows: any[]): SkillItem[] {
  return rows.map((row) => ({
    skill_name: row.skill_name,
    category_code: row.category_code || "OTHER",
    confidence: row.confidence || "medium",
    evidence: row.evidence || "",
    level: row.level ?? undefined,
  })) as SkillItem[];
}

/** Persist the authenticated student's actual resume, profile and parsed skills. */
export async function saveStudentResume(profile: CandidateProfile, file?: File): Promise<JobRecommendation[]> {
  const user = await requireSignedInUser();
  let storagePath: string | null = null;

  if (file) {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    storagePath = user.id + "/" + Date.now() + "-" + cleanName;
    const { error: storageError } = await supabase.storage
      .from("student-resumes")
      .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });
    if (storageError) throw new Error("Resume could not be stored in private Supabase storage: " + storageError.message);
  } else {
    const { data: previous, error: previousError } = await supabase
      .from("student_profiles")
      .select("resume_storage_path")
      .eq("id", user.id)
      .maybeSingle();
    if (previousError) throw new Error("Could not load existing student profile: " + previousError.message);
    storagePath = previous?.resume_storage_path || null;
  }

  const profileRow = {
    id: user.id,
    full_name: (profile.name || "").trim(),
    email: (profile.email || user.email || "").trim(),
    phone: (profile.phone || "").trim(),
    summary: (profile.summary || "").trim(),
    source_file: profile.source_file || (file ? file.name : null),
    resume_storage_path: storagePath,
    experience: profile.experience || [],
    education: profile.education || [],
    certifications: profile.certifications || [],
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase.from("student_profiles").upsert(profileRow, { onConflict: "id" });
  if (profileError) throw new Error("Student profile was parsed but could not be saved to the database: " + profileError.message);

  const { error: deleteSkillsError } = await supabase.from("student_skills").delete().eq("student_id", user.id);
  if (deleteSkillsError) throw new Error("Profile saved but the old skill records could not be refreshed: " + deleteSkillsError.message);

  const skillRows = (profile.skills || [])
    .filter((skill) => Boolean(skill.skill_name && skill.skill_name.trim()))
    .map((skill) => ({
      student_id: user.id,
      skill_name: skill.skill_name.trim(),
      category_code: skill.category_code || "OTHER",
      confidence: skill.confidence || "medium",
      evidence: skill.evidence || "",
      level: skill.level ?? null,
    }));

  if (skillRows.length) {
    const { error: insertSkillsError } = await supabase.from("student_skills").insert(skillRows);
    if (insertSkillsError) throw new Error("Profile saved but skills could not be stored: " + insertSkillsError.message);
  }

  return getStudentJobRecommendations(profile);
}

/** Save the parsed JD as a durable job record and refresh matches for real student profiles. */
export async function saveJobDescription(jd: JobDescriptionResponse, sourceText: string, fileName?: string): Promise<StoredJob> {
  const user = await requireSignedInUser();
  const allowed = await isPlacementStaff();
  if (!allowed) throw new Error("Only an authorized placement staff account can publish job descriptions. Sign in with a placement account or ask the administrator to grant placement staff access.");

  const description = (sourceText || "").trim();
  if (!description) throw new Error("The extracted job description is empty; there is nothing to save.");
  const contentHash = await sha256(description);
  let companyId: number | null = null;
  const companyName = (jd.company || "").trim();
  if (companyName) {
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("company_id")
      .ilike("name", companyName)
      .maybeSingle();
    if (!companyError && company?.company_id !== undefined && company?.company_id !== null) {
      companyId = Number(company.company_id);
    }
  }

  const locationMatch = description.match(/(?:job\s+location|work\s+location|location)\s*[:\-]\s*([^\r\n]+)/i);
  const row = {
    company_id: companyId,
    company_name: companyName,
    role_title: (jd.role || "").trim(),
    source_file: fileName || jd.source_file || null,
    description,
    description_summary: jd.description_summary || "",
    required_skills: jd.required_skills || (jd.skills || []).map((skill) => skill.skill_name),
    preferred_skills: jd.preferred_skills || [],
    experience_years_required: Number.isFinite(jd.experience_years_required) ? jd.experience_years_required : null,
    location: locationMatch?.[1]?.trim() || null,
    extracted_data: jd,
    content_hash: contentHash,
    created_by: user.id,
    status: "active",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("job_postings")
    .upsert(row, { onConflict: "created_by,content_hash" })
    .select("*")
    .single();
  if (error) throw new Error("JD was analyzed but could not be saved to the database: " + error.message);

  const savedJob = data as StoredJob;
  await refreshMatchesForJob(savedJob);
  return savedJob;
}

async function refreshMatchesForJob(job: StoredJob): Promise<void> {
  const { data: profiles, error: profilesError } = await supabase
    .from("student_profiles")
    .select("*");
  if (profilesError) throw new Error("Job saved, but student profiles could not be loaded for matching: " + profilesError.message);
  if (!profiles || profiles.length === 0) return;

  const studentIds = profiles.map((profile: any) => profile.id);
  const { data: skills, error: skillsError } = await supabase
    .from("student_skills")
    .select("*")
    .in("student_id", studentIds);
  if (skillsError) throw new Error("Job saved, but student skills could not be loaded for matching: " + skillsError.message);

  const skillsByStudent = new Map<string, SkillItem[]>();
  for (const row of skills || []) {
    const list = skillsByStudent.get(row.student_id) || [];
    list.push(...mapSkillRows([row]));
    skillsByStudent.set(row.student_id, list);
  }
  const jd = jobToDescription(job);
  const records = profiles.map((profile: any) => {
    const candidate = rowToCandidate(profile, skillsByStudent.get(profile.id) || []);
    const match = matchCandidateToJD(candidate, jd);
    return {
      student_id: profile.id,
      job_id: job.id,
      match_score: match.overall_match_score,
      matched_skills: match.matched_skills,
      missing_required_skills: match.missing_required_skills,
      missing_preferred_skills: match.missing_preferred_skills,
      action_plan: match.action_plan,
      updated_at: new Date().toISOString(),
    };
  });
  const { error: matchError } = await supabase.from("job_matches").upsert(records, { onConflict: "student_id,job_id" });
  if (matchError) throw new Error("Job saved, but recommendations could not be refreshed: " + matchError.message);
}

/** Return and persist ranked jobs using only real, active rows in public.job_postings. */
export async function getStudentJobRecommendations(profile: CandidateProfile): Promise<JobRecommendation[]> {
  const user = await requireSignedInUser();
  const { data: jobs, error } = await supabase
    .from("job_postings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Could not load real job descriptions from the database: " + error.message);
  if (!jobs?.length) return [];

  const recommendations = (jobs as StoredJob[])
    .map((job) => ({ job, match: matchCandidateToJD(profile, jobToDescription(job)) }))
    .sort((a, b) => b.match.overall_match_score - a.match.overall_match_score);

  const rows = recommendations.map(({ job, match }) => ({
    student_id: user.id,
    job_id: job.id,
    match_score: match.overall_match_score,
    matched_skills: match.matched_skills,
    missing_required_skills: match.missing_required_skills,
    missing_preferred_skills: match.missing_preferred_skills,
    action_plan: match.action_plan,
    updated_at: new Date().toISOString(),
  }));
  const { error: matchesError } = await supabase.from("job_matches").upsert(rows, { onConflict: "student_id,job_id" });
  if (matchesError) throw new Error("Jobs were found, but match recommendations could not be saved: " + matchesError.message);
  return recommendations.slice(0, 10);
}

export interface PlacementBoard {
  jobs: StoredJob[];
  students: Array<{ profile: StoredStudent; candidate: CandidateProfile }>;
}

/** Load the actual job catalogue and actual student records for authorized placement staff. */
export async function getPlacementBoard(): Promise<PlacementBoard> {
  const staff = await isPlacementStaff();
  if (!staff) throw new Error("Placement staff access is required to view and match student records.");
  const [jobsResult, profilesResult] = await Promise.all([
    supabase.from("job_postings").select("*").eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("student_profiles").select("*").order("full_name", { ascending: true }),
  ]);
  if (jobsResult.error) throw new Error("Could not load saved job descriptions: " + jobsResult.error.message);
  if (profilesResult.error) throw new Error("Could not load student profiles: " + profilesResult.error.message);

  const profiles = profilesResult.data || [];
  let skillRows: any[] = [];
  if (profiles.length) {
    const { data, error } = await supabase.from("student_skills").select("*").in("student_id", profiles.map((p: any) => p.id));
    if (error) throw new Error("Could not load stored student skills: " + error.message);
    skillRows = data || [];
  }

  const skillsByStudent = new Map<string, SkillItem[]>();
  for (const row of skillRows) {
    const list = skillsByStudent.get(row.student_id) || [];
    list.push(...mapSkillRows([row]));
    skillsByStudent.set(row.student_id, list);
  }

  return {
    jobs: (jobsResult.data || []) as StoredJob[],
    students: profiles.map((row: any) => {
      const skills = skillsByStudent.get(row.id) || [];
      return {
        profile: {
          id: row.id,
          full_name: row.full_name || "",
          email: row.email || "",
          phone: row.phone || "",
          summary: row.summary || "",
          source_file: row.source_file || null,
          experience: Array.isArray(row.experience) ? row.experience : [],
          education: Array.isArray(row.education) ? row.education : [],
          certifications: Array.isArray(row.certifications) ? row.certifications : [],
          skills,
        },
        candidate: rowToCandidate(row, skills),
      };
    }),
  };
}

export function storedJobToDescription(job: StoredJob): JobDescriptionResponse {
  return jobToDescription(job);
}
