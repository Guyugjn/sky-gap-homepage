# Sky Gap

> *Weaving a tiny world of our own, between pixels and stardust.*

*A personal homepage under a pale-blue morning sky. Ghibli-inspired feel: drifting clouds, glowing particles, a flying fish that follows your cursor, and a vinyl music player. Zero frameworks — just HTML, CSS, and JavaScript.*

---

## Tech Stack

| Layer | Implementation |
|-------|---------------|
| Particles | Canvas 2D — 55 glowing particles with radial gradients & flicker |
| Clouds | Pure CSS ellipses + `@keyframes` drift (far/mid/near layers at different speeds) |
| Flying Fish | SVG fish — autonomous flight + cursor chase + click ripple scare, with inertia, speed scaling & pupil tracking |
| Player | `repeating-radial-gradient` groove texture + CSS rotation animation |
| Audio | HTML5 `<audio>`, shuffle / repeat-one / list-loop, fade-in/out |

## Getting Started

```bash
git clone https://github.com/Guyugjn/sky-gap-homepage.git
```

Open `index.html` in your browser.

## License

MIT License

---

*Assisted by DeepSeek AI*
