# Analytics Dashboard (Secret Admin View)

## Concept

A private analytics dashboard accessible only by entering a secret code name ("Binsi") in the WelcomeScreen name field. Instead of starting the UNO game, the app loads a full-page dashboard showing visitor activity, geographic distribution, and session details — all pulled from the existing Firestore `sessions` collection.

Regular visitors never download the dashboard code. It's fully code-split via `React.lazy()` + dynamic `import()`, so the chart and map libraries live in a separate JS chunk that only loads when the secret name is detected.

## Access Flow

1. Navigate to the portfolio site
2. In the "Your Name" field, type the secret code name
3. Click "Deal Me In"
4. Instead of the game, the dashboard loads with a smooth transition
5. A "Back" button returns to the WelcomeScreen to play the game normally

## Dashboard Sections

### Summary Stats (top row)

Four glass-morphism stat cards in a responsive grid:

- **Total Visitors** — count of all sessions
- **Avg Session Duration** — mean of `durationMs` across all sessions
- **Total Games Played** — sum of `gamesPlayed`
- **Win Rate** — `sum(gamesWon) / sum(gamesPlayed) * 100`

### Activity Chart

A Recharts area chart showing visitors per day over the last 30 days. The area fill uses the UNO blue gradient. Hovering shows a tooltip with the exact date and visitor count.

### Visitor Map

An SVG world map (react-simple-maps with natural-earth TopoJSON) with dot markers for each visitor location. Marker size scales with the number of visits from that city. Marker color uses the UNO palette.

### Session Table

A sortable, paginated table listing all sessions:

| Column   | Source                                  |
| -------- | --------------------------------------- |
| Name     | `visitorName`                           |
| Company  | `company`                               |
| Device   | `device.isMobile` (mobile/desktop icon) |
| Country  | `geo.country`                           |
| Duration | `durationMs` formatted as Xm Ys         |
| Games    | `gamesPlayed`                           |

Rows are expandable — clicking reveals the event timeline (list of `events[]` with type and relative timestamp).

## Technical Decisions

### Code Splitting

The dashboard is imported via `React.lazy(() => import('@/sections/Dashboard'))` inside App.tsx. Vite automatically splits this into a separate chunk. The charting (recharts ~45kb gzip) and mapping (react-simple-maps ~15kb gzip) libraries are only bundled in this chunk.

### No Routing Library

The app already uses state-based navigation (Redux flags like `hasEnteredWelcome`). The dashboard extends this with a simple `isDashboardMode` boolean in App.tsx — no need to add react-router.

### Client-Side Aggregation

All stats are computed in the browser after fetching raw session documents. This avoids Cloud Functions and keeps the architecture simple. A default limit of 500 sessions is more than enough for a personal portfolio site.

### Firestore Reads

A new `sessionsReader.ts` module queries the `sessions` collection using the existing `getFirestoreDb()` connection. Security rules need to be updated to allow reads (the data is non-sensitive visitor analytics).

## Styling

Matches the existing design language:

- Glass-morphism cards (`bg-white/80 backdrop-blur-md dark:bg-neutral-900/80 rounded-2xl`)
- UNO gradient accent strip at the top
- Chart colors from the UNO palette: red `#ef6f6f`, blue `#5b8ef5`, green `#4dcb7a`, yellow `#f0b84d`
- Full dark mode support
- Responsive: 4-col → 2-col → 1-col breakpoints
