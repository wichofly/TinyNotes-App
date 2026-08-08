---
name: modern-best-practice-react-components
description: Build clean, modern React components that apply common best practices and avoid common pitfalls like unnecessary state management or useEffect usage. Use when working on React code or using React features.
---

# Modern Best-Practice React Components

Build React components that are easy to understand, accessible, testable, and aligned with the existing application architecture.

## Workflow

1. Inspect the surrounding component, route, data layer, TypeScript configuration, and tests before changing the design.
2. Define the component's responsibility, public props, state owner, and user-visible states.
3. Prefer the simplest implementation that keeps rendering pure and behavior explicit.
4. Add focused tests for changed behavior, then run the relevant typecheck, lint, and test commands.

## Component design

- Use function components with explicit, narrow TypeScript prop types.
- Keep components cohesive. Split a component when a part has a clear responsibility, meaningful reuse, or independent behavior—not merely to make a file shorter.
- Prefer composition and `children` or slots over a growing set of boolean flags.
- Keep feature-specific behavior near the feature; put genuinely reusable primitives in the shared component area.
- Preserve existing project conventions for styling, data fetching, error handling, and file placement.
- Keep render logic pure: do not perform side effects, mutate props, or mutate shared objects during render.
- Use stable keys from the data model. Do not use array indexes when items can be inserted, removed, sorted, or reordered.
- Do not call hooks conditionally, in loops, or from nested callbacks.

## State and data flow

Choose state based on whether a value is authoritative, transient, or derived.

- Do not store values that can be calculated from props or existing state. Derive them during render.
- Keep ephemeral interaction state local, such as an open menu, draft input, or pending toggle.
- Lift state only to the nearest common owner that needs to coordinate it. Avoid global state for local concerns.
- Use `useReducer` when several related values change through explicit transitions. Do not use it as ceremony for a couple of independent values.
- Treat server or cache state as belonging to the existing data-fetching layer. Do not mirror it into local state without a clear synchronization contract.
- Use refs for DOM nodes or mutable values that must persist without causing a render. Do not use refs as a hidden replacement for state that affects the UI.
- Make controlled and uncontrolled APIs explicit. Do not silently maintain two competing sources of truth.

For a filtered list, derive the result instead of synchronizing duplicate state:

```tsx
const visibleNotes = notes.filter((note) =>
  note.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
);
```

Avoid this pattern unless there is a specific external synchronization requirement:

```tsx
const [visibleNotes, setVisibleNotes] = useState(notes);

useEffect(() => {
  setVisibleNotes(filterNotes(notes, query));
}, [notes, query]);
```

## Effects

Use `useEffect` only to synchronize React with an external system: a browser API, subscription, timer, imperative widget, network side effect, or non-React store.

Before adding an effect, ask whether the work belongs in:

- render, if it derives a value;
- an event handler, if it follows a user action; or
- the data layer, if it loads or mutates application data.

When an effect is justified:

- Make setup and cleanup symmetrical.
- Declare every reactive dependency and restructure the code instead of suppressing dependency warnings.
- Handle cancellation, stale results, failures, and unavailable browser capabilities where applicable.
- Avoid setting state from an effect when that state is only a representation of existing props or state.
- Avoid effects that merely reset state when a component identity (`key`) or a clearer state transition expresses the requirement.

## Accessibility and interaction

- Prefer semantic HTML and native controls before adding ARIA or custom interaction logic.
- Associate every form control with a visible or appropriately hidden label.
- Use buttons for actions and links for navigation; do not make generic elements clickable without a strong reason.
- Preserve keyboard operation, visible focus, sensible tab order, and clear disabled/loading/error states.
- Manage focus only when the interaction requires it, and return focus when closing an overlay or transient surface.
- Render useful loading, empty, error, and success states rather than leaving ambiguous blank space.
- Treat user-provided text as text. Avoid unsafe HTML injection and validate URLs before rendering or navigating to them.

## Performance

- Start with correct, readable code and measure before optimizing.
- Do not add `useMemo`, `useCallback`, or `memo` by default. Use them when profiling or a known identity-sensitive boundary justifies them.
- Reduce unnecessary renders by fixing state ownership, prop shape, and component boundaries before reaching for memoization.
- Avoid work in render that is truly expensive; if memoization is justified, document what it protects and why its dependencies are correct.
- Prefer progressive rendering and the project's existing loading/data patterns over ad hoc client-side caches.

## Testing

- Test user-visible behavior through accessible queries and realistic interactions.
- Cover validation boundaries, loading/error/empty states, keyboard behavior, and authorization-sensitive UI when relevant.
- Assert outcomes rather than implementation details such as internal state, effect invocation counts, or private helper calls.
- Mock external systems at their boundary, not the component's internal logic.

## Review checklist

Before handing off a React change, verify:

- Every state variable has a clear owner and cannot be derived more simply.
- Every effect synchronizes with something outside React and cleans up correctly.
- Props, keys, event handlers, and async paths are type-safe.
- The UI works with keyboard input and exposes meaningful accessible names and states.
- Existing project patterns are preserved unless the change intentionally improves them.
- Focused tests and the relevant validation commands pass.
