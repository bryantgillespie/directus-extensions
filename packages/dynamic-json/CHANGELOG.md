# Changelog

## [0.1.0] - 2025-10-27

Initial release - Extension bundle for viewing/copying dynamic JSON data in Directus.

### Features

**Bundle**
- Interface + Display extensions with shared components
- Partial bundle support (extensions can be disabled individually)

**Views**
- Formatted view: 2-column grid for primitives, collapsible accordions for nested objects
- Tree view: Hierarchical structure with syntax highlighting, arrow key navigation
- Toggle between views with persistent preference per field
- Expand/collapse all controls
- Configurable max height with scrolling

**Copy Functionality**
- Hover-activated copy buttons on all values
- Primitives copy raw values, objects/arrays copy formatted JSON
- Zero-layout-shift notifications

**Smart Formatting**
- Dates auto-formatted
- Booleans as Yes/No
- Clickable URLs and emails

**Display Extension**
- Compact badge showing item count
- Click to open modal viewer with full features

**Customization**
- Syntax highlighting colors
- Initial tree expansion depth
- Max height options
- Key color for both views

**Technical**
- Vue 3, TypeScript, Directus Extensions SDK 16.0.2, Reka UI 2.6.0
