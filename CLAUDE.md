# CLAUDE.md — Oriel's Personal Website

## Project Overview

Personal portfolio/website for Oriel Absin, a Senior Frontend Developer specializing in React, TypeScript, and e-commerce systems. The site uses React Three Fiber for immersive 3D visuals, serving as both a portfolio and a showcase of creative frontend skills.

## Tech Stack

- **Framework:** React 19 + TypeScript (strict mode)
- **3D Rendering:** React Three Fiber (`@react-three/fiber` v9) + Three.js
- **3D Helpers:** `@react-three/drei` (controls, loaders, abstractions), `@react-three/postprocessing` (effects)
- **State Management:** Redux Toolkit (`@reduxjs/toolkit`) + React-Redux
- **Styling:** TailwindCSS v4 (utility-first, no custom CSS files unless absolutely necessary)
- **Build Tool:** Vite (with `@vitejs/plugin-react-swc`)
- **Testing:** Vitest + React Testing Library + `@react-three/test-renderer`
- **Linting:** ESLint with TypeScript support
- **Package Manager:** npm

## Project Structure

```
src/
├── components/          # Reusable UI components (buttons, nav, layout)
│   ├── ui/              # Pure UI primitives (no 3D)
│   └── three/           # Reusable R3F components (meshes, lights, materials)
├── scenes/              # Full 3D scene compositions (wrapped in <Canvas>)
├── sections/            # Page sections combining 3D scenes + HTML overlay
├── hooks/               # Custom React hooks
├── utils/               # Pure utility functions
├── store/               # Redux Toolkit store configuration
│   ├── index.ts         # Store setup with configureStore
│   ├── hooks.ts         # Typed useAppSelector and useAppDispatch hooks
│   └── slices/          # Feature slices (e.g., theme, navigation, scene)
├── types/               # Shared TypeScript types and interfaces
├── assets/              # Static assets (models, textures, images, fonts)
│   ├── models/          # .glb/.gltf 3D models
│   ├── textures/        # Image textures for materials
│   └── images/          # Standard images (photos, icons)
├── styles/              # Tailwind config overrides, global styles
├── constants/           # App-wide constants and config values
├── App.tsx
├── main.tsx
└── test/
    └── setup.ts         # Vitest global setup (jsdom, cleanup, jest-dom matchers)
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |

## Coding Conventions

### General
- Use functional components with hooks exclusively — no class components
- Prefer named exports over default exports (exception: page-level route components)
- Use `type` over `interface` unless extending/merging is needed
- Use early returns to reduce nesting
- Keep components under 150 lines; extract custom hooks for complex logic
- Use absolute imports via `@/` path alias (configured in `tsconfig.json` and `vite.config.ts`)
- No `any` — use `unknown` and narrow types properly
- Destructure props in the function signature

### React Three Fiber
- Wrap all 3D content in `<Canvas>` at the scene or section level — never nest canvases
- Use `useRef` with proper Three.js types: `useRef<THREE.Mesh>(null!)`
- Use `useFrame` for render-loop animations; avoid `requestAnimationFrame` directly
- Prefer `@react-three/drei` helpers over raw Three.js when available (e.g., `<OrbitControls>`, `<Environment>`, `<Text>`)
- Keep 3D components small and composable — one mesh per component when possible
- Use `React.memo` on heavy 3D components that don't need frequent re-renders
- Use `useGLTF` from drei for loading .glb/.gltf models, and call `useGLTF.preload()` at module level
- Dispose of geometries and materials in cleanup to prevent memory leaks
- Use `<Suspense>` with a fallback around any component that loads assets

### Redux Toolkit
- Use `createSlice` for all state — never write reducers manually
- Keep slices feature-scoped: one slice per domain (e.g., `themeSlice`, `navigationSlice`, `sceneSlice`)
- Use typed hooks everywhere — never use raw `useSelector` / `useDispatch`:
  ```typescript
  // store/hooks.ts
  import { useDispatch, useSelector } from 'react-redux';
  import type { RootState, AppDispatch } from './index';

  export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
  export const useAppSelector = useSelector.withTypes<RootState>();
  ```
- Use `createAsyncThunk` for async operations (API calls, asset loading)
- Prefer `PayloadAction<T>` typing on all reducer actions
- Keep reducers pure — no side effects inside `reducers`; use `extraReducers` for thunks
- Use RTK selectors: define selectors inside the slice file with `createSelector` for derived/memoized state
- Do NOT connect Redux to the R3F render loop — use `useFrame` + local refs for per-frame state; Redux is for app-level state (theme, navigation, UI toggles, loaded assets, user preferences)
- Wrap `<App>` with `<Provider store={store}>` in `main.tsx`

### Tailwind CSS
- Use Tailwind utility classes for all styling; avoid inline `style` props
- Use `cn()` helper (clsx + tailwind-merge) for conditional class composition
- Define custom theme tokens in `tailwind.config.ts` for brand colors, fonts, spacing
- Mobile-first responsive design: base styles → `sm:` → `md:` → `lg:` → `xl:`

### TypeScript
- Enable `strict: true` in `tsconfig.json`
- Type all component props explicitly — no inferred prop types
- Use discriminated unions for state variants
- Type Three.js refs: `useRef<THREE.Group>(null!)`
- Define shared types in `src/types/`

## Testing

### Configuration
- **Framework:** Vitest with jsdom environment
- **Coverage target:** 80% (lines, branches, functions, statements)
- **Coverage provider:** v8
- **Test file pattern:** `*.test.ts` / `*.test.tsx` colocated next to source files

### Vitest Config (vite.config.ts)
```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
  css: true,
  coverage: {
    provider: 'v8',
    include: ['src/**'],
    exclude: ['src/test/**', 'src/**/*.d.ts', 'src/main.tsx', 'src/vite-env.d.ts'],
    thresholds: {
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
}
```

### Test Setup (src/test/setup.ts)
```typescript
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});
```

### Testing Strategy
- **UI components:** Use `@testing-library/react` with `render` + `screen` queries
- **3D components:** Use `@react-three/test-renderer` — test scene graph, props, interactions without WebGL
- **Redux slices:** Test reducers directly by importing the slice and calling `slice.reducer(initialState, action)`
- **Redux async thunks:** Test with a mock store or by dispatching against a real store and asserting state
- **Connected components:** Use a custom `renderWithProviders` wrapper that wraps components in `<Provider>` with a preconfigured or overridden store:
  ```typescript
  // src/test/utils.tsx
  import { render } from '@testing-library/react';
  import { Provider } from 'react-redux';
  import { configureStore } from '@reduxjs/toolkit';
  import { rootReducer } from '@/store';
  import type { RootState } from '@/store';

  export function renderWithProviders(
    ui: React.ReactElement,
    { preloadedState, ...options }: { preloadedState?: Partial<RootState> } & Parameters<typeof render>[1] = {}
  ) {
    const store = configureStore({ reducer: rootReducer, preloadedState: preloadedState as RootState });
    return render(<Provider store={store}>{ui}</Provider>, options);
  }
  ```
- **Hooks:** Use `renderHook` from `@testing-library/react`
- **Utilities:** Direct unit tests with Vitest assertions
- Use `data-testid` attributes only as a last resort; prefer accessible queries (`getByRole`, `getByText`, `getByLabelText`)
- Mock Three.js loaders and heavy assets in tests
- Use `vi.mock()` for module mocking; `vi.fn()` for function mocking
- Test user interactions with `@testing-library/user-event`

### Mocking Three.js / R3F in Tests
```typescript
// Mock WebGL context for components that need it
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return { ...actual };
});

// For Canvas-dependent components, wrap with test renderer
import ReactThreeTestRenderer from '@react-three/test-renderer';

const renderer = await ReactThreeTestRenderer.create(<MyMeshComponent />);
const mesh = renderer.scene.children[0];
expect(mesh.props.position).toEqual([0, 0, 0]);
```

## Performance Guidelines
- Lazy-load heavy 3D scenes with `React.lazy()` + `<Suspense>`
- Compress textures (use .webp or KTX2 where possible)
- Use instanced meshes (`<instancedMesh>`) for repeated geometry
- Minimize draw calls — merge static geometries when feasible
- Use `<Bvh>` from drei for complex scene raycasting
- Set `frameloop="demand"` on `<Canvas>` for sections that don't need continuous rendering
- Profile with React DevTools and `<Perf>` from `r3f-perf` during development

## Accessibility
- All interactive 3D elements must have HTML overlay alternatives
- Provide `aria-label` on interactive elements
- Ensure keyboard navigation works for non-3D content
- Support `prefers-reduced-motion` — disable or simplify animations accordingly
- Maintain color contrast ratios (WCAG AA minimum) on all text overlays

## Git Conventions
- Branch naming: `feature/`, `fix/`, `chore/`, `docs/`
- Commit messages: conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`, `refactor:`)
- Keep PRs focused — one feature or fix per PR
- All PRs must pass linting, type-check, and tests with ≥80% coverage before merge
