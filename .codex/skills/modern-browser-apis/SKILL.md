---
name: modern-browser-apis
description: Prefer browser-native HTML elements and Web APIs over custom JavaScript or dependencies when implementing or reviewing browser-facing features. Use for dialogs, popovers, clipboard and sharing, navigation and view transitions, observers, files, workers, scheduling, permissions, storage, and other capability-dependent browser APIs.
---

# Modern Browser APIs

Use the browser as a platform when its native capability meets the product, accessibility, and browser-support requirements.

## Decision order

1. Confirm that the feature solves a real product requirement.
2. Prefer declarative HTML and CSS, such as `<dialog>`, `<details>`, native forms, and `loading="lazy"`.
3. Prefer a suitable built-in Web API over custom JavaScript or a dependency.
4. Use a library when native support, accessibility, or required behavior is insufficient.

Define the supported-browser baseline before choosing fallbacks or polyfills. Do not add an API merely because it is modern.

## Implementation rules

- Feature-detect capability-dependent APIs. Do not add redundant guards for APIs guaranteed by the project's browser baseline.
- Check secure-context requirements where relevant.
- Start permission-sensitive operations from a user gesture.
- Handle rejection and cancellation explicitly.
- Provide a useful degraded experience when a capability is unavailable.
- Clean up listeners, observers, workers, locks, and pending work.
- Validate untrusted URLs and protocols. Avoid unsafe HTML injection and unnecessary persistence of sensitive data.
- Prefer async APIs for genuinely asynchronous operations; synchronous native APIs are valid when appropriate.

Treat APIs such as Clipboard, Web Share, Popover, View Transitions, URLPattern, File System Access, Web Locks, Scheduling, Web Speech, OffscreenCanvas, and WebGPU as capability-dependent unless the browser baseline guarantees them.

## Patterns

### Clipboard

```ts
async function writeClipboard(text: string) {
  const clipboard = navigator.clipboard;
  if (!window.isSecureContext || typeof clipboard?.writeText !== 'function') return false;

  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
```

Keep the source text selectable or offer another manual fallback when copying fails.

### Dialog

```ts
function openDialog(dialog: HTMLDialogElement) {
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}
```

Remember that the attribute fallback is non-modal. Use an accessible alternate UI when true modal behavior is required on unsupported browsers.

## Testing

Test the successful path, unavailable capability, denied or rejected operation, fallback behavior, and cleanup. A test-environment polyfill does not count as a production fallback.

## Avoid

- Do not blanket-polyfill every modern API.
- Do not replace simple native behavior with a dependency without a concrete benefit.
- Do not use observers or JavaScript when semantic HTML or CSS already solves the problem.
- Do not assume permission, secure-context, or user-gesture requirements are identical across APIs.
