import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, Building2, RefreshCw, UserRound, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { JobDescriptionResponse, SkillMatchResult } from "../types/radix";
import { getPlacementBoard, storedJobToDescription, type PlacementBoard, type StoredJob } from "../lib/placementRepository";
import { matchCandidateToJD } from "../lib/skillMatchingEngine";

function scoreOnlyRealEvidence(candidate: PlacementBoard["students"][number]["candidate"], jd: JobDescriptionResponse): SkillMatchResult {
  const result = matchCandidateToJD(candidate, jd);
  const hasRequirements = (jd.required_skills?.length || 0) + (jd.preferred_skills?.length || 0) + (jd.skills?.length || 0) > 0;
  if (!candidate.skills.length || !hasRequirements) {
    result.overall_match_score = 0;
    result.verdict = "Developing Fit";
    result.action_plan = [!candidate.skills.length
      ? "This profile has no extracted skills to compare. Ask the student to upload a readable resume."
      : "This job description has no recognized skill requirements. Review the JD before using its match score."];
  }
  return result;
}

export const SkillMatchingPage: React.FC = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState<PlacementBoard | null>(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPlacementBoard();
      setBoard(data);
      setSelectedJobId((previous) => data.jobs.some((job) => job.id === previous) ? previous : (data.jobs[0]?.id || ""));
    } catch (err: any) {
      setError(err?.message || "Could not load placement matching data.");
      setBoard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selectedJob: StoredJob | undefined = board?.jobs.find((job) => job.id === selectedJobId);
  const rankedCandidates = useMemo(() => {
    if (!board || !selectedJob) return [];
    const jd = storedJobToDescription(selectedJob);
    return board.students
      .map(({ profile, candidate }) => ({ profile, match: scoreOnlyRealEvidence(candidate, jd), candidate }))
      .sort((a, b) => b.match.overall_match_score - a.match.overall_match_score);
  }, [board, selectedJob]);

  const positiveMatches = rankedCandidates.filter((item) => item.match.overall_match_score > 0);

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-700">Role 5 · Placement Matching</span>
            <span className="text-xs font-medium text-slate-500">Company / saved JD → actual student profiles</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">Company-to-Student Skill Matcher</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Select a job description saved in Supabase to rank real student profiles by evidence-backed skill coverage. This page does not create sample candidates or sample jobs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate("/jd-analytics")} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
            <BriefcaseBusiness className="h-4 w-4" /> Upload a JD
          </button>
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50">
            <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} /> Refresh
          </button>
        </div>
      </header>

      {error && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="flex-1">
              <h2 className="font-bold text-amber-950">Real matching data is unavailable</h2>
              <p className="mt-1 text-sm leading-6 text-amber-900">{error}</p>
              <p className="mt-2 text-xs leading-5 text-amber-800">Sign in with an account that has been granted placement-staff access. The database migration must also be applied to the connected Supabase project.</p>
              <button onClick={() => navigate("/auth?next=/skill-matching")} className="mt-4 rounded-lg bg-amber-900 px-3 py-2 text-xs font-bold text-white">Sign in / Change account</button>
            </div>
          </div>
        </section>
      )}

      {loading && <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading real jobs and student records from Supabase…</div>}

      {!loading && !error && board && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active saved jobs</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{board.jobs.length}</p>
              <p className="mt-1 text-xs text-slate-500">From uploaded and saved JDs</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Student profiles</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{board.students.length}</p>
              <p className="mt-1 text-xs text-slate-500">Actual database-backed profiles</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Students with a skill match</p>
              <p className="mt-2 text-3xl font-extrabold text-emerald-700">{positiveMatches.length}</p>
              <p className="mt-1 text-xs text-slate-500">For the selected job only</p>
            </div>
          </section>

          {board.jobs.length === 0 ? (
            <section className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <Building2 className="mx-auto h-9 w-9 text-slate-400" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">No real job descriptions have been published</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">Upload a company JD using an authorized placement-staff account. Its extracted requirements will be saved and matched against existing student profiles automatically.</p>
              <button onClick={() => navigate("/jd-analytics")} className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">Upload first JD</button>
            </section>
          ) : (
            <>
              <section className="rounded-xl border border-slate-200 bg-white p-5">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="saved-job-select">Choose company / saved job description</label>
                <select id="saved-job-select" value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900">
                  {board.jobs.map((job) => (
                    <option key={job.id} value={job.id}>{(job.company_name || "Company not identified") + " — " + (job.role_title || job.source_file || "Role not identified")}</option>
                  ))}
                </select>
                {selectedJob && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
                      <div>
                        <h2 className="font-bold text-slate-900">{selectedJob.company_name || "Company not identified in JD"}</h2>
                        <p className="mt-1 text-sm text-slate-700">{selectedJob.role_title || "Job title not extracted"}</p>
                        <p className="mt-1 text-xs text-slate-500">{selectedJob.location || "Location not specified"} · {selectedJob.source_file || "Uploaded job description"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(selectedJob.required_skills || []).map((skill) => <span key={"r-" + skill} className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">Required: {skill}</span>)}
                      {(selectedJob.preferred_skills || []).map((skill) => <span key={"p-" + skill} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">Preferred: {skill}</span>)}
                      {!selectedJob.required_skills?.length && !selectedJob.preferred_skills?.length && <p className="text-xs text-rose-700">No recognized skill requirements found in this saved JD. Match scores will remain zero until the JD requirements are corrected.</p>}
                    </div>
                  </div>
                )}
              </section>

              {board.students.length === 0 ? (
                <section className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                  <UserRound className="mx-auto h-9 w-9 text-slate-400" />
                  <h2 className="mt-4 text-lg font-bold text-slate-900">No student resumes have been submitted yet</h2>
                  <p className="mt-2 text-sm text-slate-600">As soon as students upload resumes, profiles and skills will be stored in Supabase and available for matching here.</p>
                </section>
              ) : rankedCandidates.length === 0 || positiveMatches.length === 0 ? (
                <section className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
                  <AlertTriangle className="mx-auto h-7 w-7 text-amber-700" />
                  <h2 className="mt-3 font-bold text-amber-950">No evidence-backed matches for this job yet</h2>
                  <p className="mt-2 text-sm text-amber-900">No student skills were recognized for this job, or the saved JD contains no recognized requirements. Nothing has been filled in with demo candidates.</p>
                </section>
              ) : (
                <section className="space-y-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">Ranked student candidates</h2>
                      <p className="mt-1 text-xs text-slate-500">Sorted by the match score computed from each stored student skill record and the selected saved JD.</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{positiveMatches.length} candidate(s) with a positive match</span>
                  </div>
                  {rankedCandidates.map(({ profile, candidate, match }) => (
                    <article key={profile.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <UserRound className="h-5 w-5 text-emerald-700" />
                            <h3 className="text-base font-bold text-slate-900">{profile.full_name || "Name not present in resume"}</h3>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{profile.email || "No email in profile"}{profile.phone ? " · " + profile.phone : ""}</p>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{profile.summary || "No summary was extracted from the submitted resume."}</p>
                        </div>
                        <div className="min-w-24 rounded-lg bg-emerald-50 px-4 py-3 text-center">
                          <p className="text-2xl font-extrabold text-emerald-700">{match.overall_match_score}%</p>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">{match.verdict}</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                        <div>
                          <p className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Matched skills ({match.matched_skills.length})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.matched_skills.length ? match.matched_skills.map((skill) => <span key={skill.skill_name} title={skill.evidence || ""} className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">{skill.skill_name}</span>) : <span className="text-xs text-slate-500">No skill evidence matched.</span>}
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 flex items-center gap-2 text-xs font-bold text-rose-800"><XCircle className="h-4 w-4" /> Missing required skills ({match.missing_required_skills.length})</p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.missing_required_skills.length ? match.missing_required_skills.map((skill) => <span key={skill} className="rounded-md bg-rose-50 px-2.5 py-1 text-xs text-rose-800">{skill}</span>) : <span className="text-xs text-slate-500">No missing required skills identified.</span>}
                          </div>
                        </div>
                      </div>
                      {match.action_plan.length > 0 && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-700">{match.action_plan.join(" ")}</p>}
                    </article>
                  ))}
                </section>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
