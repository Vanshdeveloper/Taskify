# Taskify High-End Product Website Template

> **Awwwards-Caliber Static Landing Page Template**  
> Built strictly according to the **`gpt-taste`** AAS skill directives.  
> Pure Semantic **HTML5**, **CSS3**, and **Vanilla JavaScript** with **GreenSock (GSAP 3.12)** & **ScrollTrigger**.

---

## 🚀 Quick Start (Zero Build Step Required)

This template is completely standalone and **does not require Vite, Node, or any build step**:

1. **Direct Browser Preview**:
   - Double-click or open `website-template/index.html` in any modern web browser (Chrome, Edge, Safari, Firefox).
2. **Local Static Server (Optional)**:
   ```bash
   # Using Python
   python -m http.server 8080 --directory website-template

   # Or using npx serve
   npx serve website-template
   ```
   Open `http://localhost:8080` in your browser.

---

## 🎨 Architectural & Design Highlights (`gpt-taste`)

- **Live Interactive Hero Showcase**: A realistic, relatable daily planner card with clickable tasks, streak counters, safe-to-spend indicators, and 3D parallax tilt on scroll.
- **Top Scroll Progress Indicator**: Thin glowing gradient line at the top tracking reading progression from 0% to 100%.
- **Enhanced GSAP Scroll Animations**: Staggered zoom-ins on feature cards, 3D hero tilt on scroll, slide-in pillar cards, and ambient footer glow expansion.
- **Crystal-Clear Plain English**: Completely rewritten without developer jargon or intimidating terminology so anyone can immediately understand the value.
- **Cinematic Center Hero**: Ultra-wide `clamp(2.0rem, 7.5vw, 5.25rem)` typography adhering strictly to the **2-Line Iron Rule** on desktop and dual high-contrast CTAs.
- **GSAP Scrubbing Word Reveal**: In the **Our Promise** section, individual words scrub their opacity progressively from `0.15` to `1.0` locked to scroll progression.
- **Gapless Bento Grid**: Uses CSS Grid with `grid-auto-flow: dense` and mathematical interlocking across a 12-column layout to guarantee zero empty cells.
- **Interactive Pillars Accordion**: Clickable vertical slices in the **How It Works** chapter that expand with smooth spring easing.
- **Infinite Marquee**: Seamless 35-second looping marquee demonstrating privacy and offline guarantees in plain English.
- **Floating Glass Pill Nav**: Frosted glassmorphism (`backdrop-filter: blur(24px) saturate(180%)`) with anchor links and **Install** action linking directly to GitHub Releases.
- **Mobile-First Responsive Layout**: Fully adapted for small smartphones (<400px), standard mobile devices (<640px), tablets (640-1024px), and desktop (>1024px) with safe-area notch padding and zero horizontal clipping.
- **GitHub Releases Ready**: All "Install" CTAs link directly to `https://github.com/your-username/taskify/releases/latest`. Simply replace `your-username/taskify` with your repository address.
- **Strict Anti-Cliché Standards**: Zero emojis in UI or code, zero cheap meta-labels ("SECTION 01", "QUESTION 05"), and wrapped in an overflow-x safe layout.

---

## 📁 File Structure

```
website-template/
├── index.html   # Complete semantic HTML5 structure with Google Fonts & GSAP CDN
├── style.css    # Responsive CSS3 styles, design tokens, bento grid, glassmorphism
├── script.js    # GSAP 3.12 timeline entrance, ScrollTrigger scrubbing, accordion logic
└── README.md    # Documentation and quickstart instructions
```
