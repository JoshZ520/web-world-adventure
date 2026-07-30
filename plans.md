# CSS Dungeon plan

## Status update

- Shared layout and page shells are in place.
- Local preview now serves CSS and script assets correctly from the project root.
- The login page includes a lightweight auth flow for sign-in, sign-up, and sign-out state.
- Basic auth regression tests are in place for sign-up and sign-in behavior.

## Current focus

1. Replace the local-only auth prototype with Supabase Auth.
2. Connect the login page to Supabase sign-in and sign-up flows.
3. Add user-specific progress storage and protected app areas.
4. Keep the current page structure and shared layout intact while moving the data layer behind a simple backend/API integration.

## Notes

- The project is still a frontend-first prototype, but it now has a stronger foundation for a serious multi-user experience.
- GitHub and Supabase integration should be treated as the next major milestone after the auth migration.
