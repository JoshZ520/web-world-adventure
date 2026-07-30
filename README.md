# CSS Dungeon

Minimal vanilla HTML, CSS, and JavaScript scaffold.

## Starting point

- `src/pages/index.html` for the home page structure
- `src/styles/global.css` for shared layout and navigation foundations
- `src/styles/home.css`, `src/styles/about.css`, `src/styles/auth.css`, and `src/styles/app.css` for page-specific styling
- `src/scripts/script.js` for shared layout components and page behavior
- `assets/` for future static files

## V1 plan (brief)

CSS Dungeon V1 is now a multi-page experience with a consistent header and footer, then page-specific content for Home, About, Profile, Login, and Quest Board. Quests still use the 3-section progression (HTML -> CSS -> advanced challenge), but the project now also includes a world-map progression concept.

- Keep a shared top nav and footer on all pages
- Build Home, About, Profile, Login, and Quest Board page structures
- Use login-state nav visibility rules (some links only when logged in)
- Keep a trial mini quest on Home and prompt signup after completion
- Track user progress and stats in Profile
- Keep leaderboard and non-core expansion out of scope for V1

## Code build checklist (JSON first)

Use a JSON-first architecture now, then swap the data source to a database later without rewriting the UI flow.

1. Keep content and progression in JSON files at first.
2. Keep quest lesson data consistent: quest id, title, sections, challenge metadata.
3. Keep world map data consistent: countries, kingdoms, towns, path levels, boss node.
4. Keep user progress data consistent: completed sections, level, title/rank, profile stats.
5. In index.html, keep structure focused on Home flow: trial mini quest, quest-board explanation, call-to-adventure.
6. Create additional page shells for about, profile, login, and quest-board with shared nav/footer patterns.
7. In script.js, centralize state and render functions so each page can consume the same data shapes.
8. Add login-state rendering rules for nav items (logged out vs logged in).
9. Trigger signup prompt flow after trial quest completion.
10. Keep data loading behind one layer so migration to API later only changes fetch/storage code.

## Later database migration path

1. Keep JSON schema as source-of-truth contract.
2. Move quests, world map, and user progress to database tables/collections with the same shape.
3. Replace local JSON reads with API endpoints that return matching payloads.
4. Keep page rendering unchanged so only auth and data-access layers are refactored.

## 9-session implementation tracker

Use this as your build log. Mark each session when done.

- [ ] Session 1: Finalize shared header/nav and footer structure in index.html
- [ ] Session 2: Finalize Home structure in index.html (trial mini quest, quest board explanation, call to adventure)
- [ ] Session 3: Create login page shell with username/email, password, forgot links
- [ ] Session 4: Create about page shell with what-this-is, how-to-use, and example quest sections
- [ ] Session 5: Create profile page shell with username, email, title/rank, and stats dashboard area
- [ ] Session 6: Create quest-board page shell with map area and progression placeholders
- [ ] Session 7: Load quest/world JSON in script.js and render trial quest + quest-board preview
- [ ] Session 8: Add nav login-state rules and trial-complete signup prompt behavior
- [ ] Session 9: Add local progress persistence and profile stats hydration

### V1 done checklist

- [ ] Home, About, Profile, Login, and Quest Board structures are in place
- [ ] Shared nav/footer works across page shells
- [ ] Trial quest flow can trigger signup prompt
- [ ] Profile can display progress stats from local data
- [ ] Quest progression concept (Lvl 1 -> Lvl 2 -> Lvl 3 -> Boss) is represented in UI/data
- [ ] Auth persistence and leaderboard are still deferred to Phase 2+
# web-world-adventure
