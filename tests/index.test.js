import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import {
  SRC_PATH,
  DIST_PATH,
  getFilesByType,
  findJsTsFiles,
  setupDist,
  copyFiles,
  copyAllFiles,
  compileMarkdown,
  buildFromTemplate,
  fetchCSS,
  writeRSS,
  resizeJpg,
  resizePng,
  writeImages,
  extractTextByRegex,
  mirrorDirectory,
  swapRootDir,
} from "../index.js";

// Test directory paths
const TEST_DIR = "./test-fixtures";
const TEST_DIST = "./test-dist";

describe("Constants", () => {
  it("should export SRC_PATH as './src'", () => {
    expect(SRC_PATH).toBe("./src");
  });

  it("should export DIST_PATH as './dist'", () => {
    expect(DIST_PATH).toBe("./dist");
  });
});

describe("getFilesByType", () => {
  beforeEach(() => {
    // Create test directory structure
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.mkdirSync(path.join(TEST_DIR, "subdir"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "file1.md"), "# Test");
    fs.writeFileSync(path.join(TEST_DIR, "file2.md"), "# Test 2");
    fs.writeFileSync(path.join(TEST_DIR, "file.txt"), "text");
    fs.writeFileSync(path.join(TEST_DIR, "subdir", "nested.md"), "# Nested");
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("should find files with the specified extension", () => {
    const files = getFilesByType(TEST_DIR, ".md");
    expect(files).toHaveLength(3);
    expect(files.some((f) => f.includes("file1.md"))).toBe(true);
    expect(files.some((f) => f.includes("file2.md"))).toBe(true);
    expect(files.some((f) => f.includes("nested.md"))).toBe(true);
  });

  it("should not include files with different extensions", () => {
    const files = getFilesByType(TEST_DIR, ".md");
    expect(files.some((f) => f.includes("file.txt"))).toBe(false);
  });

  it("should return empty array when no files match", () => {
    const files = getFilesByType(TEST_DIR, ".xyz");
    expect(files).toHaveLength(0);
  });

  it("should search recursively through subdirectories", () => {
    const files = getFilesByType(TEST_DIR, ".md");
    expect(files.some((f) => f.includes("subdir"))).toBe(true);
  });

  // Error checking tests
  it("should throw error when dir is not a string", () => {
    expect(() => getFilesByType(null, ".md")).toThrow(
      "'dir' must be a non-empty string",
    );
    expect(() => getFilesByType(123, ".md")).toThrow(
      "'dir' must be a non-empty string",
    );
    expect(() => getFilesByType(undefined, ".md")).toThrow(
      "'dir' must be a non-empty string",
    );
  });

  it("should throw error when dir is an empty string", () => {
    expect(() => getFilesByType("", ".md")).toThrow(
      "'dir' must be a non-empty string",
    );
    expect(() => getFilesByType("   ", ".md")).toThrow(
      "'dir' must be a non-empty string",
    );
  });

  it("should throw error when ext is not a string", () => {
    expect(() => getFilesByType(TEST_DIR, null)).toThrow(
      "'ext' must be a non-empty string",
    );
    expect(() => getFilesByType(TEST_DIR, 123)).toThrow(
      "'ext' must be a non-empty string",
    );
  });

  it("should throw error when ext is an empty string", () => {
    expect(() => getFilesByType(TEST_DIR, "")).toThrow(
      "'ext' must be a non-empty string",
    );
  });

  it("should throw error when directory does not exist", () => {
    expect(() => getFilesByType("./nonexistent-dir", ".md")).toThrow(
      "does not exist",
    );
  });

  it("should throw error when path is not a directory", () => {
    expect(() =>
      getFilesByType(path.join(TEST_DIR, "file1.md"), ".md"),
    ).toThrow("is not a directory");
  });

  it("should throw error when fileList is not an array", () => {
    expect(() => getFilesByType(TEST_DIR, ".md", "not-array")).toThrow(
      "'fileList' must be an array",
    );
  });
});

describe("findJsTsFiles", () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.mkdirSync(path.join(TEST_DIR, "subdir"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "app.js"), "console.log('js')");
    fs.writeFileSync(path.join(TEST_DIR, "types.ts"), "type Test = string");
    fs.writeFileSync(path.join(TEST_DIR, "style.css"), "body {}");
    fs.writeFileSync(
      path.join(TEST_DIR, "subdir", "util.js"),
      "export default {}",
    );
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it("should find .js files", () => {
    const files = findJsTsFiles(TEST_DIR);
    expect(files.some((f) => f.includes("app.js"))).toBe(true);
  });

  it("should find .ts files", () => {
    const files = findJsTsFiles(TEST_DIR);
    expect(files.some((f) => f.includes("types.ts"))).toBe(true);
  });

  it("should not include other file types", () => {
    const files = findJsTsFiles(TEST_DIR);
    expect(files.some((f) => f.includes("style.css"))).toBe(false);
  });

  it("should search recursively", () => {
    const files = findJsTsFiles(TEST_DIR);
    expect(files.some((f) => f.includes("util.js"))).toBe(true);
  });

  // Error checking tests
  it("should throw error when dir is not a string", () => {
    expect(() => findJsTsFiles(null)).toThrow(
      "'dir' must be a non-empty string",
    );
    expect(() => findJsTsFiles(123)).toThrow(
      "'dir' must be a non-empty string",
    );
  });

  it("should throw error when directory does not exist", () => {
    expect(() => findJsTsFiles("./nonexistent-dir")).toThrow("does not exist");
  });

  it("should throw error when path is not a directory", () => {
    expect(() => findJsTsFiles(path.join(TEST_DIR, "app.js"))).toThrow(
      "is not a directory",
    );
  });
});

describe("setupDist", () => {
  afterEach(() => {
    if (fs.existsSync(DIST_PATH)) {
      fs.rmSync(DIST_PATH, { recursive: true, force: true });
    }
  });

  it("should create the dist directory", () => {
    setupDist();
    expect(fs.existsSync(DIST_PATH)).toBe(true);
  });

  it("should create subdirectories when provided", () => {
    setupDist(["css", "js", "images"]);
    expect(fs.existsSync(path.join(DIST_PATH, "css"))).toBe(true);
    expect(fs.existsSync(path.join(DIST_PATH, "js"))).toBe(true);
    expect(fs.existsSync(path.join(DIST_PATH, "images"))).toBe(true);
  });

  it("should remove existing dist directory before creating new one", () => {
    fs.mkdirSync(DIST_PATH, { recursive: true });
    fs.writeFileSync(path.join(DIST_PATH, "old-file.txt"), "old content");

    setupDist();

    expect(fs.existsSync(path.join(DIST_PATH, "old-file.txt"))).toBe(false);
  });

  // Error checking tests
  it("should throw error when paths is not an array", () => {
    expect(() => setupDist("not-array")).toThrow("'paths' must be an array");
    expect(() => setupDist(123)).toThrow("'paths' must be an array");
  });

  it("should throw error when path in array is not a string", () => {
    expect(() => setupDist([123])).toThrow("must be a string");
    expect(() => setupDist(["valid", null])).toThrow("must be a string");
  });

  it("should throw error when path in array is empty string", () => {
    expect(() => setupDist([""])).toThrow("is an empty string");
    expect(() => setupDist(["valid", "  "])).toThrow("is an empty string");
  });
});

describe("copyFiles", () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.mkdirSync(TEST_DIST, { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "file1.txt"), "content 1");
    fs.writeFileSync(path.join(TEST_DIR, "file2.txt"), "content 2");
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.rmSync(TEST_DIST, { recursive: true, force: true });
  });

  it("should copy files to destination", () => {
    copyFiles([path.join(TEST_DIR, "file1.txt")], TEST_DIST);
    expect(fs.existsSync(path.join(TEST_DIST, "file1.txt"))).toBe(true);
  });

  it("should preserve file content", () => {
    copyFiles([path.join(TEST_DIR, "file1.txt")], TEST_DIST);
    const content = fs.readFileSync(path.join(TEST_DIST, "file1.txt"), "utf8");
    expect(content).toBe("content 1");
  });

  // Error checking tests
  it("should throw error when files is not an array", () => {
    expect(() => copyFiles("not-array", TEST_DIST)).toThrow(
      "'files' must be an array",
    );
    expect(() => copyFiles(null, TEST_DIST)).toThrow(
      "'files' must be an array",
    );
  });

  it("should throw error when files array is empty", () => {
    expect(() => copyFiles([], TEST_DIST)).toThrow("'files' array is empty");
  });

  it("should throw error when destination is not a string", () => {
    expect(() => copyFiles([path.join(TEST_DIR, "file1.txt")], null)).toThrow(
      "'destination' must be a non-empty string",
    );
    expect(() => copyFiles([path.join(TEST_DIR, "file1.txt")], 123)).toThrow(
      "'destination' must be a non-empty string",
    );
  });

  it("should throw error when file path is not a string", () => {
    expect(() => copyFiles([123], TEST_DIST)).toThrow("must be a string");
  });

  it("should throw error when source file does not exist", () => {
    expect(() => copyFiles(["./nonexistent.txt"], TEST_DIST)).toThrow(
      "does not exist",
    );
  });
});

describe("copyAllFiles", () => {
  beforeEach(() => {
    fs.mkdirSync(path.join(TEST_DIR, "subdir"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "file.txt"), "content");
    fs.writeFileSync(path.join(TEST_DIR, "file.map"), "map content");
    fs.writeFileSync(path.join(TEST_DIR, "subdir", "nested.txt"), "nested");
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.rmSync(TEST_DIST, { recursive: true, force: true });
  });

  it("should copy all files recursively", () => {
    copyAllFiles(TEST_DIR, TEST_DIST);
    expect(fs.existsSync(path.join(TEST_DIST, "file.txt"))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIST, "subdir", "nested.txt"))).toBe(
      true,
    );
  });

  it("should apply filter function", () => {
    copyAllFiles(TEST_DIR, TEST_DIST, (src) => !src.endsWith(".map"));
    expect(fs.existsSync(path.join(TEST_DIST, "file.txt"))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIST, "file.map"))).toBe(false);
  });

  // Error checking tests
  it("should throw error when src is not a string", () => {
    expect(() => copyAllFiles(null, TEST_DIST)).toThrow(
      "'src' must be a non-empty string",
    );
    expect(() => copyAllFiles(123, TEST_DIST)).toThrow(
      "'src' must be a non-empty string",
    );
  });

  it("should throw error when dest is not a string", () => {
    expect(() => copyAllFiles(TEST_DIR, null)).toThrow(
      "'dest' must be a non-empty string",
    );
    expect(() => copyAllFiles(TEST_DIR, "")).toThrow(
      "'dest' must be a non-empty string",
    );
  });

  it("should throw error when filter is not a function", () => {
    expect(() => copyAllFiles(TEST_DIR, TEST_DIST, "not-function")).toThrow(
      "'filter' must be a function",
    );
    expect(() => copyAllFiles(TEST_DIR, TEST_DIST, 123)).toThrow(
      "'filter' must be a function",
    );
  });

  it("should throw error when source directory does not exist", () => {
    expect(() => copyAllFiles("./nonexistent", TEST_DIST)).toThrow(
      "does not exist",
    );
  });
});

describe("compileMarkdown", () => {
  it("should parse front matter attributes", () => {
    const markdown = `---
title: Test Title
date: 2024-01-15
description: A test description
---
# Content`;

    const entry = compileMarkdown(markdown);
    expect(entry.title).toBe("Test Title");
    expect(entry.description).toBe("A test description");
  });

  it("should parse date as Date object", () => {
    const markdown = `---
title: Test
date: 2024-01-15
---
Content`;

    const entry = compileMarkdown(markdown);
    expect(entry.date).toBeInstanceOf(Date);
    expect(entry.date.getFullYear()).toBe(2024);
  });

  it("should convert markdown body to HTML", () => {
    const markdown = `---
title: Test
date: 2024-01-15
---
# Heading

Paragraph text.`;

    const entry = compileMarkdown(markdown);
    expect(entry.content).toContain("<h1");
    expect(entry.content).toContain("Heading");
    expect(entry.content).toContain("<p>");
  });

  it("should use options for url, uri, and nextEntry", () => {
    const markdown = `---
title: Test
date: 2024-01-15
---
Content`;

    const entry = compileMarkdown(markdown, {
      url: "https://example.com/test",
      uri: "/test",
      nextEntry: "next-post",
    });

    expect(entry.url).toBe("https://example.com/test");
    expect(entry.uri).toBe("/test");
    expect(entry.nextEntry).toBe("next-post");
  });

  it("should use lastmod for dateUTC if available", () => {
    const markdown = `---
title: Test
date: 2024-01-15
lastmod: 2024-06-20
---
Content`;

    const entry = compileMarkdown(markdown);
    expect(entry.dateUTC.getMonth()).toBe(5); // June (0-indexed)
  });

  it("should parse hero image attributes", () => {
    const markdown = `---
title: Test
date: 2024-01-15
hero: /images/hero.jpg
hero_alt: A hero image
---
Content`;

    const entry = compileMarkdown(markdown);
    expect(entry.hero).toBe("/images/hero.jpg");
    expect(entry.hero_alt).toBe("A hero image");
  });

  // Error checking tests
  it("should throw error when markdown is not a string", () => {
    expect(() => compileMarkdown(null)).toThrow("'markdown' must be a string");
    expect(() => compileMarkdown(123)).toThrow("'markdown' must be a string");
    expect(() => compileMarkdown(undefined)).toThrow(
      "'markdown' must be a string",
    );
  });

  it("should throw error when opts is not an object", () => {
    const markdown = `---
title: Test
date: 2024-01-15
---
Content`;
    expect(() => compileMarkdown(markdown, "not-object")).toThrow(
      "'opts' must be an object",
    );
    expect(() => compileMarkdown(markdown, null)).toThrow(
      "'opts' must be an object",
    );
    expect(() => compileMarkdown(markdown, [1, 2, 3])).toThrow(
      "'opts' must be an object",
    );
  });
});

describe("buildFromTemplate", () => {
  it("should replace placeholders with values", () => {
    const template = "<h1>{{TITLE}}</h1>";
    const result = buildFromTemplate(template, [
      { key: "{{TITLE}}", value: "Hello World" },
    ]);
    expect(result).toBe("<h1>Hello World</h1>");
  });

  it("should replace multiple placeholders", () => {
    const template = "<h1>{{TITLE}}</h1><p>{{CONTENT}}</p>";
    const result = buildFromTemplate(template, [
      { key: "{{TITLE}}", value: "Title" },
      { key: "{{CONTENT}}", value: "Body text" },
    ]);
    expect(result).toBe("<h1>Title</h1><p>Body text</p>");
  });

  it("should replace all occurrences of the same placeholder", () => {
    const template = "{{NAME}} says hello to {{NAME}}";
    const result = buildFromTemplate(template, [
      { key: "{{NAME}}", value: "Alice" },
    ]);
    expect(result).toBe("Alice says hello to Alice");
  });

  it("should handle empty replacements array", () => {
    const template = "<h1>Static</h1>";
    const result = buildFromTemplate(template, []);
    expect(result).toBe("<h1>Static</h1>");
  });

  // Error checking tests
  it("should throw error when template is not a string", () => {
    expect(() => buildFromTemplate(null, [])).toThrow(
      "'template' must be a string",
    );
    expect(() => buildFromTemplate(123, [])).toThrow(
      "'template' must be a string",
    );
  });

  it("should throw error when replacements is not an array", () => {
    expect(() => buildFromTemplate("<h1>Test</h1>", "not-array")).toThrow(
      "'replacements' must be an array",
    );
    expect(() => buildFromTemplate("<h1>Test</h1>", null)).toThrow(
      "'replacements' must be an array",
    );
  });

  it("should throw error when replacement object is missing key", () => {
    expect(() =>
      buildFromTemplate("<h1>Test</h1>", [{ value: "test" }]),
    ).toThrow("missing required property 'key'");
  });

  it("should throw error when replacement object is missing value", () => {
    expect(() =>
      buildFromTemplate("<h1>Test</h1>", [{ key: "{{TEST}}" }]),
    ).toThrow("missing required property 'value'");
  });

  it("should throw error when replacement is not an object", () => {
    expect(() => buildFromTemplate("<h1>Test</h1>", ["not-object"])).toThrow(
      "must be an object",
    );
    expect(() => buildFromTemplate("<h1>Test</h1>", [null])).toThrow(
      "must be an object",
    );
  });
});

describe("fetchCSS", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch CSS from a URL", async () => {
    const mockCSS = "body { color: red; }";
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockCSS),
    });

    const result = await fetchCSS("https://example.com/styles.css");
    expect(result).toBe(mockCSS);
  });

  it("should return null on HTTP error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await fetchCSS("https://example.com/notfound.css");
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  it("should return null on network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await fetchCSS("https://example.com/styles.css");
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  // Error checking tests
  it("should throw error when url is not a string", async () => {
    await expect(fetchCSS(null)).rejects.toThrow(
      "'url' must be a non-empty string",
    );
    await expect(fetchCSS(123)).rejects.toThrow(
      "'url' must be a non-empty string",
    );
  });

  it("should throw error when url is empty", async () => {
    await expect(fetchCSS("")).rejects.toThrow(
      "'url' must be a non-empty string",
    );
    await expect(fetchCSS("   ")).rejects.toThrow(
      "'url' must be a non-empty string",
    );
  });

  it("should throw error when url is not a valid URL", async () => {
    await expect(fetchCSS("not-a-url")).rejects.toThrow("is not a valid URL");
  });
});

describe("writeRSS", () => {
  const rssData = {
    title: "Test Blog",
    siteUrl: "https://example.com",
    authorName: "Test Author",
    authorEmail: "test@example.com",
    authorSite: "https://author.com",
    category: "Technology",
  };

  beforeEach(() => {
    fs.mkdirSync(TEST_DIST, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIST, { recursive: true, force: true });
  });

  it("should create an RSS file", () => {
    const entries = [
      {
        title: "Test Post",
        url: "https://example.com/post1",
        description: "A test post",
        date: new Date("2024-01-15"),
      },
    ];

    writeRSS(rssData, entries, path.join(TEST_DIST, "rss.xml"));
    expect(fs.existsSync(path.join(TEST_DIST, "rss.xml"))).toBe(true);
  });

  it("should include entry data in RSS", () => {
    const entries = [
      {
        title: "Test Post",
        url: "https://example.com/post1",
        description: "A test post",
        date: new Date("2024-01-15"),
      },
    ];

    writeRSS(rssData, entries, path.join(TEST_DIST, "feed.xml"));
    const content = fs.readFileSync(path.join(TEST_DIST, "feed.xml"), "utf8");

    expect(content).toContain("Test Post");
    expect(content).toContain("https://example.com/post1");
    expect(content).toContain("Test Blog");
  });

  it("should include feed metadata", () => {
    writeRSS(rssData, [], path.join(TEST_DIST, "feed.xml"));
    const content = fs.readFileSync(path.join(TEST_DIST, "feed.xml"), "utf8");

    expect(content).toContain("Test Author");
    expect(content).toContain("https://example.com");
    expect(content).toContain("Technology");
  });

  it("should use content as fallback when no description", () => {
    const entries = [
      {
        title: "Test Post",
        url: "https://example.com/post1",
        content: "Full content here",
        date: new Date("2024-01-15"),
      },
    ];

    writeRSS(rssData, entries, path.join(TEST_DIST, "feed.xml"));
    const content = fs.readFileSync(path.join(TEST_DIST, "feed.xml"), "utf8");
    expect(content).toContain("Full content here");
  });

  // Error checking tests
  it("should throw error when rssData is not an object", () => {
    expect(() => writeRSS(null, [])).toThrow("'rssData' must be an object");
    expect(() => writeRSS("not-object", [])).toThrow(
      "'rssData' must be an object",
    );
    expect(() => writeRSS([1, 2], [])).toThrow("'rssData' must be an object");
  });

  it("should throw error when rssData is missing required properties", () => {
    expect(() => writeRSS({}, [])).toThrow("missing required property");
    expect(() => writeRSS({ title: "Test" }, [])).toThrow(
      "missing required property",
    );
  });

  it("should throw error when rssData property is not a string", () => {
    const badRssData = { ...rssData, title: 123 };
    expect(() => writeRSS(badRssData, [])).toThrow("must be a string");
  });

  it("should throw error when rssData property is empty", () => {
    const badRssData = { ...rssData, title: "" };
    expect(() => writeRSS(badRssData, [])).toThrow("cannot be an empty string");
  });

  it("should throw error when entries is not an array", () => {
    expect(() => writeRSS(rssData, "not-array")).toThrow(
      "'entries' must be an array",
    );
    expect(() => writeRSS(rssData, null)).toThrow("'entries' must be an array");
  });

  it("should throw error when entry is missing required properties", () => {
    expect(() =>
      writeRSS(rssData, [{ url: "http://test.com", date: new Date() }]),
    ).toThrow("must have a 'title' property");
    expect(() =>
      writeRSS(rssData, [{ title: "Test", date: new Date() }]),
    ).toThrow("must have a 'url' property");
    expect(() =>
      writeRSS(rssData, [{ title: "Test", url: "http://test.com" }]),
    ).toThrow("must have a 'date' property");
  });

  it("should throw error when entry date is invalid", () => {
    expect(() =>
      writeRSS(rssData, [
        { title: "Test", url: "http://test.com", date: new Date("invalid") },
      ]),
    ).toThrow("invalid Date");
  });

  it("should throw error when writePath directory does not exist", () => {
    expect(() => writeRSS(rssData, [], "./nonexistent/rss.xml")).toThrow(
      "does not exist",
    );
  });
});

describe("extractTextByRegex", () => {
  it("should extract text from a tag", () => {
    const html = "<h1>Hello World</h1>";
    expect(extractTextByRegex(html, "h1")).toBe("Hello World");
  });

  it("should return null when tag not found", () => {
    const html = "<h1>Hello World</h1>";
    expect(extractTextByRegex(html, "h2")).toBeNull();
  });

  it("should handle tags with attributes", () => {
    const html = '<h1 class="title" id="main">Title Text</h1>';
    expect(extractTextByRegex(html, "h1")).toBe("Title Text");
  });

  it("should be case insensitive", () => {
    const html = "<H1>Title</H1>";
    expect(extractTextByRegex(html, "h1")).toBe("Title");
  });

  it("should return first match only", () => {
    const html = "<p>First</p><p>Second</p>";
    expect(extractTextByRegex(html, "p")).toBe("First");
  });

  // Error checking tests
  it("should throw error when htmlString is not a string", () => {
    expect(() => extractTextByRegex(null, "h1")).toThrow(
      "'htmlString' must be a string",
    );
    expect(() => extractTextByRegex(123, "h1")).toThrow(
      "'htmlString' must be a string",
    );
  });

  it("should throw error when tagName is not a string", () => {
    expect(() => extractTextByRegex("<h1>Test</h1>", null)).toThrow(
      "'tagName' must be a non-empty string",
    );
    expect(() => extractTextByRegex("<h1>Test</h1>", 123)).toThrow(
      "'tagName' must be a non-empty string",
    );
  });

  it("should throw error when tagName is empty", () => {
    expect(() => extractTextByRegex("<h1>Test</h1>", "")).toThrow(
      "'tagName' must be a non-empty string",
    );
    expect(() => extractTextByRegex("<h1>Test</h1>", "   ")).toThrow(
      "'tagName' must be a non-empty string",
    );
  });
});

describe("mirrorDirectory", () => {
  beforeEach(() => {
    fs.mkdirSync(path.join(TEST_DIR, "subdir1", "nested"), { recursive: true });
    fs.mkdirSync(path.join(TEST_DIR, "subdir2"), { recursive: true });
    fs.writeFileSync(path.join(TEST_DIR, "file.txt"), "content");
    fs.writeFileSync(path.join(TEST_DIR, "subdir1", "file.txt"), "content");
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.rmSync(TEST_DIST, { recursive: true, force: true });
  });

  it("should create destination directory", () => {
    mirrorDirectory(TEST_DIR, TEST_DIST);
    expect(fs.existsSync(TEST_DIST)).toBe(true);
  });

  it("should mirror subdirectory structure", () => {
    mirrorDirectory(TEST_DIR, TEST_DIST);
    expect(fs.existsSync(path.join(TEST_DIST, "subdir1"))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIST, "subdir2"))).toBe(true);
    expect(fs.existsSync(path.join(TEST_DIST, "subdir1", "nested"))).toBe(true);
  });

  it("should not copy files, only directories", () => {
    mirrorDirectory(TEST_DIR, TEST_DIST);
    expect(fs.existsSync(path.join(TEST_DIST, "file.txt"))).toBe(false);
    expect(fs.existsSync(path.join(TEST_DIST, "subdir1", "file.txt"))).toBe(
      false,
    );
  });

  // Error checking tests
  it("should throw error when src is not a string", () => {
    expect(() => mirrorDirectory(null, TEST_DIST)).toThrow(
      "'src' must be a non-empty string",
    );
    expect(() => mirrorDirectory(123, TEST_DIST)).toThrow(
      "'src' must be a non-empty string",
    );
  });

  it("should throw error when src is empty", () => {
    expect(() => mirrorDirectory("", TEST_DIST)).toThrow(
      "'src' must be a non-empty string",
    );
  });

  it("should throw error when dest is not a string", () => {
    expect(() => mirrorDirectory(TEST_DIR, null)).toThrow(
      "'dest' must be a non-empty string",
    );
    expect(() => mirrorDirectory(TEST_DIR, 123)).toThrow(
      "'dest' must be a non-empty string",
    );
  });

  it("should throw error when source directory does not exist", () => {
    expect(() => mirrorDirectory("./nonexistent", TEST_DIST)).toThrow(
      "does not exist",
    );
  });
});

describe("swapRootDir", () => {
  it("should swap the root directory", () => {
    const result = swapRootDir("./src/css/style.css", "./dist");
    expect(result).toMatch(/dist.*css.*style\.css/);
  });

  it("should handle paths without leading dot", () => {
    const result = swapRootDir("src/js/app.js", "dist");
    expect(result).toMatch(/dist.*js.*app\.js/);
  });

  it("should work with deeply nested paths", () => {
    const result = swapRootDir("./src/a/b/c/d/file.txt", "./output");
    expect(result).toMatch(/output.*a.*b.*c.*d.*file\.txt/);
  });

  it("should handle single segment paths", () => {
    const result = swapRootDir("src", "dist");
    expect(result).toBe("dist");
  });

  // Error checking tests
  it("should throw error when originalPath is not a string", () => {
    expect(() => swapRootDir(null, "./dist")).toThrow(
      "'originalPath' must be a non-empty string",
    );
    expect(() => swapRootDir(123, "./dist")).toThrow(
      "'originalPath' must be a non-empty string",
    );
  });

  it("should throw error when originalPath is empty", () => {
    expect(() => swapRootDir("", "./dist")).toThrow(
      "'originalPath' must be a non-empty string",
    );
    expect(() => swapRootDir("   ", "./dist")).toThrow(
      "'originalPath' must be a non-empty string",
    );
  });

  it("should throw error when newRootFolder is not a string", () => {
    expect(() => swapRootDir("./src/file.txt", null)).toThrow(
      "'newRootFolder' must be a non-empty string",
    );
    expect(() => swapRootDir("./src/file.txt", 123)).toThrow(
      "'newRootFolder' must be a non-empty string",
    );
  });

  it("should throw error when newRootFolder is empty", () => {
    expect(() => swapRootDir("./src/file.txt", "")).toThrow(
      "'newRootFolder' must be a non-empty string",
    );
  });
});

describe("resizeJpg", () => {
  it("should return a promise", () => {
    // Just verify the function returns a promise without actually calling sharp
    // since creating valid test images is complex
    const result = resizeJpg("nonexistent.jpg", "output.jpg", 100);
    expect(result).toBeInstanceOf(Promise);
    // Catch the expected rejection to avoid unhandled promise rejection
    result.catch(() => {});
  });

  it("should reject with error for invalid file", async () => {
    await expect(
      resizeJpg("nonexistent.jpg", "output.jpg", 100),
    ).rejects.toThrow();
  });

  // Error checking tests
  it("should reject when imagePath is not a string", async () => {
    await expect(resizeJpg(null, "output.jpg", 100)).rejects.toThrow(
      "'imagePath' must be a non-empty string",
    );
    await expect(resizeJpg(123, "output.jpg", 100)).rejects.toThrow(
      "'imagePath' must be a non-empty string",
    );
  });

  it("should reject when output is not a string", async () => {
    await expect(resizeJpg("input.jpg", null, 100)).rejects.toThrow(
      "'output' must be a non-empty string",
    );
    await expect(resizeJpg("input.jpg", "", 100)).rejects.toThrow(
      "'output' must be a non-empty string",
    );
  });

  it("should reject when size is not a positive number", async () => {
    await expect(resizeJpg("input.jpg", "output.jpg", "100")).rejects.toThrow(
      "'size' must be a positive number",
    );
    await expect(resizeJpg("input.jpg", "output.jpg", -100)).rejects.toThrow(
      "'size' must be a positive number",
    );
    await expect(resizeJpg("input.jpg", "output.jpg", 0)).rejects.toThrow(
      "'size' must be a positive number",
    );
  });

  it("should reject when source image does not exist", async () => {
    await expect(
      resizeJpg("./nonexistent.jpg", "output.jpg", 100),
    ).rejects.toThrow("does not exist");
  });
});

describe("resizePng", () => {
  it("should return a promise", () => {
    // Just verify the function returns a promise without actually calling sharp
    // since creating valid test images is complex
    const result = resizePng("nonexistent.png", "output.png", 100);
    expect(result).toBeInstanceOf(Promise);
    // Catch the expected rejection to avoid unhandled promise rejection
    result.catch(() => {});
  });

  it("should reject with error for invalid file", async () => {
    await expect(
      resizePng("nonexistent.png", "output.png", 100),
    ).rejects.toThrow();
  });

  // Error checking tests
  it("should reject when imagePath is not a string", async () => {
    await expect(resizePng(null, "output.png", 100)).rejects.toThrow(
      "'imagePath' must be a non-empty string",
    );
    await expect(resizePng(123, "output.png", 100)).rejects.toThrow(
      "'imagePath' must be a non-empty string",
    );
  });

  it("should reject when output is not a string", async () => {
    await expect(resizePng("input.png", null, 100)).rejects.toThrow(
      "'output' must be a non-empty string",
    );
    await expect(resizePng("input.png", "", 100)).rejects.toThrow(
      "'output' must be a non-empty string",
    );
  });

  it("should reject when size is not a positive number", async () => {
    await expect(resizePng("input.png", "output.png", "100")).rejects.toThrow(
      "'size' must be a positive number",
    );
    await expect(resizePng("input.png", "output.png", -100)).rejects.toThrow(
      "'size' must be a positive number",
    );
    await expect(resizePng("input.png", "output.png", 0)).rejects.toThrow(
      "'size' must be a positive number",
    );
  });

  it("should reject when source image does not exist", async () => {
    await expect(
      resizePng("./nonexistent.png", "output.png", 100),
    ).rejects.toThrow("does not exist");
  });
});

describe("writeImages", () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true });
    fs.mkdirSync(TEST_DIST, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
    fs.rmSync(TEST_DIST, { recursive: true, force: true });
  });

  it("should copy SVG files", async () => {
    fs.writeFileSync(
      path.join(TEST_DIR, "icon.svg"),
      '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
    );

    await writeImages(TEST_DIR, TEST_DIST);

    expect(fs.existsSync(path.join(TEST_DIST, "icon.svg"))).toBe(true);
  });

  it("should copy MP4 files", async () => {
    // Create a minimal file to simulate an MP4
    fs.writeFileSync(path.join(TEST_DIR, "video.mp4"), "fake mp4 content");

    await writeImages(TEST_DIR, TEST_DIST);

    expect(fs.existsSync(path.join(TEST_DIST, "video.mp4"))).toBe(true);
  });

  it("should return a promise", () => {
    const result = writeImages(TEST_DIR, TEST_DIST);
    expect(result).toBeInstanceOf(Promise);
  });

  // Error checking tests
  it("should throw error when contentDir is not a string", async () => {
    await expect(writeImages(null, TEST_DIST)).rejects.toThrow(
      "'contentDir' must be a non-empty string",
    );
    await expect(writeImages(123, TEST_DIST)).rejects.toThrow(
      "'contentDir' must be a non-empty string",
    );
  });

  it("should throw error when distDir is not a string", async () => {
    await expect(writeImages(TEST_DIR, null)).rejects.toThrow(
      "'distDir' must be a non-empty string",
    );
    await expect(writeImages(TEST_DIR, "")).rejects.toThrow(
      "'distDir' must be a non-empty string",
    );
  });

  it("should throw error when source directory does not exist", async () => {
    await expect(writeImages("./nonexistent", TEST_DIST)).rejects.toThrow(
      "does not exist",
    );
  });

  it("should throw error when destination directory does not exist", async () => {
    await expect(writeImages(TEST_DIR, "./nonexistent")).rejects.toThrow(
      "does not exist",
    );
  });
});
