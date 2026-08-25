# EYSAE website

Static multilingual project website with a Supabase-backed community workspace. It runs on GitHub Pages without a build step.

## Pages

- `index.html` — project home
- `projects.html` — project information
- `feed.html` — public, approved community stories
- `post.html?id=...` — individual story view with likes and member comments
- `community.html` — registration, password recovery, profiles, publishing, moderation and private messages

## Community setup

1. Create or select a Supabase project.
2. In Supabase **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).
3. In **Authentication → URL configuration**, add the live GitHub Pages address as a redirect URL:
   `https://newstartfrfr.github.io/eysae-website/community.html`
4. Add the Project URL and publishable/anonymous key to `assets/js/supabase-config.js`.
5. Create the editor's member account through the website.
6. In SQL Editor, promote that existing account:

```sql
update public.profiles
set is_admin = true
where email = 'dan.grmusa@gmail.com';
```

The publishable Supabase key is designed for browser use. Security is enforced by the Row Level Security policies in `supabase/schema.sql`; never add a Supabase service-role key to this repository.

Re-running `supabase/schema.sql` is safe and is also the upgrade path for an existing installation. It adds profile photographs, post author photographs, likes and comments without deleting existing member or story data.

## Publishing flow

- Members can save drafts and submit blogs, photo stories, project updates and notices.
- Member submissions enter `pending` status.
- Editors approve or return submissions from the community page.
- Approved content appears on the public feed and receives an individual story URL.
- Signed-in members can like approved stories and publish comments.
- Members can edit or delete their own content. Editing an approved member post sends it through review again.

## Local preview

No package installation is required. Start any static server in the repository root, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## Deployment

GitHub Pages serves the `main` branch from the repository root. After each change, verify `index.html`, `feed.html`, `post.html` and `community.html` on desktop and mobile. Do not report a deployment as complete until the live Pages URL contains the new commit.
