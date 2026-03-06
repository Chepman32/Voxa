# Software Design Document (SDD)
**Project Name:** Voxa
**Platform:** iOS (React Native)
**Core Functionality:** Offline AI-powered Subtitle Creator (Video File Input Only)

---

## 1. Introduction

### 1.1 Purpose
This document provides a comprehensive architectural and design specification for **Voxa**, a production-ready iOS application built with React Native. Voxa allows users to import local video files, automatically generate subtitles using native on-device iOS speech recognition, and export the subtitled videos. The app is strictly offline, ensuring absolute privacy and zero server-side processing dependencies.

### 1.2 Design Philosophy
Voxa is engineered with a strict "Gesture-First" UI/UX paradigm. Inspired by fluid interfaces like Tinkoff Bank and Facebook's mobile gestures, the app minimizes static buttons in favor of intuitive swipes, pinches, and long-presses. Visually, Voxa utilizes a dark, glassmorphic aesthetic powered by `react-native-reanimated` and `@shopify/react-native-skia` for cinematic, 60fps/120fps physics-based animations. 

*Constraint Checklist:* No emojis are used in the UI or codebase. All iconography utilizes vector icons (e.g., Feather, Ionicons). Placeholder/thematic imagery is sourced dynamically from high-quality remote repositories (e.g., Pexels, Unsplash).

---

## 2. Technical Stack & Architecture

### 2.1 Core Technologies
*   **Framework:** React Native (Latest stable version, New Architecture/Fabric enabled).
*   **Language:** TypeScript strictly typed.
*   **Animations & Graphics:** 
    *   `react-native-reanimated` (v3+ for worklet-based UI thread animations).
    *   `@shopify/react-native-skia` (for complex visual effects, shaders, and text manipulations).
*   **Gestures:** `react-native-gesture-handler` (v2+).
*   **State Management:** `Zustand` (for global state) + `Jotai` (for atomic timeline/subtitle block state to prevent unnecessary re-renders during video playback).
*   **Video Processing:** `react-native-video` (for playback), custom native iOS modules (AVFoundation for exporting).
*   **Vector Icons:** `react-native-vector-icons` (Feather/Ionicons).

### 2.2 Native iOS Integration (The "Brain")
Since Voxa operates 100% offline and processes only pre-recorded video files, the native iOS bridge is paramount.
*   **Audio Extraction Module:** A custom Swift module utilizing `AVAssetExportSession` to extract an audio track (`.m4a` or `.caf`) from the selected video file locally.
*   **Speech Recognition Module:** A custom Swift module utilizing `SFSpeechRecognizer` with `requiresOnDeviceRecognition = true`. 
    *   It processes the extracted audio file via `SFSpeechURLRecognitionRequest`.
    *   It returns an array of JSON objects to the JavaScript thread, containing recognized text, start timestamps, and end timestamps at the word level.

---

## 3. UI/UX Paradigm & Styling

### 3.1 Visual Language
*   **Color Palette:**
    *   Background: Deep Obsidian (`#0A0A0C`) to True Black (`#000000`).
    *   Surfaces: Frosted Glass / Translucent Graphite (`rgba(25, 25, 30, 0.6)` with backdrop blur).
    *   Accent/Interactive: Neon Cyan (`#00F0FF`) and Electric Violet (`#8A2BE2`) used exclusively in Skia gradients.
    *   Text: Pure White (`#FFFFFF`) for primary, Slate Gray (`#8E8E93`) for secondary.
*   **Typography:** San Francisco Pro Display (System Font). Heavy weights for headings, medium for timeline text.
*   **Iconography:** Crisp, minimalist line icons (`Feather` icons).
*   **Haptics:** `react-native-haptic-feedback` is triggered on every block snap, timeline pinch, and swipe threshold crossing.

### 3.2 Global Gesture Rules
*   **Pull-to-Dismiss:** Every modal or sub-screen (like settings or export) is dismissible via a downward swipe.
*   **Swipe-to-Action:** Horizontal swipes on lists reveal actions (Delete, Duplicate) with spring-physics resistance.
*   **Edge-Swipes:** Navigating back is strictly handled by iOS native left-edge swiping.

---

## 4. Detailed Screen Specifications

### 4.1 Splash Screen (The "Skia Shatter" Entry)
**Visuals & Animations:**
Upon launching Voxa, the user sees a pitch-black screen. 
1.  **The Twist:** The word "VOXA" appears in the center. Using `@shopify/react-native-skia` text paths and `reanimated`, the text is initially distorted---a tangled, rapidly twisting ribbon of Cyan and Violet gradients.
2.  **The Snap:** Over 800ms, the ribbons violently untangle and snap into a perfectly crisp, solid white "VOXA" logo. A heavy haptic thud triggers.
3.  **The Physics Breakdown:** After a brief pause, gravity inverts. The solid text shatters into hundreds of tiny Skia polygonal particles. Using a customized physics worklet (calculating velocity and friction on the UI thread), the particles fall toward the bottom of the screen, bouncing off an invisible floor and fading out.
4.  **Transition:** As the particles fade, the Home Screen scales up from 0.9 to 1.0 with a smooth opacity fade-in.

### 4.2 Onboarding & Permissions Screen
*Triggered only on first launch.*
*   **UI Elements:** A sleek carousel of full-screen cards. Backgrounds are blurred remote images from Pexels (e.g., `https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg` representing focus and media).
*   **Content:** Text explaining the offline nature of the app.
*   **Interaction:** User swipes left to progress. 
*   **Permissions:** The final card requests Photo Library access (to select videos) and Speech Recognition access. Instead of buttons, the user is prompted to "Swipe Up to Grant Access." Swiping up triggers a fluid morphing animation where the text turns into a loading spinner, invoking the iOS native permission dialogs.

### 4.3 Home Screen (Project Dashboard)
**UI Layout:**
*   **Header:** Dynamic greeting ("Good Morning") scaling down as the user scrolls. A small `<Feather name="settings" />` icon in the top right.
*   **Empty State:** If no projects exist, a high-quality, abstract monochromatic remote image (e.g., from Unsplash) sits in the center with the text "Pull down to create."
*   **Project List:** A masonry layout of previously edited videos. Each card shows a video thumbnail, duration, and subtitle count.

**Interactions:**
*   **Create Project:** The user pulls the entire screen downward. A massive, glowing `<Feather name="plus-circle" />` icon scales up from the top edge. Upon releasing the pull past a certain threshold, the device vibrates heavily, and the native iOS video picker slides up.
*   **Delete Project:** Swiping left on a project card stretches the card like a rubber band. Releasing it snaps it back; pulling past 40% of the screen width turns the background red, and releasing deletes the item with a shrinking animation.

### 4.4 The Editor Screen (Core Feature)
*This screen is divided into three distinct vertical zones.*

#### Zone 1: Video Player (Top 40%)
*   **UI:** Edge-to-edge video player. No visible playback controls by default.
*   **Gestures:**
    *   Tap: Play/Pause.
    *   Double Tap Left/Right: Skip backward/forward 5 seconds (with a smooth ripple animation overlay).
    *   Swipe Down: Minimizes the entire Editor Screen back to the Home Screen in a Picture-in-Picture style transition.

#### Zone 2: Subtitle Timeline (Middle 40%)
*   **UI:** A horizontally scrolling canvas. 
    *   Background: Dark gray.
    *   Center Playhead: A stationary glowing cyan vertical line.
    *   Audio Waveform: Rendered via Skia paths, mapping the audio decibels.
    *   Subtitle Blocks: Rounded rectangular blocks sitting over the waveform.
*   **Animations & Gestures:**
    *   **Scrolling:** Swiping left/right scrubs through the video. The video player in Zone 1 updates its frame synchronously without lag (using Reanimated `useAnimatedScrollHandler`).
    *   **Pinch-to-Zoom:** Using `PinchGestureHandler`, pinching in/out horizontally scales the timeline scale. The waveform redraws dynamically via Skia to show more/less detail.
    *   **Block Manipulation:** Long-pressing a subtitle block detaches it (it scales up slightly, casts a heavy Skia drop-shadow). The user can drag it left or right to adjust timing. When dragged near another block, it magnetically "snaps" to the edge, accompanied by a light haptic tick.
    *   **Trimming:** Dragging the left or right edges of a block trims the duration.

#### Zone 3: Text & Style Editor (Bottom 20%)
*   **State 1 (Idle):** Shows the currently active subtitle text in a large, legible font.
*   **State 2 (Editing):** Tapping the text expands this zone upward. A native keyboard appears.
    *   **Swipe Navigation:** While editing, swiping left or right on this text area instantly saves the current text and jumps to edit the adjacent subtitle block, moving the timeline playhead automatically.
*   **Style Panel:** Accessed by swiping up on the text zone. Reveals horizontal scroll views for Fonts, Colors, and Positions (Top, Middle, Bottom). Selecting a style immediately updates the text overlay on the Video Player using shared values.

### 4.5 Processing Overlay (The "Offline AI" Screen)
*Triggered after selecting a video from the Home Screen.*
*   **UI:** A translucent blur over the video thumbnail.
*   **Visuals:** A Skia-rendered circular progress ring. Inside the ring, vector icons rapidly cycle (`<Feather name="video" />`, `<Feather name="mic" />`, `<Feather name="file-text" />`) to represent extraction, recognition, and generation.
*   **Text:** "Extracting audio..." -> "Analyzing speech locally..." -> "Generating timeline..."
*   **Animation:** The background gently pulses with the Neon Cyan accent color using a sine wave function driven by `withRepeat`.

### 4.6 Export & Share Screen
*   **Trigger:** From the Editor Screen, the user performs a continuous swipe up from the very bottom edge.
*   **UI:** A bottom sheet modal (built with Reanimated) slides up, filling 80% of the screen.
*   **Content:** 
    *   A preview of the final video looping.
    *   Export Settings: Resolution (720p, 1080p, 4K) toggleable via a fluid pill-shaped slider.
    *   "Export to Photos" action area.
*   **Interaction:** To confirm export, the user presses and holds a large circular area. A Skia-rendered liquid fill animation fills the circle from bottom to top. Once full (approx 1.5 seconds), the export begins natively. If the user lets go early, the liquid violently splashes down and the action is canceled.

---

## 5. Animation & Interaction Dictionary

To achieve the "gorgeous" requirement, Voxa relies heavily on specific animation curves and techniques:

1.  **Spring Physics over Timing:** Almost zero `withTiming` animations are used for layout changes. Everything utilizes `withSpring`. Default configuration: `mass: 1, damping: 15, stiffness: 120`. This gives the UI a heavy, physical, snapping feel similar to Tinkoff.
2.  **Skia Shaders:** The active subtitle block in the timeline uses a custom Skia fragment shader to render a subtle, moving gradient border, making it look "alive" compared to inactive blocks.
3.  **Shared Element Transitions:** When opening a project from the Home Screen, the thumbnail image scales and translates seamlessly into the Video Player zone of the Editor Screen, while the rest of the UI fades in around it.
4.  **Haptic Synchronization:** Animations are tightly coupled with `react-native-haptic-feedback`. 
    *   `impactLight`: UI toggles, scrubbing over a subtitle boundary.
    *   `impactMedium`: Snapping a block, closing a modal.
    *   `impactHeavy`: Deleting a project, finishing export.

---

## 6. Data Flow & State Management

### 6.1 Entity Models
```typescript
interface Project {
  id: string; // UUID
  videoLocalURI: string; // Path to local device file
  duration: number;
  createdAt: number;
  subtitles: SubtitleBlock[];
  globalStyle: SubtitleStyle;
}

interface SubtitleBlock {
  id: string; // UUID
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
  text: string;
}
```

### 6.2 State Architecture
*   **Global State (Zustand):** Manages the list of `Project` objects, user preferences, and app-wide theme settings. Data is persisted to local storage using `react-native-mmkv` for synchronous, ultra-fast read/writes.
*   **Editor State (Jotai):** The Editor Screen is highly volatile. Using Jotai atoms prevents the entire screen from re-rendering when the playhead moves.
    *   `playheadPositionAtom`: Updates 60 times a second based on video playback.
    *   `activeSubtitleAtom`: Derived atom that calculates which subtitle block should be displayed based on the `playheadPositionAtom`.

### 6.3 Subtitle Generation Flow (Offline Native)
1.  **Input:** User selects a `.mp4` or `.mov` from the iOS Photos library.
2.  **Bridging:** The file URI is passed to the custom Swift module `AudioExtractor`.
3.  **Extraction:** Swift extracts the audio track natively to `NSTemporaryDirectory`.
4.  **Recognition:** The audio URI is passed to the Swift `SpeechRecognizer` module.
5.  **Parsing:** Swift utilizes `SFSpeechRecognizer`. The `SFSpeechRecognitionResult` is parsed. The module iterates through `result.bestTranscription.segments`.
6.  **Formatting:** Swift formats the segments into the `SubtitleBlock` JSON array.
7.  **Callback:** The JSON array is sent back across the bridge to JS, where it populates the Jotai store and renders the Skia timeline.

---

## 7. Graphics & Asset Strategy

*   **No Embedded Raster Assets:** To keep the app bundle incredibly small and performant, zero raster images (PNGs/JPEGs) are shipped in the bundle.
*   **Remote Placeholders:** All thematic imagery (e.g., onboarding backgrounds, empty states) fetches highly optimized JPEGs from Unsplash or Pexels via direct URL.
    *   *Example URI:* `https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=1080&auto=format&fit=crop` (A sleek camera lens/film reel image).
    *   These are cached locally upon first load using `react-native-fast-image`.
*   **Icons:** Handled entirely by `react-native-vector-icons`. The `Feather` set is used exclusively to maintain a cohesive, ultra-thin, modern aesthetic. Emojis are strictly banned from the app's design language to maintain a professional, high-end cinematic software feel.
*   **UI Components:** All buttons, cards, and dividers are drawn mathematically using React Native Views or Skia Canvas elements, styled with Reanimated shared values.