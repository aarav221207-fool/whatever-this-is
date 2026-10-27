import React, { useState, useEffect } from "react";


// --- 1. Types & Constants (Inline for single-file portability) ---
type RadixCategory = "COD" | "DSA" | "OOD" | "APTI" | "COMM" | "AI" | "CLOUD" | "SQL" | "SWE" | "SYSD" | "NETW" | "OS" | "OTHER";


interface Skill { skill_name: string; category_code: RadixCategory; confidence: "high" | "medium" | "low"; evidence?: string; }
interface Exp { title: string; company: string; duration: string; description: string; }
interface Profile { source_type: "candidate"; source_file?: string; name: string; email: string; phone: string; summary: string; skills: Skill[]; experience: Exp[]; }


const CATEGORIES: RadixCategory[] = ["COD", "DSA", "OOD", "APTI", "COMM", "AI", "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS", "OTHER"];
const INPUT_CLS = "w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none";
const BTN_CLS = "px-3 py-1.5 rounded-md text-sm font-medium transition-colors";


const MOCK_DATA: Profile = {
  source_type: "candidate", source_file: "resume.pdf", name: "John Doe", email: "john@email.com", phone: "555-1234",
  summary: "Senior Backend Engineer building scalable microservices.",
  skills: [{ skill_name: "Python", category_code: "COD", confidence: "high", evidence: "5 years exp" }],
  experience: [{ title: "Backend Engineer", company: "TechCorp", duration: "2021-Present", description: "Built scalable APIs." }]
};


// --- 2. Main Component ---
export default function ProfileBuilder() {
  const [profile, setProfile] = useState<Profile>(() => JSON.parse(localStorage.getItem("radix_profile") || "null") || MOCK_DATA);
  const [showJson, setShowJson] = useState(false);


  // Auto-save to localStorage
  useEffect(() => { localStorage.setItem("radix_profile", JSON.stringify(profile)); }, [profile]);


  // DRY State Updaters
  const updateField = (field: keyof Profile, value: any) => setProfile(p => ({ ...p, [field]: value }));
  
  const updateArray = (key: "skills" | "experience", index: number, field: string, value: any) => {
    const arr = [...profile[key]];
    arr[index] = { ...arr[index], [field]: value };
    setProfile(p => ({ ...p, [key]: arr }));
  };


  const addItem = (key: "skills" | "experience") => {
    const newItem = key === "skills" 
      ? { skill_name: "", category_code: "OTHER" as RadixCategory, confidence: "medium" as const, evidence: "" } 
      : { title: "", company: "", duration: "", description: "" };
    setProfile(p => ({ ...p, [key]: [...p[key], newItem] }));
  };


  const removeItem = (key: "skills" | "experience", index: number) => {
    setProfile(p => ({ ...p, [key]: p[key].filter((_, i) => i !== index) }));
  };


  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">Candidate Profile Builder</h1>
          <button onClick={() => { localStorage.removeItem("radix_profile"); setProfile(MOCK_DATA); }} className={`${BTN_CLS} bg-gray-200 text-gray-700 hover:bg-gray-300`}>Reset</button>
        </div>


        {/* Basic Info (Mapped for brevity) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["name", "email", "phone"] as const).map(field => (
            <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} value={profile[field]} onChange={e => updateField(field, e.target.value)} className={INPUT_CLS} />
          ))}
          <textarea placeholder="Professional Summary" value={profile.summary} onChange={e => updateField("summary", e.target.value)} rows={2} className={`${INPUT_CLS} md:col-span-2`} />
        </div>


        {/* Skills Section */}
        <Section title="Skills (RADIX Categorized)" onAdd={() => addItem("skills")}>
          {profile.skills.map((s, i) => (
            <div key={i} className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border border-gray-200 items-center">
              <input placeholder="Skill" value={s.skill_name} onChange={e => updateArray("skills", i, "skill_name", e.target.value)} className="flex-1 min-w-[120px] p-2 border rounded text-sm" />
              <select value={s.category_code} onChange={e => updateArray("skills", i, "category_code", e.target.value)} className="w-24 p-2 border rounded text-sm bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={s.confidence} onChange={e => updateArray("skills", i, "confidence", e.target.value)} className="w-24 p-2 border rounded text-sm bg-white">
                {["high", "medium", "low"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input placeholder="Evidence" value={s.evidence || ""} onChange={e => updateArray("skills", i, "evidence", e.target.value)} className="flex-[2] min-w-[150px] p-2 border rounded text-sm" />
              <button onClick={() => removeItem("skills", i)} className="px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-bold">✕</button>
            </div>
          ))}
        </Section>


        {/* Experience Section */}
        <Section title="Work Experience" onAdd={() => addItem("experience")}>
          {profile.experience.map((e, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-md border border-gray-200 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input placeholder="Title" value={e.title} onChange={ev => updateArray("experience", i, "title", ev.target.value)} className={INPUT_CLS} />
                <input placeholder="Company" value={e.company} onChange={ev => updateArray("experience", i, "company", ev.target.value)} className={INPUT_CLS} />
                <input placeholder="Duration" value={e.duration} onChange={ev => updateArray("experience", i, "duration", ev.target.value)} className={INPUT_CLS} />
              </div>
              <textarea placeholder="Description" value={e.description} onChange={ev => updateArray("experience", i, "description", ev.target.value)} rows={2} className={INPUT_CLS} />
              <div className="flex justify-end"><button onClick={() => removeItem("experience", i)} className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm">Remove</button></div>
            </div>
          ))}
        </Section>


        <button onClick={() => setShowJson(true)} className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-md transition-all">💾 Save & Export RADIX JSON</button>
      </div>


      {/* JSON Export Modal */}
      {showJson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowJson(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Final RADIX Contract JSON</h3>
              <button onClick={() => setShowJson(false)} className="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
            </div>
            <pre className="p-4 bg-gray-900 text-green-400 text-xs overflow-auto flex-1 font-mono">{JSON.stringify(profile, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}


// --- 3. Helper Component to reduce JSX clutter ---
function Section({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <button onClick={onAdd} className={`${BTN_CLS} bg-blue-600 text-white hover:bg-blue-700`}>+ Add</button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}