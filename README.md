# Oriel Web

A personal portfolio site disguised as an UNO card game. Visitors play UNO against three AI opponents on an interactive 3D table, unlocking information about Oriel through gameplay and conversation.

**Live:** [orielvinci.com](https://orielvinci.com)

## The Concept

Instead of a traditional portfolio with static sections, this site turns the experience into a card game. Three AI opponents — Meio (the strategist), Dong (the trash talker), and Oscar (the chill one) — react to game events with personality-driven dialogue, tell jokes, and share facts about Oriel as the game progresses.

The site itself is the portfolio piece: it demonstrates React architecture, 3D rendering, state management, animation systems, and creative UI/UX thinking all at once.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| 3D Rendering | React Three Fiber + Three.js |
| 3D Helpers | @react-three/drei, @react-three/postprocessing |
| Animation | react-spring (web + three) |
| State Management | Redux Toolkit |
| Styling | TailwindCSS v4 |
| Build Tool | Vite |
| Testing | Vitest + React Testing Library |
| Game Engine | uno-engine |
| Deployment | Vercel |

## Features

- **3D UNO game** — Full card game with dealing, playing, drawing, and discard animations on a rendered table
- **AI opponents** — Three bots with distinct personalities that auto-play, challenge bluffs, and call UNO
- **Dialogue system** — Event-driven commentary with 30+ dialogue categories, cooldown/dedup logic, and template tokens
- **Joke sequences** — AI opponents tell jokes fetched from an external API with multi-phase conversational timing
- **Card animations** — Magnet card system with position-tracked lerp animations for dealing, playing, and drawing
- **Wild Draw Four challenges** — Bluff detection mechanic with simplified penalty rules
- **UNO callout** — Shout UNO or catch opponents who forget
- **Dark/light theme** — Toggle with 3D scene adaptation
- **Chat history** — Scrollable log of game actions and AI dialogue
- **Responsive** — Mobile-friendly card UI

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Project Structure

```
src/
├── components/
│   ├── three/       # 3D components (Card3D, Table, PlayerLabel, MagnetCard, etc.)
│   └── ui/          # UI primitives (Button, Input, modals, overlays)
├── scenes/          # Full 3D scene compositions
├── sections/        # Page sections (WelcomeScreen)
├── hooks/           # useGameController, useDialogue, useMagnetState, etc.
├── engine/          # UNO game adapter wrapping uno-engine
├── data/            # Static dialogue lines (~700 lines across 3 personalities)
├── store/slices/    # Redux slices (game, theme, navigation, visitor)
├── utils/           # Pure utilities (card textures, zone layout, dialogue selector)
├── constants/       # App-wide constants (players, seats, card geometry)
├── i18n/            # Translation system
└── types/           # Shared TypeScript types
```

## Architecture Highlights

- **Magnet Card System** — Invisible position targets (magnet zones) + animated visible cards that lerp toward them, decoupling layout from animation
- **Dialogue Engine** — Probability-gated, cooldown-aware selector that maps game events to personality-specific dialogue with template token resolution
- **Event-Driven AI** — Game controller emits typed events; dialogue hook, chat history, and UI all subscribe independently

## License

All rights reserved.
