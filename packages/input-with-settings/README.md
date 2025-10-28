# Input with Settings

Text input with a settings menu for configurable metadata. Perfect for content that needs occasional adjustments without cluttering your form with extra fields.

![Input with Settings Example](https://raw.githubusercontent.com/bryantgillespie/directus-extensions/main/packages/input-with-settings/docs/custom-input-example.png)

![Stored JSON Value](https://raw.githubusercontent.com/bryantgillespie/directus-extensions/main/packages/input-with-settings/docs/custom-input-raw-value.png)

## Use Case

Designed for situations where you have text content that occasionally needs metadata or configuration options, but you don't want separate fields always visible. The primary use case is headings:

**Traditional approach (3 separate fields):**
- Heading Text (string field)
- Heading Level (dropdown: H1, H2, H3...)
- Heading Size (dropdown: Small, Medium, Large...)

**With this extension (1 field):**
- Heading with settings icon → Click to adjust level/size when needed
- Stores text + settings together as JSON: `{ "content": "My Heading", "level": "h2", "size": "large" }`

## Trade-offs

**Pros:**
- Cleaner, less cluttered forms
- Only show settings when you need to adjust from defaults
- Related data stays together
- Flexible - configure any settings you need

**Cons:**
- **Not searchable in Directus**: Content stored as JSON isn't filterable or searchable
- Slightly more complex to filter/sort in collections
- Not ideal for fields that need frequent searching

**Best for:** Headings, banners, callouts, or any content within a page builder scenario where search/filter isn't critical
**Avoid for:** Titles, names, or fields users will search frequently

## Installation

Install from [Directus Marketplace](https://marketplace.directus.io) or [manually](https://docs.directus.io/extensions/installing-extensions.html).

## Configuration

### Field Setup

1. Create a **JSON** field in your collection
2. Select **Input with Settings** as the interface

### Interface Options

#### Placeholder
Placeholder text for the main input field.

**Example:** `"Enter heading text"`

#### Content Key
The JSON key used to store the main input value. Default: `content`

**Example:** If set to `"text"`, your JSON becomes `{ "text": "My Heading", ... }`

#### Settings Tooltip
Tooltip text shown when hovering the settings icon.

**Example:** `"Configure heading options"`

#### Settings Options
Array of setting configurations. Each setting has:

**Option Structure:**
```json
{
  "key": "level",           // JSON key for this setting
  "label": "Heading Level", // Display label in menu
  "icon": "format_size",    // Optional icon
  "defaultValue": "h2",     // Default choice
  "choices": [              // Available options
    { "value": "h1", "text": "H1", "icon": "looks_one" },
    { "value": "h2", "text": "H2", "icon": "looks_two" },
    { "value": "h3", "text": "H3", "icon": "looks_3" }
  ]
}
```

## Example Configurations

### Heading with Level and Size

**Settings Options:**
```json
[
  {
    "key": "level",
    "label": "Heading Level",
    "icon": "format_size",
    "defaultValue": "h2",
    "choices": [
      { "value": "h1", "text": "H1", "icon": "looks_one" },
      { "value": "h2", "text": "H2", "icon": "looks_two" },
      { "value": "h3", "text": "H3", "icon": "looks_3" },
      { "value": "h4", "text": "H4", "icon": "looks_4" }
    ]
  },
  {
    "key": "size",
    "label": "Size",
    "icon": "format_size",
    "defaultValue": "medium",
    "choices": [
      { "value": "small", "text": "Small" },
      { "value": "medium", "text": "Medium" },
      { "value": "large", "text": "Large" },
      { "value": "xlarge", "text": "Extra Large" }
    ]
  }
]
```

**Stored Data:**
```json
{
  "content": "Welcome to Our Site",
  "level": "h1",
  "size": "large"
}
```

### Button Text with Style and Icon

**Settings Options:**
```json
[
  {
    "key": "style",
    "label": "Button Style",
    "defaultValue": "primary",
    "choices": [
      { "value": "primary", "text": "Primary" },
      { "value": "secondary", "text": "Secondary" },
      { "value": "outline", "text": "Outline" }
    ]
  },
  {
    "key": "showIcon",
    "label": "Show Icon",
    "defaultValue": "false",
    "choices": [
      { "value": "true", "text": "Yes" },
      { "value": "false", "text": "No" }
    ]
  }
]
```

### Banner Text with Alignment and Color

**Settings Options:**
```json
[
  {
    "key": "align",
    "label": "Text Alignment",
    "icon": "format_align_left",
    "defaultValue": "center",
    "choices": [
      { "value": "left", "text": "Left", "icon": "format_align_left" },
      { "value": "center", "text": "Center", "icon": "format_align_center" },
      { "value": "right", "text": "Right", "icon": "format_align_right" }
    ]
  },
  {
    "key": "color",
    "label": "Color Scheme",
    "defaultValue": "default",
    "choices": [
      { "value": "default", "text": "Default" },
      { "value": "accent", "text": "Accent" },
      { "value": "warning", "text": "Warning" },
      { "value": "success", "text": "Success" }
    ]
  }
]
```

## Usage in Code

When consuming the data in your frontend:

```js
// Stored value
{
  "content": "Our Amazing Feature",
  "level": "h2",
  "size": "large"
}

// In your template
const heading = item.heading_field;
const tag = heading.level || 'h2';
const sizeClass = `text-${heading.size}`;

// Render
<component :is="tag" :class="sizeClass">
  {{ heading.content }}
</component>
```

## Tips

- Use descriptive icons for better UX
- Set sensible defaults - most users won't change them
- Limit choices to 4-6 options to avoid overwhelming users
- Group related fields (level + size, alignment + color, etc.)
- Consider if search/filter is needed before using this interface
