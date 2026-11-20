# Taskify Website

Official static showcase and download website for Taskify. Built with semantic HTML5, modern CSS3, and vanilla JavaScript with GreenSock (GSAP 3.12) and ScrollTrigger.

---

## Quick Start (Zero Build Step Required)

This website is completely standalone and does not require Vite, Node, or any build step:

1. **Direct Browser Preview**:
   - Open `website-template/index.html` in any modern web browser.
2. **Local Static Server (Optional)**:
   ```bash
   # Using Python
   python -m http.server 8080 --directory website-template

   # Or using npx serve
   npx serve website-template
   ```
   Open `http://localhost:8080` in your browser.

---

## Architectural & Design Features

- **Expo-Glass Aesthetics**: Multilayered frosted glass with dynamic specular highlights and deep ambient drop shadows.
- **Floating Island Navigation**: Responsive floating pill dock modeled after the native mobile bottom navigation bar in the Taskify app.
- **Dedicated Platform Downloads**: Download cards with direct links for Windows (.exe), macOS (.dmg), Android (.apk), and iPhone / iOS.
- **Feature Showcase**: Sections covering Today Command Center, Bento Milestone Tasks, Atomic Habits, Distraction-Free Notes, Pomodoro Focus Ring, and Daily Safe-to-Spend.
- **GSAP Scroll Animations**: Staggered feature reveals, 3D hero card tilt on scroll, and scrubbed word reveals.
- **Responsive Layout**: Designed for small smartphones, tablets, and wide desktop viewports with safe-area padding and zero horizontal overflow.

---

## File Structure

```
website-template/
├── index.html   # Semantic HTML5 structure with Google Fonts and GSAP CDN
├── style.css    # Responsive styles, design tokens, bento grid, and expo-glass materials
├── script.js    # GSAP scroll animations, counter increments, and interactive accordion
├── images/      # High-resolution screenshots of the Taskify desktop and mobile app
└── README.md    # Documentation and quickstart instructions
```
