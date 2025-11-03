# POMOPULSE - Pomodoro Timer with Binaural Beats

A modern, immersive Pomodoro timer application that combines the classic productivity technique with scientifically-backed binaural beats and stunning visual animations to help users maintain focus and prevent burnout.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

## 🎯 Overview

POMOPULSE is a full-featured productivity application that implements the Pomodoro Technique—a time management method that breaks work into focused intervals separated by short breaks. What sets this app apart is its integration of binaural beats audio therapy and a responsive particle-based background animation system, creating an immersive experience that enhances concentration and minimizes distractions.

**Problem Solved:** Traditional Pomodoro timers are functional but often lack engaging user experiences. POMOPULSE addresses this by combining proven productivity techniques with audio-visual elements that create a more engaging and effective focus environment.

**Target Users:** Students, remote workers, developers, and anyone seeking to improve productivity and maintain mental clarity during extended work sessions.

## ✨ Features

- **⏱️ Customizable Pomodoro Timer**
  - Adjustable work sessions (default 25 minutes)
  - Configurable short breaks (default 5 minutes)
  - Long break scheduling after specified session intervals
  - Automatic session tracking

- **🎵 Binaural Beats Audio Engine**
  - Three frequency profiles: Alpha Waves, Beta Waves, and Gamma Waves
  - Real-time audio generation using Web Audio API
  - Custom audio engine with oscillator management
  - Play/pause controls synchronized with timer state
  - Mute functionality for flexible audio control

- **🎨 Dynamic Visual Background**
  - Canvas-based particle animation system
  - Interactive mouse-responsive particle deflection
  - Radial wave effects that activate during work sessions
  - Color-coded visual feedback (orange for work, green for breaks)
  - Performance-optimized rendering with requestAnimationFrame

- **⚙️ User Settings & Customization**
  - Customizable work, short break, and long break durations
  - Configurable sessions until long break
  - Settings persisted in local storage
  - Reset functionality to restore defaults

- **🎯 User Experience Enhancements**
  - First-time user introduction popup with app explanation
  - Circular progress indicator showing time remaining
  - Smooth transitions and animations
  - Audio notification on timer completion
  - Responsive design for all screen sizes

## 🛠️ Tech Stack

- **Framework:** Next.js with React 18
- **Language:** TypeScript (strict mode with full type safety)
- **Styling:** Tailwind CSS with custom animations
- **UI Components:** Radix UI primitives for accessible, unstyled components
- **Icons:** Lucide React
- **Audio:** Web Audio API with custom binaural beat engine
- **Graphics:** HTML5 Canvas API for dynamic animations
- **State Management:** React Hooks (useState, useEffect, useRef, useCallback)
- **Deployment:** Vercel

## 🎨 Technical Highlights

### Custom Binaural Beat Audio Engine
Built a complete audio synthesis system using the Web Audio API:
- **Dual Oscillator System:** Generates separate frequencies for left and right audio channels
- **Channel Merging:** Combines stereo channels to create binaural beat effect
- **Audio Context Management:** Handles browser autoplay policies and user gesture requirements
- **Resource Management:** Proper cleanup and disposal of audio resources to prevent memory leaks
- **Error Handling:** Robust error handling for unsupported browsers and audio context failures

### Canvas Animation System
Performance-optimized particle animation engine:
- **Particle System:** Dynamically generated particles with physics-based movement
- **Interactive Effects:** Mouse position influences particle deflection with smooth interpolation
- **Wave Effects:** Radial waves that propagate from center during active sessions
- **Performance Optimization:** 
  - Adaptive rendering resolution based on screen size
  - Frame rate throttling to maintain 60fps
  - Efficient clearing and redrawing strategies
  - Hardware-accelerated transforms

### Architecture & Code Quality
- **Type Safety:** Full TypeScript coverage with strict type checking
- **Component Modularity:** Separated concerns with dedicated components and custom hooks
- **Hook-based Architecture:** Custom `useBinauralBeats` hook for audio state management
- **Performance:** Optimized re-renders, memoization, and efficient state updates
- **Accessibility:** Radix UI components ensure WCAG compliance
- **Responsive Design:** Mobile-first approach with breakpoint optimizations

## 📸 Screenshots
![pomopulse_waves](https://github.com/user-attachments/assets/4cfece2c-21f0-4c11-a8d6-040c755c485d)

![pomopulse_settings](https://github.com/user-attachments/assets/2d485566-4f45-4209-86af-e5c84f7f10fd)

## 🚀 Live Demo

**Deployed Application:** [View Live Demo](https://pomo-pulse.vercel.app/)


## 📁 Project Structure

```
v0-pomodoro/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx             # Main Pomodoro app component
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Reusable UI components (Radix-based)
│   ├── circular-progress.tsx    # Progress ring indicator
│   ├── dynamic-background.tsx   # Canvas animation system
│   ├── introduction-popup.tsx   # First-time user guide
│   ├── settings-panel.tsx        # Configuration interface
│   ├── theme-provider.tsx       # Theme context provider
│   └── timer-display.tsx        # Time display component
├── hooks/
│   └── useBinauralBeats.ts  # Custom hook for audio management
├── lib/
│   ├── audio-engine.ts      # Binaural beat engine class
│   └── utils.ts             # Utility functions
└── public/                   # Static assets
```

## 💡 What I Learned

This project provided valuable experience in several advanced web development areas:

1. **Web Audio API Mastery:** Deep dive into audio synthesis, oscillator management, and browser audio context handling, including navigating autoplay policies.

2. **Canvas Animation Optimization:** Learned performance techniques for real-time canvas rendering, including frame rate management, efficient particle systems, and hardware acceleration strategies.

3. **React Hooks Architecture:** Designed custom hooks for complex stateful logic, demonstrating advanced React patterns for audio state management and lifecycle handling.

4. **TypeScript Best Practices:** Implemented strict typing throughout, including proper interface definitions for audio nodes and state management.

5. **Performance Optimization:** Applied various optimization techniques including requestAnimationFrame, adaptive rendering, and efficient re-render strategies.

6. **User Experience Design:** Balanced functionality with aesthetics, creating an immersive experience that enhances rather than distracts from productivity.


## 📝 Notes

This project was built as a showcase of modern web development techniques, combining productivity tools with advanced browser APIs. The focus was on creating a polished, performant application that demonstrates proficiency in React, TypeScript, Web Audio API, and Canvas graphics programming.


## 📄 License

This project is private and intended for portfolio purposes.

---

**Built with ❤️ using Next.js, TypeScript, and Web Audio API**
