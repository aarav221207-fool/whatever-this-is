# Real-data placement workflow setup

This branch adds authenticated resume storage, database-backed student profiles and skills, saved job descriptions, ranked job recommendations, and the company-to-student matching view.

## 1. Configure Supabase in Netlify

In Netlify, open **Site configuration → Environment variables** and set:

- `VITE_SUPABASE_URL`: your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon key (never a service-role key)

Redeploy after changing client build variables. Keep the service-role key out of browser variables and source control.

## 2. Apply the database migration

1. Open the correct Supabase project.
2. Open **SQL Editor** and create a query.
3. Copy and run the complete file `supabase/migrations/202610280001_real_placement_workflows.sql`.
4. Confirm that these tables exist: `placement_staff`, `student_profiles`, `student_skills`, `job_postings`, and `job_matches`. Confirm the private Storage bucket `student-resumes` also exists.

The migration deliberately enables Row Level Security. Do not turn RLS off to make the UI work.

## 3. Create an authorized placement-staff account

1. Open the portal's `/auth` page and create an account with the intended placement administrator email. Complete email confirmation if Supabase requires it.
2. In Supabase SQL Editor, run the following query after replacing the email placeholder with that exact email:

```sql
select id, email
from auth.users
where lower(email) = lower('YOUR_PLACEMENT_ADMIN_EMAIL');
```

3. Verify the returned account carefully. Then authorize that one user by inserting their returned UUID:

```sql
insert into public.placement_staff (user_id)
values ('PASTE_VERIFIED_AUTH_USER_UUID_HERE')
on conflict (user_id) do nothing;
```

Only add trusted placement staff. Members of this table can read student profile/skill records and publish or update jobs; ordinary students cannot.

## 4. Student upload workflow

Students should open `/auth`, create their own account, verify email if required, and sign in. On `/resume-parser`, uploading a real PDF, DOCX or TXT resume automatically:

1. extracts text and parses the profile;
2. uploads the original file to private Supabase Storage;
3. creates or updates the profile linked to the signed-in auth user;
4. stores recognized skill records and their extracted evidence;
5. compares the skills with active job descriptions in `job_postings`;
6. saves recommendation scores and evidence in `job_matches`, then displays ranked real jobs.

The app does not create a fictional person when a resume has no readable name or skills. A sample resume is marked as a demo and is not persisted.

## 5. Upload real jobs and populate company matching

Sign in with the authorized placement-staff account and upload an actual JD on `/jd-analytics`. The application extracts the requirements, saves the full JD and parsed fields to `job_postings`, finds an existing `companies` record where the company name matches (when available), and refreshes matches for existing student profiles.

Open `/skill-matching` to choose a saved company/job description and review actual student profiles, their match scores, matched skills, missing requirements and action plans. The page intentionally shows empty states when real records do not exist instead of loading a demo candidate or sample job.

Job recommendations are computed from the stored active job descriptions and the student's saved skill records. The extraction parser is deterministic: if a JD does not state a field or a recognizable skill, that field remains unavailable rather than being fabricated.

## 6. Deployment and verification

After committing/merging this branch, let Netlify build the deployed branch. Test the full flow with a test student account and a test placement-staff account:

- `/auth` sign-up/sign-in works.
- A student resume upload creates a row in `student_profiles`, skill rows in `student_skills`, and a private object in `student-resumes`.
- With no active saved jobs, the student sees an honest empty recommendation state.
- A placement staff JD upload creates a row in `job_postings` and refreshed match rows in `job_matches`.
- `/skill-matching` lists only database-backed student profiles and saved jobs.

If uploads return a 404, check the Netlify Function deploy/build log for `netlify/functions/api.ts` before retrying. The document extraction endpoint depends on that function being deployed successfully. A successful frontend build by itself does not prove the function/API or Supabase writes work.
