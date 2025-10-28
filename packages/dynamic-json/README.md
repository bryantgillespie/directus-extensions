# Dynamic JSON Bundle

A powerful extension bundle for viewing and copying dynamic JSON data in Directus with an unknown schema, such as form submissions or API responses.

This bundle includes:
- **Interface**: Full-featured JSON editor view with dual view modes and copy functionality
- **Display**: Compact badge for collection tables with modal viewer

## Features

- **Dual View Modes**: Switch between formatted (human-readable) and tree (code-style) views
- **Copy to Clipboard**: Hover-activated copy buttons for all values (primitives, objects, and arrays)
- **Smart Formatting**:
  - Dates automatically formatted
  - Booleans displayed as Yes/No
  - URLs and emails as clickable links
- **Expand/Collapse All**: Quick controls for managing nested data
- **Keyboard Shortcuts**: Navigate and interact efficiently
- **Persistent View Preference**: Your view mode choice is saved per field
- **Customizable Colors**: Configure syntax highlighting for different value types in tree view
- **Configurable Max Height**: Control the display height with scrolling
- **Sticky Headers**: Section headers stay visible while scrolling

## Extensions

### Interface Extension

Use the Dynamic JSON Interface when configuring fields in your collections. The interface presents JSON data in two distinct views:

### Formatted View
A clean, accordion-based layout perfect for reading form submissions or structured data:
- Root-level primitives displayed in a 2-column grid
- Nested objects shown as collapsible sections
- Smart formatting for dates, booleans, links
- Copy buttons appear on hover for each field and section

### Tree View
A code-style hierarchical view ideal for technical inspection:
- Expandable/collapsible tree structure
- Syntax highlighting for different value types
- Arrow key navigation support
- Copy buttons on all nodes

### Display Extension

Use the Dynamic JSON Display when configuring how JSON fields appear in collection tables and layouts:
- **Compact Badge**: Shows icon + item count (e.g., "12 items" or "5 properties")
- **Click to View**: Opens modal dialog for full inspection
- **Modal Viewer**: Same dual view modes and features as interface
- **All Features Available**: View toggle, expand/collapse, copy functionality, color customization

The display is perfect for:
- Quickly scanning JSON data in table views
- Maintaining compact table layouts while providing full inspection capability
- Consistent experience between item detail and list views
- Quick access to full JSON viewer without leaving the current page

## Installation

Follow the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for installing extensions from the Marketplace or manually.

## Configuration Options

Both the interface and display extensions share the same configuration options:

### Default View
- **Formatted**: Human-readable layout with accordions
- **Tree**: Code-style hierarchical view

### Initial Tree Expansion Depth
- Controls how many levels deep the tree view expands by default
- Default: 2

### Max Height
- Set maximum display height in pixels
- Options: No limit, 400px, 600px, 800px, 1000px, or custom
- Default: 600px
- Enables scrolling for large datasets

### Color Customization
- **Key Color**: Color for field keys and section headers in both views (default: theme primary/accent)
- **String Color**: Color for text values in tree view (default: #22863a)
- **Number Color**: Color for numeric values in tree view (default: #005cc5)
- **Boolean Color**: Color for true/false values in tree view (default: #6f42c1)
- **Null Color**: Color for null values in tree view (default: theme subdued)

## Keyboard Shortcuts

### Navigation (Tree View)
- **Tab**: Move between controls
- **↑/↓**: Navigate items
- **←/→**: Collapse/Expand items

### Actions
- **Space** or **Enter**: Toggle expand/collapse

## Copy Functionality

All values can be copied to clipboard:
- **Primitives**: Copies raw value (not formatted)
- **Objects/Arrays**: Copies as formatted JSON with indentation
- Hover over any value to reveal copy button
- "Copied!" confirmation appears briefly

## Example Use Cases

### Form Submissions
```json
{
    "contact_info": {
        "name": "John Doe",
        "email": "john@example.com",
        "submitted_at": "2025-01-15T10:30:00Z"
    },
    "answers": {
        "question_1": "Yes",
        "question_2": "Prefer not to answer"
    }
}
```

### API Responses
```json
{
    "metadata": {
        "source": "api.example.com",
        "timestamp": "2025-01-15T10:30:00Z"
    },
    "data": [
        {"id": 1, "value": "Item 1"},
        {"id": 2, "value": "Item 2"}
    ]
}
```

## Field Type

Both extensions are designed for **JSON** field types only.

## Tips

- **Use the Interface** for item detail pages and editing contexts
- **Use the Display** for table/list views to maintain compact layouts
- Use Formatted View for business users reviewing form submissions
- Use Tree View for developers debugging API data
- Set appropriate max height for forms with variable-length JSON
- Customize tree colors to match your brand or improve readability
- Copy entire sections (objects/arrays) for quick data extraction
- The badge in the display shows at-a-glance info without opening the modal
