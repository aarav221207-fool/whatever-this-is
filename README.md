# JSS University Noida Companies Research & Placement Analytics Portal
*(Also known as JSS University Noida Placement Intelligence Hub)*

**College Name**: JSS University Noida  
**College Short Tag**: JSS  
**Architecture**: Mobile-first React 19 + TypeScript + Vite + Tailwind CSS + Enterprise Design System  

---

## 1. Overview & Architectural Principles

This application is the **Phase 1 UI-only** deployment of the JSS University Noida Placement Intelligence Hub. It provides campus placement candidates and coordinators with deep, multi-dimensional intelligence across recruiting organizations, including comprehensive 22-section company profiles, cognitive taxonomy skill ladders, and recruiting benchmarks.

### Phase 1 Scope (UI Only)
- **Zero Database / Server Dependencies**: In Phase 1, there is strictly no live database, no Lovable Cloud, and no Supabase client or tables.
- **Single Source of Truth**: All data is served from a normalized TypeScript seed module (`src/data/seedCompanies.ts`).
- **Seamless Phase 2 Transition**: The data normalization layer (`src/lib/companyData.ts`) accepts the identical JSONB shapes (`short_json` and `full_json`) that future Supabase tables will provide. Transitioning to Supabase in Phase 2 requires changing only one data provider file.
- **Fully Public Access (No Login)**: The portal is 100% public. There are no login routes, no authentication context, no protected routes, and no session barriers.

### Strict Privacy & Placement Constraints
- **Zero CTC / Stipend / Selection Ratio**: As per institutional guidelines, compensation numbers (CTC, base pay, stipends) and selection ratios are strictly excluded from all views.
- **Zero College Logo Asset**: The college identity is expressed purely through typographic wordmarks and pill badges. No image files or college logos are referenced.
- **Company Logos**: Recruiting companies use Logo.dev (when `VITE_LOGO_DEV_PUBLISHABLE_KEY` is configured), falling back gracefully to provided database URLs or stylized initial-letter avatars.

---

## 2. Mandatory Routing Contract

The application implements nested React Router routes:

- `/` → **Index**: Enterprise search bar, 5 category filter pills (All, Super Dream, Dream, Standard, Regular), and responsive grid of company cards.
- `/company` → Redirects automatically to `/company/intelligence`.
- `/company/intelligence` → **Company Intelligence**: Sticky enterprise header, 22-tab scroll-spy navigation, and 22 deep intelligence section cards.
- `/company/skills` → **Skill Intelligence**: Bloom's cognitive taxonomy ladder (CU, AP, AS, EV, CR), criticality tiers, and expandable 10-level topic roadmaps with prerequisite locks.
- `*` → **NotFound**: Handles only genuinely invalid URLs.

### Persistent Context & Refresh Guard
Company selection persists to `localStorage` under the key `"selected-company"`. On page reload or direct link visit, the application reads `selected-company` and hydrates the context immediately.

---

## 3. The 22 Deep Intelligence Sections

In exact order:
1. **Company Identity**
2. **Overview & Vision**
3. **Leadership**
4. **Funding & Financials**
5. **Global Presence**
6. **Products & Services**
7. **Technology Stack**
8. **Partnerships & Ecosystem**
9. **Competitive Landscape**
10. **Market Opportunity**
11. **Core Value Proposition & ESG**
12. **Culture & Work Life**
13. **Recent News & Milestones**
14. **Sales & Customer Metrics**
15. **Risk & Compliance**
16. **Work Location & Commute**
17. **Safety & Wellbeing**
18. **Career Growth & Learning**
19. **Brand & Reputation**
20. **Compensation & Benefits** *(No CTC, No Stipend)*
21. **Digital Presence & Ratings**
22. **Contact Information**

---

## 4. Skill Intelligence & Bloom's Taxonomy Ladder

Cognitive proficiency mappings:
- **Levels 1–2**: `CU` (Conceptual Understanding, `#3b82f6`)
- **Levels 3–4**: `AP` (Application, `#22c55e`)
- **Levels 5–6**: `AS` (Analysis, `#eab308`)
- **Levels 7–8**: `EV` (Evaluation, `#ef4444`)
- **Levels 9–10**: `CR` (Creation, `#a855f7`)

Criticality thresholding:
- **Critical**: Required level $\ge 7$
- **Important**: Required level $5 - 6$
- **Baseline**: Required level $< 5$

Each skill provides an expandable 10-level milestone roadmap (`src/data/skillTopics.ts`). Levels exceeding the target benchmark are locked with a *"Beyond scope"* marker.

---

## 5. Phase 2 — Supabase Data Pipeline

### Setup Instructions
Paste `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` into `.env`, then `npm install && npm run dev`.

### Data Architecture (Read-Only, JSON-Driven)
- **Zero Joins on 90+ Tables**: To maintain enterprise throughput and avoid complex schema coupling, company data is read exclusively from `public.company_json`:
  - `company_json.company_id` (int)
  - `company_json.short_json` (jsonb) → For company listing and cards
  - `company_json.full_json` (jsonb) → For all 22 deep intelligence sections
- **4 Skill Tables**: Competency matrices and 10-level topic roadmaps are assembled from 4 minimal tables:
  - `public.company_skill_levels` (`company_id`, `skill_set_id`, `required_level`, `required_proficiency_level_id`)
  - `public.skill_set_master` (`skill_set_id`, `skill_set_name`, `short_name`)
  - `public.proficiency_levels` (`proficiency_level_id`, `proficiency_name`, `proficiency_code`)
  - `public.skill_set_topics` (`skill_set_id`, `level_number`, `topics`)
- **Strict Production Database Verification**: Silent mock data fallbacks in production have been completely removed. The UI renders authentic database records, reports genuine database connection errors, or displays explicit empty states.
- **Supabase Row-Level Security (RLS)**: If you enable RLS on `company_json` and the 4 skill tables, ensure you execute an anonymous SELECT policy in Supabase SQL editor:
  ```sql
  CREATE POLICY "Allow anonymous read access" ON public.company_json FOR SELECT USING (true);
  CREATE POLICY "Allow anonymous read access" ON public.company_skill_levels FOR SELECT USING (true);
  CREATE POLICY "Allow anonymous read access" ON public.skill_set_master FOR SELECT USING (true);
  CREATE POLICY "Allow anonymous read access" ON public.proficiency_levels FOR SELECT USING (true);
  CREATE POLICY "Allow anonymous read access" ON public.skill_set_topics FOR SELECT USING (true);
  ```

---

## 6. Development & Testing

```bash
# Run local dev server (port 3000)
npm run dev

# Run Vitest smoke test suite
npm run test

# Build production bundle
npm run build
```
