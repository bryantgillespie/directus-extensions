# Dynamic JSON Bundle

View and copy dynamic JSON data in Directus with unknown schemas (form submissions, API responses, etc).

![Formatted View Example](https://raw.githubusercontent.com/bryantgillespie/directus-extensions/main/packages/dynamic-json/docs/dynamic-json-formatted-view.png)

![Tree View Example](https://raw.githubusercontent.com/bryantgillespie/directus-extensions/main/packages/dynamic-json/docs/dynamic-tree-view.png)

**Interface**: Full-featured editor with dual view modes
**Display**: Compact badge for tables with modal viewer

## Features

- **Dual Views**: Formatted (human-readable) and Tree (code-style)
- **Copy to Clipboard**: Hover-activated buttons for any value
- **Smart Formatting**: Dates, booleans, URLs auto-formatted
- **Expand/Collapse**: Quick controls + keyboard navigation
- **Customizable**: Colors, max height, initial depth
- **Persistent**: View preference saved per field

## Installation

Install from [Directus Marketplace](https://marketplace.directus.io) or [manually](https://docs.directus.io/extensions/installing-extensions.html).

## Configuration

**Default View**: Formatted or Tree
**Tree Depth**: Initial expansion levels (default: 2)
**Max Height**: Scrollable height in px (default: 600px)
**Colors**: Customize syntax highlighting (keys, strings, numbers, booleans, nulls)

## Keyboard Shortcuts

**↑/↓**: Navigate | **←/→**: Collapse/Expand | **Space/Enter**: Toggle

## Use Cases

- Form submissions with unknown fields
- API responses with nested data
- Dynamic configuration objects
- User-generated JSON content
