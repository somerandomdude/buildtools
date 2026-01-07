# build-tools

A collection of utilities for building static websites. Includes functions for file management, markdown processing, image optimization, RSS feed generation, and templating.


## Requirements

- Node.js 18+ (ES modules)
- Dependencies are installed automatically: `feed`, `front-matter`, `glob`, `marked`, `marked-custom-heading-id`, `marked-smartypants`, `sharp`

## Usage

```javascript
import {
  getFilesByType,
  setupDist,
  compileMarkdown,
  buildFromTemplate,
  writeRSS,
  writeImages,
} from 'build-tools';
```

## API Reference

### Constants

#### `SRC_PATH`
Default source directory path: `"./src"`

#### `DIST_PATH`
Default distribution directory path: `"./dist"`

---

### File Operations

#### `getFilesByType(dir, ext, [fileList])`

Recursively searches a directory for files with a specific extension.

| Parameter | Type | Description |
|-----------|------|-------------|
| `dir` | `string` | The directory path to search in |
| `ext` | `string` | The file extension to filter by (e.g., `.md`, `.html`) |
| `fileList` | `string[]` | Optional. Accumulator array for recursive calls |

**Returns:** `string[]` - Array of file paths matching the extension

```javascript
const mdFiles = getFilesByType('./content', '.md');
// Returns: ['./content/post1.md', './content/blog/post2.md']
```

---

#### `findJsTsFiles(dir, [fileList])` *(deprecated)*

Recursively searches a directory for JavaScript and TypeScript files.

> **Deprecated:** Use `getFilesByType(dir, '.js')` or `getFilesByType(dir, '.ts')` instead.

| Parameter | Type | Description |
|-----------|------|-------------|
| `dir` | `string` | The directory path to search in |
| `fileList` | `string[]` | Optional. Accumulator array for recursive calls |

**Returns:** `string[]` - Array of file paths ending with `.js` or `.ts`

---

#### `setupDist([paths])`

Initializes the distribution directory by removing any existing dist folder and creating a fresh one with optional subdirectories.

| Parameter | Type | Description |
|-----------|------|-------------|
| `paths` | `string[]` | Optional. Array of subdirectory names to create inside dist |

```javascript
setupDist(['css', 'js', 'images']);
// Creates: ./dist/, ./dist/css/, ./dist/js/, ./dist/images/
```

---

#### `copyFiles(files, [destination])`

Copies an array of files to a destination directory, preserving relative paths by swapping the root directory.

| Parameter | Type | Description |
|-----------|------|-------------|
| `files` | `string[]` | Array of file paths to copy |
| `destination` | `string` | Optional. Destination directory (default: `DIST_PATH`) |

```javascript
copyFiles(['./src/style.css', './src/app.js'], './dist');
// Copies to: ./dist/style.css, ./dist/app.js
```

---

#### `copyAllFiles(src, dest, [filter])`

Recursively copies all files and directories from source to destination with an optional filter function.

| Parameter | Type | Description |
|-----------|------|-------------|
| `src` | `string` | Source directory path |
| `dest` | `string` | Destination directory path |
| `filter` | `Function` | Optional. Filter function `(src) => boolean` |

```javascript
// Copy all files except .map files
copyAllFiles('./src', './dist', (src) => !src.endsWith('.map'));
```

---

#### `mirrorDirectory([src], [dest])`

Recursively creates a directory tree at the destination that mirrors the source directory structure. Only creates directories, does not copy files.

| Parameter | Type | Description |
|-----------|------|-------------|
| `src` | `string` | Optional. Source directory path (default: `SRC_PATH`) |
| `dest` | `string` | Optional. Destination directory path (default: `DIST_PATH`) |

```javascript
mirrorDirectory('./src', './dist');
// Creates ./dist with the same folder structure as ./src
```

---

#### `swapRootDir(originalPath, newRootFolder)`

Replaces the root directory of a file path with a new root folder.

| Parameter | Type | Description |
|-----------|------|-------------|
| `originalPath` | `string` | The original file path |
| `newRootFolder` | `string` | The new root folder name |

**Returns:** `string` - Path with root directory swapped

```javascript
swapRootDir('./src/css/style.css', './dist');
// Returns: './dist/css/style.css'
```

---

### Markdown Processing

#### `compileMarkdown(markdown, [opts])`

Parses a markdown file with YAML front matter and converts it to HTML. Uses `marked` with smartypants and custom heading ID plugins.

| Parameter | Type | Description |
|-----------|------|-------------|
| `markdown` | `string` | Raw markdown string including front matter |
| `opts` | `Object` | Optional configuration |
| `opts.url` | `string` | Full URL for the entry |
| `opts.uri` | `string` | URI path for the entry |
| `opts.nextEntry` | `string` | Reference to next entry in a series |

**Returns:** `Object` - Entry object with properties:
- `attributes` - Parsed front matter attributes
- `body` - Raw markdown body
- `title` - Title from front matter
- `date` - Parsed Date object
- `description` - Description from front matter
- `lastmod` - Last modified date
- `hero` - Hero image path
- `hero_alt` - Hero image alt text
- `content` - Rendered HTML content
- `dateUTC` - Last modified or original date as Date
- `url`, `uri`, `nextEntry` - Values from opts

```javascript
const md = `---
title: My Post
date: 2024-01-15
description: A sample post
---
# Hello World

This is my content.`;

const entry = compileMarkdown(md, { url: 'https://example.com/post' });
console.log(entry.title);   // 'My Post'
console.log(entry.content); // '<h1>Hello World</h1>\n<p>This is my content.</p>'
```

---

### Templating

#### `buildFromTemplate(template, replacements)`

Replaces placeholders in a template string with provided values.

| Parameter | Type | Description |
|-----------|------|-------------|
| `template` | `string` | Template string containing placeholders |
| `replacements` | `Object[]` | Array of replacement objects |
| `replacements[].key` | `string` | Placeholder pattern (used as regex) |
| `replacements[].value` | `string` | Replacement value |

**Returns:** `string` - Template with placeholders replaced

```javascript
const template = '<h1>{{TITLE}}</h1><p>{{CONTENT}}</p>';
const result = buildFromTemplate(template, [
  { key: '{{TITLE}}', value: 'Hello' },
  { key: '{{CONTENT}}', value: 'World' }
]);
// Returns: '<h1>Hello</h1><p>World</p>'
```

---

#### `extractTextByRegex(htmlString, tagName)`

Extracts text content from within a specified HTML tag.

| Parameter | Type | Description |
|-----------|------|-------------|
| `htmlString` | `string` | HTML string to search |
| `tagName` | `string` | HTML tag name to extract from |

**Returns:** `string | null` - Text inside the tag, or null if not found

```javascript
const html = '<h1>Hello World</h1><p>Content</p>';
extractTextByRegex(html, 'h1');
// Returns: 'Hello World'
```

---

### Network

#### `fetchCSS(url)`

Fetches CSS content from a remote URL.

| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | `string` | URL to fetch CSS from |

**Returns:** `Promise<string | null>` - CSS text content, or null on failure

```javascript
const css = await fetchCSS('https://cdn.example.com/styles.css');
```

---

### RSS Feed

#### `writeRSS(rssData, entries, [writePath])`

Generates and writes an RSS 2.0 feed file.

| Parameter | Type | Description |
|-----------|------|-------------|
| `rssData` | `Object` | Feed configuration |
| `rssData.title` | `string` | Feed title |
| `rssData.siteUrl` | `string` | Base URL of the website |
| `rssData.authorName` | `string` | Author name |
| `rssData.authorEmail` | `string` | Author email |
| `rssData.authorSite` | `string` | Author website URL |
| `rssData.category` | `string` | Feed category |
| `entries` | `Object[]` | Array of entry objects |
| `entries[].title` | `string` | Entry title |
| `entries[].url` | `string` | Entry URL |
| `entries[].description` | `string` | Optional. Entry description |
| `entries[].content` | `string` | Optional. Full content (fallback if no description) |
| `entries[].date` | `Date` | Publication date |
| `writePath` | `string` | Optional. Output path (default: `DIST_PATH/rss.xml`) |

```javascript
writeRSS(
  {
    title: 'My Blog',
    siteUrl: 'https://example.com',
    authorName: 'John Doe',
    authorEmail: 'john@example.com',
    authorSite: 'https://johndoe.com',
    category: 'Technology'
  },
  [
    { title: 'First Post', url: 'https://example.com/post1', date: new Date() }
  ],
  './dist/feed.xml'
);
```

---

### Image Processing

#### `resizeJpg(path, output, size)`

Resizes a JPEG or GIF image to a specified width while maintaining aspect ratio.

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Source image path |
| `output` | `string` | Output path for resized image |
| `size` | `number` | Target width in pixels |

**Returns:** `Promise<string>` - Output path on success

```javascript
await resizeJpg('./src/image.jpg', './dist/image.jpg', 800);
```

---

#### `resizePng(path, output, size)`

Resizes a PNG image to a specified width while maintaining aspect ratio.

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | `string` | Source PNG path |
| `output` | `string` | Output path for resized image |
| `size` | `number` | Target width in pixels |

**Returns:** `Promise<string>` - Output path on success

```javascript
await resizePng('./src/image.png', './dist/image.png', 800);
```

---

#### `writeImages([contentDir], [distDir])`

Processes and copies all images and videos from source to destination. JPG/GIF images are resized (max 2000px width), PNG images are optimized, SVG and MP4 files are copied as-is.

| Parameter | Type | Description |
|-----------|------|-------------|
| `contentDir` | `string` | Optional. Source directory (default: `SRC_PATH`) |
| `distDir` | `string` | Optional. Destination directory (default: `DIST_PATH`) |

**Returns:** `Promise<void>`

```javascript
await writeImages('./src/content', './dist/content');
```

---

### Bluesky Integration

#### `sendBlueskyPost(text, [url])`

Sends a post to Bluesky with optional URL attachment. If a URL is provided and not already in the text, it will be appended. URLs are automatically converted to clickable links using Bluesky facets.

Requires `BLUESKY_USERNAME` and `BLUESKY_PASSWORD` environment variables to be set.

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | The text content of the post |
| `url` | `string` | Optional. URL to include in the post as a clickable link |

**Returns:** `Promise<Object>` - The response from the Bluesky API containing the post URI

```javascript
// Post without URL
await sendBlueskyPost('Hello from my build tool!');

// Post with URL
await sendBlueskyPost('Check out my new blog post!', 'https://example.com/post');
```

---

#### `postLatestToBluesky()`

Reads the latest post from the RSS feed and posts it to Bluesky if not already posted. This function performs the following steps:

1. Reads the RSS feed from `./dist/rss.xml`
2. Extracts the latest post's title and link
3. Checks if the link has already been posted to Bluesky (searches up to 100 previous posts)
4. If not already posted, creates a new Bluesky post with the title and link

Requires `BLUESKY_USERNAME` and `BLUESKY_PASSWORD` environment variables to be set.

**Returns:** `Promise<void>`

```javascript
// Typically called after generating/updating the RSS feed
await postLatestToBluesky();
```

---

## License

GPL-3.0-only
