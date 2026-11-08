# Graph Report - OpenSuperMarketWebSim  (2026-11-08)

## Corpus Check
- 338 files · ~419,998 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: .css 5, (none) 2)

## Summary
- 3203 nodes · 5529 edges · 253 communities (237 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 147 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d9e1fa82`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- sloplint.mjs
- pull-hig.mjs
- App.tsx
- SimCtx
- refcheck.mjs
- theme.mjs
- storeOps.ts
- package.json
- inventory.ts
- Dock menus
- report
- getAttr
- resolveVars
- parseColor
- Typography
- ref_node_fs
- Live Activities
- employees.ts
- Widgets
- macrostructures.md
- Apple Pay
- sloplint-render.mjs
- path-controls.md
- Machine learning
- Apple Design Skill
- capture.mjs
- compilerOptions
- image-wells.md
- time.ts
- App Clips
- The menu bar
- Standard icons
- install.mjs
- compilerOptions
- HIG reference lookup
- Responsive
- 4. The gates
- twGroup
- Color
- picture.mjs
- menus.md
- Buttons
- Liquid Glass
- Sign in with Apple
- map.ts
- Augmented reality
- File management
- Tablet (iPadOS)
- Craft
- imagegen.mjs
- Rating indicators
- Toolbars
- hallmark/SKILL.md
- Anatomy
- Flow branches
- Scroll choreography: the one earned pattern
- checkTailwind
- Flow
- Apple Pencil and Scribble
- Charts
- Design principles
- Designing for iPhone Duo
- Generative AI
- Inclusion
- Menus
- Playing haptics
- Privacy
- Search fields
- SF Symbols
- Interaction and states
- Patterns
- Almanac
- Arcade
- Atelier
- Bloom
- Blueprint
- Broadside
- Brutal
- Carnival
- Cobalt
- Console
- Coral
- Darkroom
- Dose
- Dusk
- Editorial
- Formwork
- Furrow
- Garden
- Grid
- Halftone
- Hedgerow
- Hum
- Ink
- Kiln
- Loom
- Lumen
- Manifesto
- Midnight
- Newsprint
- Overprint
- Paste-up
- Piste
- Refract
- Ribbon
- Rim
- Riso
- Solstice
- Specimen
- Spore
- Sport
- Squeeze
- Sticker
- Studio
- Terminal
- Terrazzo
- Ultraviolet
- Vantage
- Vellum
- Wayfind
- Werkstatt
- AirPlay
- Alerts
- App icons
- Apple In-App Purchase
- Dark Mode
- Gestures
- Toggles
- Dark mode: parity, never inversion
- Imagery
- Texture and print artifacts: a budgeted vocabulary
- install-hook.mjs
- Accessibility
- Feedback
- App Shortcuts
- Layout
- Lists and tables
- Maps
- Notifications
- Settings
- Windows
- Custom: a page of its own
- Fonts
- Layout
- Redesign
- Ponytail Help
- Code audit
- Context menus
- Designing for games
- Drag and drop
- Edit menus
- Materials
- Multitasking
- Playing audio
- Playing video
- Right to left
- Scroll views
- Segmented controls
- Sheets
- Siri
- Split views
- Virtual keyboards
- interface
- Comp before build: composing in pixels before composing in CSS
- Boxes
- Controls
- Disclosure controls
- Game controls
- Gauges
- Going full screen
- Image views
- Keyboards
- Launching
- Motion
- Offering help
- Onboarding
- Page controls
- Pickers
- Progress indicators
- Sidebars
- Sliders
- Tab bars
- Tab views
- Text fields
- Data viz: charts that read as set, not generated
- Writing a theme file
- tailwind-fail/Hero.tsx
- Charting data
- Entering data
- Focus and selection
- Images
- Labels
- Live-viewing apps
- Loading
- Managing accounts
- Managing notifications
- Pop-up buttons
- Popovers
- Pull-down buttons
- Searching
- Snippets
- Text views
- Undo and redo
- VoiceOver
- Writing
- Genre: atmospheric
- Genre: editorial (the default)
- Genre: modern-minimal
- Genre: playful
- Macrostructures
- clsLits
- Supermarket Tycoon
- Action sheets
- Activity views
- Branding
- sheets.md
- Collections
- Color wells
- iCloud
- Home Screen quick actions
- Printing
- Steppers
- design.md: the locked system
- Microinteractions
- ponytail-audit/SKILL.md
- Ponytail Gain
- ponytail-review/SKILL.md
- Ponytail
- Cross-platform translation
- designing-for-games.md
- state.ts
- solvency.ts
- Web views
- ponytail-debt/SKILL.md
- tailwind-pass/Hero.tsx
- tsconfig.json
- CLAUDE.md
- .claude/CLAUDE.md
- saveRepo.ts
- NFC
- 05-workbench.md
- 07-manifesto.md
- 09-quote-led.md
- 11-catalogue.md
- 17-type-specimen.md
- review-finish.md
- review-hero.md
- Feature.vue
- lists-and-tables.md

## God Nodes (most connected - your core abstractions)
1. `report()` - 90 edges
2. `trunc()` - 44 edges
3. `resolveVars()` - 42 edges
4. `dayOf()` - 40 edges
5. `GameState` - 34 edges
6. `SimCtx` - 26 edges
7. `money()` - 26 edges
8. `getAttr()` - 25 edges
9. `useGame()` - 25 edges
10. `record()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `Surfaces` --references--> `record()`  [INFERRED]
  .claude/skills/hallmark/references/themes/ultraviolet.md → src/domain/economy.ts
- `Tokens` --references--> `record()`  [INFERRED]
  .claude/skills/hallmark/references/themes/ultraviolet.md → src/domain/economy.ts
- `DTCG `tokens.json`` --references--> `clamp()`  [INFERRED]
  .claude/skills/hallmark/references/export-formats.md → src/sim/customerSystem.ts
- `Fluid and discrete` --references--> `clamp()`  [INFERRED]
  .claude/skills/hallmark/references/responsive.md → src/sim/customerSystem.ts
- `Build` --references--> `check()`  [INFERRED]
  .claude/skills/hallmark/references/redesign.md → .claude/skills/hallmark/scripts/theme.mjs

## Import Cycles
- None detected.

## Communities (253 total, 16 thin omitted)

### Community 0 - "sloplint.mjs"
Cohesion: 0.03
Nodes (72): ANSWERED, APP_SKIP, args, BUILD_DIRS, check25(), check62(), check76(), CHECKS (+64 more)

### Community 1 - "pull-hig.mjs"
Cohesion: 0.07
Nodes (65): abstractOf(), ALL_PLATFORMS, anchorEntries(), anchorMapFor(), cellText(), collapseBlankLines(), collectReferences(), coveredPlatformsLine() (+57 more)

### Community 2 - "App.tsx"
Cohesion: 0.11
Nodes (55): react, App(), GameShell(), NAV, SCREENS, SPEED_LABEL, SPEED_NAME, formatClock() (+47 more)

### Community 3 - "SimCtx"
Cohesion: 0.10
Nodes (23): toParts(), TX_CATEGORY_NAMES, TxCategory, effectiveProductivity(), onDutyAt(), consumeStock(), activeFactor(), demandFactor() (+15 more)

### Community 4 - "refcheck.mjs"
Cohesion: 0.04
Nodes (47): args, AS_JSON, BY_BASE, CANON, catalogFaces, clean, exemplarDir, expectations (+39 more)

### Community 5 - "theme.mjs"
Cohesion: 0.09
Nodes (51): addLog(), ADJUST, args, ASK, BASE_CUSTOM, buildIndex(), check(), contrastOf() (+43 more)

### Community 6 - "storeOps.ts"
Cohesion: 0.09
Nodes (48): dayOf(), monthLabel(), EQUIPMENT, EQUIPMENT_MAP, EquipmentType, REPAIR_COST_FACTOR, levelDef(), STORE_LEVELS (+40 more)

### Community 8 - "package.json"
Cohesion: 0.07
Nodes (38): dependencies, react@^19.2.8, react-dom@^19.2.8, zod@^4.4.3, zustand@^5.0.15, devDependencies, oxlint@^1.75.0, prettier@^3.9.6 (+30 more)

### Community 9 - "inventory.ts"
Cohesion: 0.15
Nodes (25): EquipmentDef, PRODUCT_MAP, ProductCategory, ProductDef, productDef(), PRODUCTS, StorageType, SUPPLIER_MAP (+17 more)

### Community 10 - "Dock menus"
Cohesion: 0.50
Nodes (4): Best practices, Dock menus, Platform considerations, Related guidelines

### Community 11 - "report"
Cohesion: 0.08
Nodes (40): applyWaivers(), appSkip(), baseGate(), check10(), check10Motion(), check11(), check15(), check17() (+32 more)

### Community 12 - "getAttr"
Cohesion: 0.12
Nodes (35): accentedHeads(), accentedWordInHero(), ancestorMap(), capsRatio(), check28(), check3(), check30(), check33() (+27 more)

### Community 13 - "resolveVars"
Cohesion: 0.11
Nodes (39): baseSelector(), check1(), check11Lift(), check12(), check15Fade(), check23(), check24a(), check37() (+31 more)

### Community 14 - "parseColor"
Cohesion: 0.11
Nodes (30): bannedGradient(), check2(), check29Glow(), check48(), check65(), check7(), firstFamily(), gradientHues() (+22 more)

### Community 15 - "Typography"
Cohesion: 0.06
Nodes (33): AX1, AX2, AX3, AX4, AX5, Change log, Conveying hierarchy, Desktop (macOS) (+25 more)

### Community 16 - "ref_node_fs"
Cohesion: 0.13
Nodes (10): globalRoot(), script, png, script, main(), OK(), script, dir (+2 more)

### Community 17 - "Live Activities"
Cohesion: 0.07
Nodes (28): Adding transitions and animating content updates, Anatomy, Best practices, CarPlay, CarPlay dimensions, Change log, Choosing colors, Compact (+20 more)

### Community 18 - "employees.ts"
Cohesion: 0.10
Nodes (24): vitest, Rng, MIN_PER_DAY, dailyEmployeeUpkeep(), EmployeeStatus, fire(), FIRST_NAMES, generateApplicant() (+16 more)

### Community 19 - "Widgets"
Cohesion: 0.08
Nodes (25): Accented, Accessory widgets, Adding interactivity, Anatomy, Appearances, Apple HomeView, Best practices, Change log (+17 more)

### Community 20 - "macrostructures.md"
Cohesion: 0.08
Nodes (12): 01 · Bento Grid, 03 · Marquee Hero, 06 · Conversational FAQ, 08 · Photographic, 10 · Specimen, 12 · Letter, 13 · Index-First, 15 · Split Studio (+4 more)

### Community 21 - "Apple Pay"
Cohesion: 0.09
Nodes (23): Apple Pay, Apple Pay button, Apple Pay mark, Black, Button size and position, Button styles, Button types, Change log (+15 more)

### Community 22 - "sloplint-render.mjs"
Cohesion: 0.18
Nodes (21): CHROMES, contrast(), focusRing(), frames(), hideStyles(), inventory(), isUrl(), lineBreaks() (+13 more)

### Community 24 - "path-controls.md"
Cohesion: 0.29
Nodes (4): Best practices, Path controls, Platform considerations, Related guidelines

### Community 26 - "Machine learning"
Cohesion: 0.10
Nodes (20): Attribution, Calibration, Change log, Confidence, Corrections, Critical or complementary, Dynamic or static, Explicit feedback (+12 more)

### Community 27 - "Apple Design Skill"
Cohesion: 0.10
Nodes (19): Always load, Apple Design Skill, Apple's design principles, Design improvement mode, Every page, by Apple's section, Lens 1: Accessibility (failures are Critical), Lens 2: Platform conventions (failures are usually High), Lens 3: Visual design and craft (findings are High or Medium) (+11 more)

### Community 28 - "capture.mjs"
Cohesion: 0.10
Nodes (15): argv, chrome, CHROMES, HERE, isUrl, made, out, roots (+7 more)

### Community 29 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 30 - "image-wells.md"
Cohesion: 0.50
Nodes (4): Best practices, Image wells, Platform considerations, Related guidelines

### Community 31 - "time.ts"
Cohesion: 0.11
Nodes (27): ACCOUNTING_HOUR, CLOSE_HOUR, DAYS_PER_MONTH, DAYS_PER_WEEK, DAYS_PER_YEAR, formatMinutesAsHM(), isCustomerHour(), MIN_PER_HOUR (+19 more)

### Community 32 - "App Clips"
Cohesion: 0.11
Nodes (18): App Clip Codes, App Clips, Change log, Creating App Clips for businesses, Creating content for an App Clip card, Customizing your App Clip Code, Designing your App Clip, Displaying App Clip Codes (+10 more)

### Community 33 - "The menu bar"
Cohesion: 0.11
Nodes (18): Anatomy, App menu, App-specific menus, Best practices, Change log, Desktop (macOS), Dynamic menu items, Edit menu (+10 more)

### Community 34 - "Standard icons"
Cohesion: 0.12
Nodes (17): Best practices, Change log, Desktop (macOS), Document icons, Editing, Icons, Layer ordering, Other (+9 more)

### Community 35 - "install.mjs"
Cohesion: 0.13
Nodes (14): args, copyDir(), DRY, explicit, FLAGS, has(), HERE, HOME (+6 more)

### Community 36 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 37 - "HIG reference lookup"
Cohesion: 0.12
Nodes (16): Components › Content, Components › Layout and organization, Components › Menus and actions, Components › Navigation and search, Components › Presentation, Components › Selection and input, Components › Status, Components › System experiences (+8 more)

### Community 38 - "Responsive"
Cohesion: 0.12
Nodes (14): DTCG `tokens.json`, Export formats, shadcn/ui, Tailwind v4, The token set, `tokens.css` in a project, Breakpoints, Clickable text never wraps (+6 more)

### Community 39 - "4. The gates"
Cohesion: 0.12
Nodes (15): 1. How a gate binds, 2. Waivers and answers, 3. Pre-emit critique, 4. The gates, 5. Finish checks and judged clauses, 6. The reviews, in fresh context, Assets and access, Chrome and copy (+7 more)

### Community 40 - "twGroup"
Cohesion: 0.15
Nodes (16): buildContext(), buildTokens(), check26(), check27(), check34(), checkF16(), importsOf(), linksOf() (+8 more)

### Community 41 - "Color"
Cohesion: 0.13
Nodes (15): App accent colors, Best practices, Change log, Color, Color management, Desktop (macOS), Inclusive color, iOS, iPadOS system gray colors (+7 more)

### Community 42 - "picture.mjs"
Cohesion: 0.13
Nodes (11): chrome, CHROMES, cssPath, HERE, out, page, roots, [slug, pageArg, yArg] (+3 more)

### Community 43 - "menus.md"
Cohesion: 0.17
Nodes (8): Best practices, Combo boxes, Platform considerations, Related guidelines, Best practices, Platform considerations, Related guidelines, Token fields

### Community 44 - "Buttons"
Cohesion: 0.14
Nodes (14): Best practices, Buttons, Change log, Content, Desktop (macOS), Help buttons, Image buttons, Mobile (iOS, iPadOS) (+6 more)

### Community 45 - "Liquid Glass"
Cohesion: 0.14
Nodes (14): Apple's rules, Color on glass, Cross-platform translation, Flutter, Liquid Glass, React Native, Related guidelines, Review checklist (+6 more)

### Community 46 - "Sign in with Apple"
Cohesion: 0.14
Nodes (14): Black, Button size and corner radius, Change log, Collecting data, Creating a custom Sign in with Apple button, Custom buttons with a logo and text, Custom logo-only buttons, Displaying buttons (+6 more)

### Community 47 - "map.ts"
Cohesion: 0.08
Nodes (59): SPEED_MIN_PER_SEC, autoPlace(), canPlace(), createMap(), doorTiles(), footprint(), inStorageZone(), isWall() (+51 more)

### Community 48 - "Augmented reality"
Cohesion: 0.15
Nodes (13): Augmented reality, Best practices, Communicating with people, Designing object interactions, Handling interruptions, Helping people place objects, Icons and badges, Offering a multiuser experience (+5 more)

### Community 49 - "File management"
Cohesion: 0.15
Nodes (13): Change log, Creating and opening files, Custom file management, Desktop (macOS), Document launcher, File management, File provider app extension, Finder Sync extensions (+5 more)

### Community 50 - "Tablet (iPadOS)"
Cohesion: 0.15
Nodes (13): Best practices, Change log, Customizing pointers, Desktop (macOS), Platform considerations, Pointer accessories, Pointer magnetism, Pointer shape and content effects (+5 more)

### Community 51 - "Craft"
Cohesion: 0.15
Nodes (11): 1. Type, 2. Colour, 3. Surfaces, 4. The hero's motion, 5. Motion, 6. Copy, 7. Opening a section, 8. Missing facts (+3 more)

### Community 52 - "imagegen.mjs"
Cohesion: 0.15
Nodes (7): args, hash, n, prompt, stem, steps, [w, h]

### Community 53 - "Rating indicators"
Cohesion: 0.18
Nodes (9): Best practices, Change log, Platform considerations, Rating indicators, Related guidelines, Best practices, Change log, Platform considerations (+1 more)

### Community 54 - "Toolbars"
Cohesion: 0.17
Nodes (12): Actions, Best practices, Change log, Desktop (macOS), Item groupings, Navigation, Phone (iOS), Platform considerations (+4 more)

### Community 55 - "hallmark/SKILL.md"
Cohesion: 0.18
Nodes (5): Brand truth: never theme a real brand from memory, Caching and staleness, The protocol, What this protocol never does, When fetching is impossible

### Community 56 - "Anatomy"
Cohesion: 0.17
Nodes (12): Anatomy, attend (an event, a festival, a race, a conference), book (a restaurant, a class, a clinic, a studio), buy (a physical product, a small shop), hire (a studio, a freelancer, an architect), How pages end, join (a club, a community, a membership), listen (a band, a film, a podcast, a publication) (+4 more)

### Community 57 - "Flow branches"
Cohesion: 0.17
Nodes (12): App screens, Comp before build (signal 9), Component scope, Edit-time linting, Fast mode, Flow branches, Framework projects, Harnesses (+4 more)

### Community 58 - "Scroll choreography: the one earned pattern"
Cohesion: 0.17
Nodes (9): 14 · Narrative Workflow, 16 · Feature Stack, 1 · Pinned chapter: steps reveal while the section is pinned, 2 · Scrub-linked headline: one display element, clip wipe, 3 · Progress spine: `scroll(root)` scaling a 2px rule, 4 · Sticky diptych: a two-pane pin, Budget, JS fallback (optional, shared) (+1 more)

### Community 59 - "checkTailwind"
Cohesion: 0.23
Nodes (12): checkComponentText(), checkTailwind(), closeIndex(), compInner(), directChildren(), tw54(), tw67(), twDataText() (+4 more)

### Community 60 - "Flow"
Cohesion: 0.17
Nodes (12): 0. Pre-flight, 1. Ask once, 2. Shape, 3. Direction, 4. Load, 5. The Picks block, 6. Build, 7. Sweep (+4 more)

### Community 61 - "Apple Pencil and Scribble"
Cohesion: 0.18
Nodes (11): Apple Pencil and Scribble, Barrel roll, Best practices, Change log, Custom drawing, Double tap, Hover, Platform considerations (+3 more)

### Community 62 - "Charts"
Cohesion: 0.18
Nodes (11): Anatomy, Axes, Best practices, Change log, Charts, Color, Descriptive content, Enhancing the accessibility of a chart (+3 more)

### Community 63 - "Design principles"
Cohesion: 0.18
Nodes (10): Agency, Change log, Craft, Delight, Design principles, Familiarity, Flexibility, Purpose (+2 more)

### Community 64 - "Designing for iPhone Duo"
Cohesion: 0.18
Nodes (11): Anatomy, Arrangement views, Best practices, Change log, Designing for iPhone Duo, Device poses, Dynamic layouts, Related guidelines (+3 more)

### Community 65 - "Generative AI"
Cohesion: 0.18
Nodes (11): Best practices, Change log, Continuous improvement, Generative AI, Inputs, Models and datasets, Outputs, Platform considerations (+3 more)

### Community 66 - "Inclusion"
Cohesion: 0.18
Nodes (11): Accessibility, Avoiding stereotypes, Being approachable, Gender identity, Inclusion, Inclusive by design, Languages, People and settings (+3 more)

### Community 67 - "Menus"
Cohesion: 0.18
Nodes (11): Change log, Icons, In-game menus, Labels, Menus, Mobile (iOS, iPadOS), Organization, Platform considerations (+3 more)

### Community 68 - "Playing haptics"
Cohesion: 0.18
Nodes (11): Best practices, Change log, Custom haptics, Desktop (macOS), Impact, Notification, Phone (iOS), Platform considerations (+3 more)

### Community 69 - "Privacy"
Cohesion: 0.18
Nodes (11): Best practices, Change log, Desktop (macOS), Location button, Platform considerations, Pre-alert screens, windows, or views, Privacy, Protecting data (+3 more)

### Community 70 - "Search fields"
Cohesion: 0.18
Nodes (11): Best practices, Change log, Phone (iOS), Platform considerations, Related guidelines, Scope bars and tokens, Search as a tab, Search as an inline field (+3 more)

### Community 71 - "SF Symbols"
Cohesion: 0.18
Nodes (11): Animations, Change log, Custom symbols, Design variants, Gradients, Platform considerations, Related guidelines, Rendering modes (+3 more)

### Community 72 - "Interaction and states"
Cohesion: 0.18
Nodes (10): Focus rings, Forms, Hit targets, Interaction and states, Loading and empty, Modals and overlays, Popovers, menus, tooltips, The eight states (+2 more)

### Community 73 - "Patterns"
Cohesion: 0.18
Nodes (11): A choice between a few, A fact the prompt did not give, A form that posts nowhere yet, A loop that can pause, A photograph in a slot, A rail and a switcher, A way past the nav, Controls, all eight states (+3 more)

### Community 74 - "Almanac"
Cohesion: 0.18
Nodes (10): Almanac, Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 75 - "Arcade"
Cohesion: 0.18
Nodes (10): Arcade, Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 76 - "Atelier"
Cohesion: 0.18
Nodes (10): Atelier, Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 77 - "Bloom"
Cohesion: 0.18
Nodes (10): Bloom, Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 78 - "Blueprint"
Cohesion: 0.18
Nodes (10): Blueprint, Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 79 - "Broadside"
Cohesion: 0.18
Nodes (10): Broadside, Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 80 - "Brutal"
Cohesion: 0.18
Nodes (10): Brutal, Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 81 - "Carnival"
Cohesion: 0.18
Nodes (10): Build hint, Carnival, Controls, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 82 - "Cobalt"
Cohesion: 0.18
Nodes (10): Build hint, Cobalt, Controls, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 83 - "Console"
Cohesion: 0.18
Nodes (10): Build hint, Console, Controls, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 84 - "Coral"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Coral, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 85 - "Darkroom"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Darkroom, Do-nots, Motion, Range, Surfaces, Tokens (+2 more)

### Community 86 - "Dose"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Dose, Motion, Range, Surfaces, Tokens (+2 more)

### Community 87 - "Dusk"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Dusk, Motion, Range, Surfaces, Tokens (+2 more)

### Community 88 - "Editorial"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Editorial, Motion, Range, Surfaces, Tokens (+2 more)

### Community 89 - "Formwork"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Formwork, Motion, Range, Surfaces, Tokens (+2 more)

### Community 90 - "Furrow"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Furrow, Motion, Range, Surfaces, Tokens (+2 more)

### Community 91 - "Garden"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Garden, Motion, Range, Surfaces, Tokens (+2 more)

### Community 92 - "Grid"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Grid, Motion, Range, Surfaces, Tokens (+2 more)

### Community 93 - "Halftone"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Halftone, Motion, Range, Surfaces, Tokens (+2 more)

### Community 94 - "Hedgerow"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Hedgerow, Motion, Range, Surfaces, Tokens (+2 more)

### Community 95 - "Hum"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Hum, Motion, Range, Surfaces, Tokens (+2 more)

### Community 96 - "Ink"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Ink, Motion, Range, Surfaces, Tokens (+2 more)

### Community 97 - "Kiln"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Kiln, Motion, Range, Surfaces, Tokens (+2 more)

### Community 98 - "Loom"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Loom, Motion, Range, Surfaces, Tokens (+2 more)

### Community 99 - "Lumen"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Lumen, Motion, Range, Surfaces, Tokens (+2 more)

### Community 100 - "Manifesto"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Manifesto, Motion, Range, Surfaces, Tokens (+2 more)

### Community 101 - "Midnight"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Midnight, Motion, Range, Surfaces, Tokens (+2 more)

### Community 102 - "Newsprint"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Newsprint, Range, Surfaces, Tokens (+2 more)

### Community 103 - "Overprint"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Overprint, Range, Surfaces, Tokens (+2 more)

### Community 104 - "Paste-up"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Paste-up, Range, Surfaces, Tokens (+2 more)

### Community 105 - "Piste"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Piste, Range, Surfaces, Tokens (+2 more)

### Community 106 - "Refract"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Refract, Surfaces, Tokens (+2 more)

### Community 107 - "Ribbon"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Ribbon, Surfaces, Tokens (+2 more)

### Community 108 - "Rim"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Rim, Surfaces, Tokens (+2 more)

### Community 109 - "Riso"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Riso, Surfaces, Tokens (+2 more)

### Community 110 - "Solstice"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Solstice, Surfaces, Tokens (+2 more)

### Community 111 - "Specimen"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Specimen, Surfaces, Tokens (+2 more)

### Community 112 - "Spore"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Spore, Surfaces, Tokens (+2 more)

### Community 113 - "Sport"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Sport, Surfaces, Tokens (+2 more)

### Community 114 - "Squeeze"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Squeeze, Surfaces, Tokens (+2 more)

### Community 115 - "Sticker"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Sticker, Surfaces, Tokens (+2 more)

### Community 116 - "Studio"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Studio, Surfaces, Tokens (+2 more)

### Community 117 - "Terminal"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Surfaces, Terminal, Tokens (+2 more)

### Community 118 - "Terrazzo"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Surfaces, Terrazzo, Tokens (+2 more)

### Community 119 - "Ultraviolet"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens, Type (+2 more)

### Community 120 - "Vantage"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens, Type (+2 more)

### Community 121 - "Vellum"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens, Type (+2 more)

### Community 122 - "Wayfind"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens, Type (+2 more)

### Community 123 - "Werkstatt"
Cohesion: 0.18
Nodes (10): Build hint, Controls, Do-nots, Motion, Range, Surfaces, Tokens, Type (+2 more)

### Community 124 - "AirPlay"
Cohesion: 0.20
Nodes (9): AirPlay, Best practices, Black AirPlay icon, Change log, Custom color AirPlay icon, Platform considerations, Referring to AirPlay, Using AirPlay icons (+1 more)

### Community 125 - "Alerts"
Cohesion: 0.20
Nodes (10): Alerts, Anatomy, Best practices, Buttons, Change log, Content, Desktop (macOS), Mobile (iOS, iPadOS) (+2 more)

### Community 126 - "App icons"
Cohesion: 0.20
Nodes (10): App icons, Appearances, Change log, Design, Icon shape, Layer design, Platform considerations, Related guidelines (+2 more)

### Community 127 - "Apple In-App Purchase"
Cohesion: 0.20
Nodes (10): Apple In-App Purchase, Auto-renewable subscriptions, Best practices, Change log, Helping people manage their subscriptions, Making signup effortless, Platform considerations, Providing help (+2 more)

### Community 128 - "Dark Mode"
Cohesion: 0.20
Nodes (10): Best practices, Change log, Dark Mode, Dark Mode colors, Desktop (macOS), Icons and images, Mobile (iOS, iPadOS), Platform considerations (+2 more)

### Community 129 - "Gestures"
Cohesion: 0.20
Nodes (10): Best practices, Change log, Custom gestures, Desktop (macOS), Gestures, Mobile (iOS, iPadOS), Platform considerations, Related guidelines (+2 more)

### Community 130 - "Toggles"
Cohesion: 0.20
Nodes (10): Best practices, Change log, Checkboxes, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Radio buttons, Related guidelines (+2 more)

### Community 131 - "Dark mode: parity, never inversion"
Cohesion: 0.20
Nodes (7): Dark discipline (the rules that change), Dark mode: parity, never inversion, Emission, The stance, Token re-derivation (per token, from the light value), Verification, 04 · Stat-Led

### Community 132 - "Imagery"
Cohesion: 0.20
Nodes (10): 1. What fills a page, 2. The library, 3. Slots, 4. The product: captured first, built only when it cannot be, 5. Placing and treating photographs, 6. Generated stills, 7. Never, 8. Icons, logos, video, 3D (+2 more)

### Community 133 - "Texture and print artifacts: a budgeted vocabulary"
Cohesion: 0.20
Nodes (9): 1 · Grain (paper), 2 · Halftone (dot field), 3 · Misregistration (chromatic echo), 4 · Scanline (CRT), 5 · Deckle (paper edge), Affinity: who earns texture, Reduced motion and accessibility, Texture and print artifacts: a budgeted vocabulary (+1 more)

### Community 134 - "install-hook.mjs"
Cohesion: 0.22
Nodes (6): args, HERE, hookEntry, ourHook(), settings, withoutOurs()

### Community 135 - "Accessibility"
Cohesion: 0.22
Nodes (9): Accessibility, Change log, Cognitive, Hearing, Mobility, Platform considerations, Related guidelines, Speech (+1 more)

### Community 136 - "Feedback"
Cohesion: 0.50
Nodes (4): Best practices, Feedback, Platform considerations, Related guidelines

### Community 137 - "App Shortcuts"
Cohesion: 0.22
Nodes (9): App Shortcuts, Best practices, Change log, Desktop (macOS), Editorial guidelines, Mobile (iOS, iPadOS), Platform considerations, Related guidelines (+1 more)

### Community 138 - "Layout"
Cohesion: 0.22
Nodes (9): Adaptability, Change log, Desktop (macOS), Guides and safe areas, Layout, Platform considerations, Related guidelines, Size classes (+1 more)

### Community 139 - "Lists and tables"
Cohesion: 0.22
Nodes (9): Best practices, Change log, Content, Desktop (macOS), Lists and tables, Mobile (iOS, iPadOS, visionOS), Platform considerations, Related guidelines (+1 more)

### Community 140 - "Maps"
Cohesion: 0.22
Nodes (9): Adding place cards outside of a map, Best practices, Change log, Custom information, Displaying place cards in a map, Indoor maps, Maps, Place cards (+1 more)

### Community 141 - "Notifications"
Cohesion: 0.22
Nodes (9): Anatomy, Badging, Best practices, Change log, Content, Notification actions, Notifications, Platform considerations (+1 more)

### Community 142 - "Settings"
Cohesion: 0.22
Nodes (9): Best practices, Change log, Desktop (macOS), General settings, Platform considerations, Related guidelines, Settings, System settings (+1 more)

### Community 143 - "Windows"
Cohesion: 0.22
Nodes (9): Best practices, Change log, Desktop (macOS), macOS window anatomy, macOS window states, Platform considerations, Related guidelines, Tablet (iPadOS) (+1 more)

### Community 144 - "Custom: a page of its own"
Cohesion: 0.22
Nodes (8): Before the first line of code, Custom: a page of its own, Mechanics, Pictures, Spent, What still binds, Words, Yours, all of it

### Community 145 - "Fonts"
Cohesion: 0.22
Nodes (8): Banned as a default, Body faces, Display faces the catalog does not use, Fonts, Loading, Sources, The rule, The wordmark

### Community 146 - "Layout"
Cohesion: 0.22
Nodes (9): 1. The canvas, 2. Sizes, 3. Rhythm between sections, 4. A section, 5. Compositions, 6. The hero, 7. The page, 8. Before shipping (+1 more)

### Community 147 - "Redesign"
Cohesion: 0.22
Nodes (8): After, Before, Build, Depth, Redesign, The ask, The plan, What a redesign keeps

### Community 148 - "Ponytail Help"
Cohesion: 0.22
Nodes (8): Band (Claude Code), Configure Default Mode, Deactivate, Levels, More, Ponytail Help, Skills, Update

### Community 149 - "Code audit"
Cohesion: 0.25
Nodes (7): Apple Pay and payment marks, Code audit, How to run it, iPhone Duo readiness in code, Liquid Glass in code, What replaces it, What to search for

### Community 150 - "Context menus"
Cohesion: 0.25
Nodes (8): Best practices, Change log, Content, Context menus, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Related guidelines

### Community 151 - "Designing for games"
Cohesion: 0.25
Nodes (8): Adopt Apple technologies, Change log, Designing for games, Enable intuitive interactions, Jump into gameplay, Look stunning on every display, Related guidelines, Welcome everyone

### Community 152 - "Drag and drop"
Cohesion: 0.25
Nodes (8): Accepting drops, Best practices, Change log, Desktop (macOS), Drag and drop, Mobile (iOS, iPadOS), Platform considerations, Providing feedback

### Community 153 - "Edit menus"
Cohesion: 0.25
Nodes (8): Best practices, Change log, Content, Desktop (macOS), Edit menus, Mobile (iOS, iPadOS), Platform considerations, Related guidelines

### Community 154 - "Materials"
Cohesion: 0.25
Nodes (8): Change log, Desktop (macOS), Liquid Glass, Materials, Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Standard materials

### Community 155 - "Multitasking"
Cohesion: 0.25
Nodes (8): Best practices, Change log, Desktop (macOS), Multitasking, Phone (iOS), Platform considerations, Related guidelines, Tablet (iPadOS)

### Community 156 - "Playing audio"
Cohesion: 0.25
Nodes (8): Best practices, Change log, Desktop (macOS), Handling interruptions, Mobile (iOS, iPadOS), Platform considerations, Playing audio, Related guidelines

### Community 157 - "Playing video"
Cohesion: 0.25
Nodes (8): Best practices, Change log, Exiting playback, Integrating with the TV app, Loading content, Platform considerations, Playing video, Related guidelines

### Community 158 - "Right to left"
Cohesion: 0.25
Nodes (8): Controls, Images, Interface icons, Numbers and characters, Platform considerations, Related guidelines, Right to left, Text alignment

### Community 159 - "Scroll views"
Cohesion: 0.25
Nodes (8): Best practices, Change log, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Scroll edge effects, Scroll views

### Community 160 - "Segmented controls"
Cohesion: 0.25
Nodes (8): Best practices, Change log, Content, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Segmented controls

### Community 161 - "Sheets"
Cohesion: 0.25
Nodes (8): Anatomy, Best practices, Change log, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Sheets

### Community 162 - "Siri"
Cohesion: 0.25
Nodes (8): Best practices, Change log, Customizing your app’s experience with Siri, Editorial guidelines, Getting your app to work with Siri, Related guidelines, Sharing contextual information, Siri

### Community 163 - "Split views"
Cohesion: 0.25
Nodes (8): Best practices, Change log, Desktop (macOS), Phone (iOS), Platform considerations, Related guidelines, Split views, Tablet (iPadOS)

### Community 164 - "Virtual keyboards"
Cohesion: 0.25
Nodes (8): Best practices, Change log, Custom input views, Custom keyboards, Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Virtual keyboards

### Community 165 - "interface"
Cohesion: 0.25
Nodes (7): dependencies, interface, default_prompts, display_name, short_description, policy, allow_implicit_invocation

### Community 166 - "Comp before build: composing in pixels before composing in CSS"
Cohesion: 0.25
Nodes (7): Comp before build: composing in pixels before composing in CSS, § Generated stills, § Reproduction discipline, § The approval point, § The call, § The medium inventory, § What the comp is, and is not

### Community 167 - "Boxes"
Cohesion: 0.29
Nodes (7): Best practices, Boxes, Content, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Related guidelines

### Community 168 - "Controls"
Cohesion: 0.29
Nodes (7): Anatomy, Best practices, Camera experiences on a locked device, Change log, Controls, Platform considerations, Related guidelines

### Community 169 - "Disclosure controls"
Cohesion: 0.29
Nodes (7): Best practices, Disclosure buttons, Disclosure controls, Disclosure triangles, Mobile (iOS, iPadOS, visionOS), Platform considerations, Related guidelines

### Community 170 - "Game controls"
Cohesion: 0.29
Nodes (7): Change log, Game controls, Keyboards, Physical controllers, Platform considerations, Related guidelines, Touch controls

### Community 171 - "Gauges"
Cohesion: 0.29
Nodes (7): Anatomy, Best practices, Change log, Desktop (macOS), Gauges, Platform considerations, Related guidelines

### Community 172 - "Going full screen"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Desktop (macOS), Going full screen, Mobile (iOS, iPadOS), Platform considerations, Related guidelines

### Community 173 - "Image views"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Content, Desktop (macOS), Image views, Platform considerations, Related guidelines

### Community 174 - "Keyboards"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Custom keyboard shortcuts, Keyboards, Platform considerations, Related guidelines, Standard keyboard shortcuts

### Community 175 - "Launching"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Launch screens, Launching, Mobile (iOS, iPadOS), Platform considerations, Related guidelines

### Community 176 - "Motion"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Leveraging platform capabilities, Motion, Platform considerations, Providing feedback, Related guidelines

### Community 177 - "Offering help"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Creating tips, Desktop (macOS, visionOS), Offering help, Platform considerations, Related guidelines

### Community 178 - "Onboarding"
Cohesion: 0.29
Nodes (7): Additional content, Additional requests, Best practices, Change log, Onboarding, Platform considerations, Related guidelines

### Community 179 - "Page controls"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Customizing indicators, Mobile (iOS, iPadOS), Page controls, Platform considerations, Related guidelines

### Community 180 - "Pickers"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Desktop (macOS), Mobile (iOS, iPadOS), Pickers, Platform considerations, Related guidelines

### Community 181 - "Progress indicators"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Progress indicators, Refresh content controls

### Community 182 - "Sidebars"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Sidebars

### Community 183 - "Sliders"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Sliders

### Community 184 - "Tab bars"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Phone (iOS), Platform considerations, Related guidelines, Tab bars, Tablet (iPadOS)

### Community 185 - "Tab views"
Cohesion: 0.29
Nodes (7): Anatomy, Best practices, Change log, Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Tab views

### Community 186 - "Text fields"
Cohesion: 0.29
Nodes (7): Best practices, Change log, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Text fields

### Community 187 - "Data viz: charts that read as set, not generated"
Cohesion: 0.29
Nodes (7): Colour, Construction (inline SVG written for the data, no chart library), Dark, Data viz: charts that read as set, not generated, Form first (before any drawing), Honesty (gate 46a binds here hardest), The dashboard bar

### Community 188 - "Writing a theme file"
Cohesion: 0.29
Nodes (6): Contradictions to avoid, The body, in order, 3,000 to 8,000 bytes, The header block, The picture, What a theme may not carry, Writing a theme file

### Community 189 - "tailwind-fail/Hero.tsx"
Cohesion: 0.33
Nodes (3): badge, Hero(), HeroProps

### Community 190 - "Charting data"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Charting data, Designing effective charts, Platform considerations, Related guidelines

### Community 191 - "Entering data"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Desktop (macOS), Entering data, Platform considerations, Related guidelines

### Community 192 - "Focus and selection"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Focus and selection, Platform considerations, Related guidelines, Tablet (iPadOS)

### Community 193 - "Images"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Formats, Images, Platform considerations, Resolution

### Community 194 - "Labels"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Desktop (macOS), Labels, Platform considerations, Related guidelines

### Community 195 - "Live-viewing apps"
Cohesion: 0.33
Nodes (6): Best practices, Cloud DVR, EPG experience, Live-viewing apps, Platform considerations, Related guidelines

### Community 196 - "Loading"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Loading, Platform considerations, Related guidelines, Showing progress

### Community 197 - "Managing accounts"
Cohesion: 0.33
Nodes (6): Best practices, Deleting accounts, Managing accounts, Platform considerations, Related guidelines, TV provider accounts

### Community 198 - "Managing notifications"
Cohesion: 0.33
Nodes (6): Best practices, Integrating with Focus, Managing notifications, Platform considerations, Related guidelines, Sending marketing notifications

### Community 199 - "Pop-up buttons"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Platform considerations, Pop-up buttons, Related guidelines, Tablet (iPadOS)

### Community 200 - "Popovers"
Cohesion: 0.33
Nodes (6): Best practices, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Popovers, Related guidelines

### Community 201 - "Pull-down buttons"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Mobile (iOS, iPadOS), Platform considerations, Pull-down buttons, Related guidelines

### Community 202 - "Searching"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Platform considerations, Related guidelines, Searching, Systemwide search

### Community 203 - "Snippets"
Cohesion: 0.33
Nodes (6): Anatomy, Best practices, Change log, Platform considerations, Related guidelines, Snippets

### Community 204 - "Text views"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Text views

### Community 205 - "Undo and redo"
Cohesion: 0.33
Nodes (6): Best practices, Desktop (macOS), Mobile (iOS, iPadOS), Platform considerations, Related guidelines, Undo and redo

### Community 206 - "VoiceOver"
Cohesion: 0.33
Nodes (6): Change log, Descriptions, Navigation, Platform considerations, Related guidelines, VoiceOver

### Community 207 - "Writing"
Cohesion: 0.33
Nodes (6): Best practices, Change log, Getting started, Platform considerations, Related guidelines, Writing

### Community 208 - "Genre: atmospheric"
Cohesion: 0.33
Nodes (5): Allowed here, Chrome that fits, Genre: atmospheric, Refused here, Voice

### Community 209 - "Genre: editorial (the default)"
Cohesion: 0.33
Nodes (5): Allowed here, Chrome that fits, Genre: editorial (the default), Refused here, Voice

### Community 210 - "Genre: modern-minimal"
Cohesion: 0.33
Nodes (5): Allowed here, Chrome that fits, Genre: modern-minimal, Refused here, Voice

### Community 211 - "Genre: playful"
Cohesion: 0.33
Nodes (5): Allowed here, Chrome that fits, Genre: playful, Refused here, Voice

### Community 212 - "Macrostructures"
Cohesion: 0.33
Nodes (6): Domain to trio, when the prompt names no shape, How to pick, Macrostructures, SaaS section deck: deal it, do not sequence it, The 21 macrostructures, index, The fingerprint: six axes

### Community 213 - "clsLits"
Cohesion: 0.24
Nodes (16): braceEnd(), classCalls(), clsLits(), cutGlued(), jsxPseudo(), el(), js(), jsScan() (+8 more)

### Community 214 - "Supermarket Tycoon"
Cohesion: 0.20
Nodes (9): Arquitectura, Capa visual, Ejecutar, Guardado (versión 2), Guía de inicio, Mecánicas principales, Quiebra y fin de partida, Stack (+1 more)

### Community 215 - "Action sheets"
Cohesion: 0.40
Nodes (5): Action sheets, Best practices, Mobile (iOS, iPadOS), Platform considerations, Related guidelines

### Community 216 - "Activity views"
Cohesion: 0.18
Nodes (10): Activity views, Best practices, Platform considerations, Related guidelines, Share and action extensions, Best practices, Change log, Modality (+2 more)

### Community 217 - "Branding"
Cohesion: 0.40
Nodes (5): Best practices, Branding, Change log, Platform considerations, Related guidelines

### Community 218 - "sheets.md"
Cohesion: 0.15
Nodes (10): Best practices, Change log, Collaboration and sharing, Platform considerations, Related guidelines, Best practices, HUD-style panels, Panels (+2 more)

### Community 219 - "Collections"
Cohesion: 0.40
Nodes (5): Best practices, Collections, Mobile (iOS, iPadOS), Platform considerations, Related guidelines

### Community 220 - "Color wells"
Cohesion: 0.40
Nodes (5): Best practices, Color wells, Desktop (macOS), Platform considerations, Related guidelines

### Community 221 - "iCloud"
Cohesion: 0.40
Nodes (4): Best practices, Change log, iCloud, Platform considerations

### Community 222 - "Home Screen quick actions"
Cohesion: 0.50
Nodes (4): Best practices, Home Screen quick actions, Platform considerations, Related guidelines

### Community 225 - "Printing"
Cohesion: 0.40
Nodes (5): Best practices, Desktop (macOS), Platform considerations, Printing, Related guidelines

### Community 226 - "Steppers"
Cohesion: 0.40
Nodes (5): Best practices, Desktop (macOS), Platform considerations, Related guidelines, Steppers

### Community 228 - "design.md: the locked system"
Cohesion: 0.40
Nodes (4): After the file exists, design.md: the locked system, Format, Triggers

### Community 229 - "Microinteractions"
Cohesion: 0.40
Nodes (4): Microinteractions, Motion character, Principles, Recipes

### Community 230 - "ponytail-audit/SKILL.md"
Cohesion: 0.40
Nodes (4): 1. Map first, 2. Look for, 3. Check before you report, 4. Output

### Community 231 - "Ponytail Gain"
Cohesion: 0.40
Nodes (4): Boundaries, Honesty boundary, Ponytail Gain, Scoreboard

### Community 232 - "ponytail-review/SKILL.md"
Cohesion: 0.40
Nodes (4): 1. Understand first, 2. Look for, 3. Check before you report, 4. Output

### Community 233 - "Ponytail"
Cohesion: 0.40
Nodes (4): Before you write, Levels, Ponytail, The smallest complete change

### Community 234 - "Cross-platform translation"
Cohesion: 0.50
Nodes (3): Conventions to check, Cross-platform translation, Vocabulary

### Community 235 - "designing-for-games.md"
Cohesion: 0.12
Nodes (10): Best practices, Designing for iOS, Best practices, Designing for iPadOS, Best practices, Designing for macOS, Best practices, Gyroscope and accelerometer (+2 more)

### Community 236 - "state.ts"
Cohesion: 0.07
Nodes (36): Speed, Role, Bill, BillCategory, BillStatus, Loan, Transaction, TxKind (+28 more)

### Community 237 - "solvency.ts"
Cohesion: 0.22
Nodes (12): BANKRUPTCY_DEBT_DAYS, BANKRUPTCY_OVERDUE_BILLS, bankruptcyReason(), countOverdueBills(), DEBT_WARNING_DAYS, gameOverMessage(), GameOverReason, isBelowOverdraft() (+4 more)

### Community 238 - "Web views"
Cohesion: 0.50
Nodes (3): Best practices, Platform considerations, Web views

### Community 239 - "ponytail-debt/SKILL.md"
Cohesion: 0.50
Nodes (3): Boundaries, Output, Scan

### Community 244 - "saveRepo.ts"
Cohesion: 0.18
Nodes (12): CURRENT_SAVE_VERSION, equipmentSchema, hourSnapshotSchema, loadGame(), migrate(), placementSchema, productSchema, saveGame() (+4 more)

### Community 246 - "NFC"
Cohesion: 0.21
Nodes (7): Background tag reading, In-app tag reading, NFC, Platform considerations, Best practices, Platform considerations, Status bars

### Community 255 - "lists-and-tables.md"
Cohesion: 0.18
Nodes (8): Best practices, Column views, Platform considerations, Related guidelines, Best practices, Outline views, Platform considerations, Related guidelines

## Knowledge Gaps
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `clamp()` connect `Responsive` to `SimCtx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `sloplint.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.03110047846889952 - nodes in this community are weakly interconnected._
- **Should `pull-hig.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.06603346901854365 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11073059360730593 - nodes in this community are weakly interconnected._
- **Should `SimCtx` be split into smaller, more focused modules?**
  _Cohesion score 0.10128205128205128 - nodes in this community are weakly interconnected._
- **Should `refcheck.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.03636363636363636 - nodes in this community are weakly interconnected._
- **Should `theme.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0889894419306184 - nodes in this community are weakly interconnected._