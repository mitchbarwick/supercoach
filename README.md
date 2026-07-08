# ⚽ SuperCoach

A smart session planner for volunteer grassroots football coaches. Tell it how long you've got, who turned up, and what kit you have — it builds a fully timed session from warm-up to cool-down, with animated drill diagrams and kid-friendly explanations.

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## The flow (the "Jasmine" scenario)

1. **Plan** — pick session length, age group, player count, positions present, equipment, and up to 3 focus areas.
2. **Session plan** — a timed timeline (start minute + duration for every block) with drink breaks factored in. Tick blocks off as you go; progress bar tracks the session.
3. **Drill pages** — tap any block: animated top-down pitch diagram, "say this to the kids" script, numbered setup steps, coaching points, easier/harder adaptations, and a notes box (auto-saved).
4. **Favourites** — heart a drill and it's preferred next time the session builder runs. Browse everything in the Drill Library (📚).

Everything persists in the browser (localStorage) — no account needed.

## Accounts (phase 3, optional)

Sign in with Google (Settings or Home) and your recent sessions, saved
sessions, favourites and usual setup (age group, squad size, kit) sync to
every device. Home shows your history with **Run again** / **Edit** (swap
any drill for an alternative that fits tonight's squad). Every drill page
has a feedback button — notes arrive at the admin dashboard (`#/admin`,
app-creator account only) tagged with drill, age group and player count.
Backend: Azure Functions + Cosmos DB — see `DEPLOYMENT.md`. Without it the
app runs guest-only, exactly as before.

## Drill animation system

Every drill carries a declarative `diagram` spec (`src/data/drills.js`) rendered by `src/components/PitchAnimation.jsx`: a consistent 100×64 top-down pitch with cones, gates, goals, zones, and player/ball tokens that move along keyframe paths with phase captions. Add a new drill = add data, no new drawing code.

## AI layer (optional)

`Settings ⚙️` accepts an Azure AI Foundry (Azure OpenAI) endpoint, deployment name and key. When connected, drill pages add age-group-specific coaching tips (cached locally). The app is fully functional without it.

## Structure

```
src/
  data/drills.js            curated drill library + diagram specs
  engine/sessionBuilder.js  rule-based timed session assembler
  components/PitchAnimation.jsx  SVG animation system
  store/useStore.js         localStorage-backed state
  ai/azure.js               Azure OpenAI integration (fails soft)
  pages/                    Setup wizard, Plan, Drill, Library, Settings
```
