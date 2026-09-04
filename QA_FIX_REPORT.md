# LocalSub QA Fix Report

Date: 2026-09-04  
Scope: bounded Android regression plus changed-code verification  
Result: release-blocking checks pass; autonomous QA exit code 0

## Fixed now

| Priority | Finding | Why it mattered | Resolution |
| --- | --- | --- | --- |
| P2 | A normal Android tap on a project opened the editor and the project context menu at the same time. | The native menu intercepted the card while the simultaneous tap gesture also navigated, leaving an unrelated destructive-action menu over the editor. | Isolated the Android menu in a pointer-transparent anchor and made long-press exclusive with tap/pan. Patched the menu library's React Native 0.84 command arguments so imperative long-press opening remains functional. |
| P2 | Android system Back exited LocalSub from Settings instead of returning to Projects. The original failure reproduced 3/3 times. | This broke the platform navigation contract and could discard the user's current in-app context. | Added route-aware Android Back handling for Settings and Editor. Home still delegates Back to Android. Added lifecycle and route regression tests. |
| P2 (tooling) | The repository declared Yarn 4 but Yarn defaulted to Plug'n'Play while the project is laid out for `node_modules`. Canonical QA checks therefore produced false failures. | A broken canonical runner makes CI/local results unreliable and masks real regressions. | Added `.yarnrc.yml` with `nodeLinker: node-modules`; immutable installation and all Yarn checks now pass. |
| P3 | The onboarding processing message never advanced beyond the first phase even though its timer changed a Reanimated shared value. | Shared-value updates do not trigger a React text render, so users saw a frozen status message. | Moved the visible phase index to React state and added timer-driven phase and completion tests. |
| P3 | Splash exit animation and a shared animated style both controlled `opacity`, producing a Reanimated warning and a visible debug warning affordance. | The warning obscured the UI in debug builds and signaled competing animation ownership. | Split exit-transition opacity and shared-value opacity across nested animated views; added a structural regression test. |
| P3 (quality) | Lint had four errors plus warnings from generated reports and one inline constant style. Editor tests also emitted asynchronous React `act(...)` warnings. | Noisy checks make new failures easier to miss. | Removed dead imports/dependencies, ignored generated QA/coverage/build output, moved the constant style into the stylesheet, and awaited asynchronous editor mounts. Canonical lint is silent. |
| P3 (hygiene) | Generated `.qa` evidence was scanned by the app-identity test and could fail it for unrelated artifact text. | Test artifacts must not influence source-identity checks or version control. | Ignored `.qa` in Git, ESLint, and the identity test's directory walker. |

## Verification evidence

- Targeted TDD regression gate: 3 suites, 7 tests passed after first failing for the three product defects.
- Project-card regression gate: 1 suite, 6 tests passed after the structural tests first failed against the overlapping Android touch owners.
- Full Jest gate: 24 suites, 155 tests passed.
- TypeScript: `tsc --noEmit` passed.
- ESLint: passed with 0 errors and 0 warnings.
- Android JVM: 20 tests passed (12 speech-routing and 8 video-export tests).
- Android debug build/install: successful on `emulator-5554`.
- Autonomous QA (ADB + UIAutomator, low regression): 2/2 workflows, 5/5 assertions, and 9/9 actions passed; 0 findings and 0 runtime errors.
- Device replay proved both system Back and in-app Back return Settings to Projects.
- Project-card replay proved 3/3 fast taps opened only the editor; long press still opened the menu and remained on Projects after dismissal.
- Bounded launch log and semantic snapshot contained no Reanimated opacity warning and no “Open debugger to view warnings” affordance; Projects remained visible.

Detailed runner evidence: [latest autonomous QA report](.qa/latest/report.md).

## Coverage

Changed runtime code is strongly covered:

- `useAndroidBackNavigation.ts`: 100% statements, branches, functions, and lines.
- `ProcessingMomentScreen.tsx`: 100% statements, branches, functions, and lines.
- `SplashSequence.tsx`: 93.33% statements and 92.59% lines; 100% branches.
- `ProjectCard.tsx`: 95.12% statements, 83.67% branches, 100% functions, and 94.87% lines.

Repository-wide coverage is 79.04% statements and 78.88% lines. This is pre-existing test debt rather than a regression in the changed scope. The best next coverage investment is the store and native bridge (`app-store.ts` and `native-localsub.ts`), where untested failure/recovery paths carry more risk than presentation components.

## Remaining non-blocking risks

- iOS UI behavior was not exercised in this low-budget Android regression. Run an iOS smoke pass before an App Store release.
- Gradle reports an Android SDK XML tool-version mismatch and features deprecated before Gradle 10. The build succeeds, but the Android toolchain should be aligned in a dedicated maintenance change.
- React Native logs a generic Bridgeless/Catalyst compatibility warning, and the emulator logs graphics-driver warnings. Neither produced an app failure or QA finding; track them with dependency/toolchain upgrades rather than mixing them into this behavioral fix.
