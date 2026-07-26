# Project Directives for RPGSA

## Componentization First Directive
Whenever adding new features, modifying UI, or refactoring code in this repository:
1. **Prioritize Componentization**: Split UI and logic into small, modular, single-responsibility components and custom hooks.
2. **Avoid Monolithic Files**: Keep component files concise and readable (target < 150-200 lines). Extract sub-sections into sub-components.
3. **Thin Pages**: Keep page components in `src/pages/` or `src/app/` strictly as composition layers.
4. **Custom Hooks**: Extract complex state management, Zustand selectors, Web Audio context logic, or PeerJS handlers into dedicated hooks in `src/hooks/`.
5. **Strict Typing**: Define explicit TypeScript interfaces for all component props.
