# UNO Portfolio Concept

Personal portfolio site disguised as an UNO card game. Visitors play UNO against AI opponents to progressively unlock information about Oriel.

## Gameplay & Narrative Design

- Each opponent represents a different facet: "Dev Oriel" (React, TypeScript, CTC work), "Community Oriel" (church service, volunteering, Filipino community), "Fun Oriel" (hobbies, jokes, trivia, family life)
- Dialogue triggers tied to game events:
  - **Draw 2** — triggers a "fun fact"
  - **Skip** — triggers a "did you know"
  - **Reverse** — triggers a flashback story
  - **Wild cards** — reveal bigger milestones (moving to Canada, career highlights)
- As rounds progress, conversation naturally builds a full picture of who you are

## Engagement Hooks

- "Resume Summary" panel that fills in as the game progresses — visitors literally unlock qualifications by playing
- End-of-game screen shows a compiled mini-resume of everything revealed, plus links to GitHub, LinkedIn, contact info
- "Speed mode" toggle for recruiters who want info faster but still in the game format

## Tone & Personality

- Bots roast each other lightly — "Oriel once debugged a race condition in Google Pay at 2am... and still made it to church on Sunday"
- Filipino humor, dad jokes, faith references woven naturally into banter
- Trivia like "Guess which country Oriel served his mission in?" as interactive moments

## Technical Considerations

- Single-page React app (React 19 + TypeScript)
- Game state management with Redux Toolkit or useReducer
- Card animations with Framer Motion or CSS
- Anthropic API for dynamic/contextual bot dialogue — each playthrough feels different
- Mobile-friendly card UI (recruiters may open on phone)
- React Three Fiber for 3D card effects and table environment

## Portfolio Meta-Win

The site itself IS the portfolio piece — demonstrates React skills, state management, UI/UX thinking, and creativity all at once.
