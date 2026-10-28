# Placement Portal Repair Report

## Changes made

- Rewired company directory and profile loading from the assumed `public.company_json` JSON table to the supplied normalized `public.companies` table.
- Profile details additionally attempt to read the known direct company-linked tables in the supplied schema: `company_brand_reputation`, `company_business`, `company_compensation`, `company_core_values`, `company_culture`, and `company_customer_testimonials`.
- Company placement tier is now `Unclassified` unless the database actually supplies a recognized `company_type`; the supplied schema does not show that column. Missing growth, logo, operating-country, and office-location values remain unavailable instead of being invented.
- Skill Intelligence attempts the optional skill tables, but returns an empty state if the main skill table is absent; no fabricated skill ladder is inserted.
- Removed demo benchmark scores from the production Talent Check page and disabled the score endpoint until approved company hiring benchmarks are connected to the database.
- Added a Netlify Function wrapper for the Express API and ordered `/api/*` rewrites before the SPA fallback.
- Limited document uploads to 4 MB and updated the upload UI, server validation, and test expectation to match Netlify serverless payload constraints.
- Added `.nvmrc`, refreshed `.env.example`, removed the stale Bun lockfile, and documented Netlify/Supabase configuration and security expectations.

## Validation status

- TypeScript/TSX syntax transpilation and archive integrity checks are performed on this artifact.
- A full dependency install was attempted but timed out in this environment. Therefore `npm run build`, `npm run lint`, and `npm test` could not be executed here.
- The Supabase schema CSV provides column definitions, not live credentials, row data, RLS policies, or a live deployment. Database access and Netlify runtime behavior must be confirmed after the environment variables and policies are configured.

## Required Netlify environment variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Optional server-side `GEMINI_API_KEY`

Never put a Supabase service-role key in a `VITE_*` variable or commit API secrets.
