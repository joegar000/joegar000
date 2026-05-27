const fs = require("fs");
const hljs = require("highlight.js");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const contentDir = path.join(rootDir, "content", "blog");
const publicDir = path.join(rootDir, "public");
const outputFile = path.join(publicDir, "posts.json");
const rssFile = path.join(publicDir, "rss.xml");
const publicAssetDir = path.join(publicDir, "blog-assets");
const packageFile = path.join(rootDir, "package.json");

function walkMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkMarkdownFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

function parseFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { data: {}, body: normalized };
  }

  return {
    data: parseYamlLite(match[1]),
    body: normalized.slice(match[0].length)
  };
}

function parseYamlLite(input) {
  const data = {};
  let listKey = "";

  input.split("\n").forEach((line) => {
    if (!line.trim()) {
      return;
    }

    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && listKey) {
      data[listKey].push(parseValue(listMatch[1]));
      return;
    }

    const pairMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pairMatch) {
      return;
    }

    const [, key, rawValue] = pairMatch;
    if (rawValue.trim() === "") {
      data[key] = [];
      listKey = key;
      return;
    }

    data[key] = parseValue(rawValue);
    listKey = "";
  });

  return data;
}

function parseValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => parseValue(item))
      .filter(Boolean);
  }

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  return trimmed;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildPosts() {
  ensureDir(publicDir);
  ensureDir(publicAssetDir);

  const posts = walkMarkdownFiles(contentDir)
    .map((filePath) => buildPost(filePath))
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const payload = { posts };

  fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(rssFile, renderRss(posts));
  console.log(`Published ${posts.length} blog post${posts.length === 1 ? "" : "s"} to public/posts.json`);
}

function buildPost(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, body } = parseFrontmatter(raw);

  if (data.published === false) {
    return null;
  }

  const title = data.title || titleFromFile(filePath);
  const id = slugify(data.slug || title);
  const tags = Array.isArray(data.tags) ? data.tags : splitTags(data.tags);
  const date = normalizeDate(data.date || fs.statSync(filePath).mtime);
  const context = {
    slug: id,
    postDir: path.dirname(filePath)
  };
  const excerpt = data.excerpt || data.description || excerptFromMarkdown(body);
  const wordCount = countWords(body);

  return {
    id,
    title,
    description: data.description || data.subtitle || excerpt,
    date,
    tags,
    readingTime: `${Math.max(1, Math.ceil(wordCount / 220))} min read`,
    source: path.relative(rootDir, filePath),
    html: markdownToHtml(body, context)
  };
}

function splitTags(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function titleFromFile(filePath) {
  return path
    .basename(filePath, ".md")
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function markdownToHtml(markdown, context) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fenceMatch = line.match(/^```(.*)$/);
    if (fenceMatch) {
      const language = fenceMatch[1].trim();
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      html.push(renderCodeBlock(code.join("\n"), language));
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInline(headingMatch[2], context)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      html.push("<hr>");
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      html.push(`<blockquote>${quote.map((quoteLine) => renderInline(quoteLine, context)).join("<br>")}</blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ""));
        index += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${renderInline(item, context)}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }
      html.push(`<ol>${items.map((item) => `<li>${renderInline(item, context)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraph = [];
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${renderInline(paragraph.join(" "), context)}</p>`);
  }

  return html.join("\n");
}

function renderCodeBlock(code, rawLanguage) {
  const language = normalizeLanguage(rawLanguage);

  if (language && hljs.getLanguage(language)) {
    const highlighted = hljs.highlight(code, {
      language,
      ignoreIllegals: true
    }).value;

    return `<pre><code class="hljs language-${escapeAttribute(language)}">${highlighted}</code></pre>`;
  }

  const className = language ? ` class="language-${escapeAttribute(language)}"` : "";
  return `<pre><code${className}>${escapeHtml(code)}</code></pre>`;
}

function normalizeLanguage(rawLanguage) {
  const language = String(rawLanguage || "")
    .trim()
    .split(/\s+/)[0]
    .toLowerCase();

  const aliases = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    md: "markdown",
    yml: "yaml"
  };

  return aliases[language] || language;
}

function isBlockStart(line) {
  return (
    /^```/.test(line) ||
    /^(#{1,6})\s+/.test(line) ||
    /^---+$/.test(line.trim()) ||
    /^>\s?/.test(line) ||
    /^\s*[-*]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line)
  );
}

function renderInline(value, context) {
  const tokens = [];
  let text = String(value);

  function addToken(html) {
    const marker = `%%TOKEN${tokens.length}%%`;
    tokens.push(html);
    return marker;
  }

  text = text.replace(/`([^`]+)`/g, (_, code) => addToken(`<code>${escapeHtml(code)}</code>`));
  text = text.replace(/!\[\[([^\]]+)\]\]/g, (_, target) => {
    const image = parseObsidianTarget(target);
    const src = resolveAsset(image.href, context);
    return addToken(`<img src="${escapeAttribute(src)}" alt="${escapeAttribute(image.alt)}">`);
  });
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    return addToken(`<img src="${escapeAttribute(resolveAsset(src, context))}" alt="${escapeAttribute(alt)}">`);
  });
  text = text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => {
    const title = label || target;
    return addToken(`<a href="#/blog/${slugify(target.replace(/\.md$/, ""))}">${escapeHtml(title)}</a>`);
  });
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    return addToken(`<a href="${escapeAttribute(resolveHref(href))}">${escapeHtml(label)}</a>`);
  });

  let html = escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");

  tokens.forEach((token, tokenIndex) => {
    html = html.replace(`%%TOKEN${tokenIndex}%%`, token);
  });

  return html;
}

function parseObsidianTarget(target) {
  const [href, label] = target.split("|").map((part) => part.trim());
  return {
    href,
    alt: label && !/^\d+(x\d+)?$/.test(label) ? label : path.basename(href)
  };
}

function resolveHref(href) {
  const trimmed = href.trim();
  if (/^(https?:|mailto:|#|\/)/.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.endsWith(".md")) {
    return `#/blog/${slugify(path.basename(trimmed, ".md"))}`;
  }

  return trimmed;
}

function resolveAsset(src, context) {
  const cleanSrc = src.trim();
  if (/^(https?:|data:|\/)/.test(cleanSrc)) {
    return cleanSrc;
  }

  const sourcePath = findAsset(cleanSrc, context.postDir);
  if (!sourcePath) {
    return cleanSrc;
  }

  const destinationDir = path.join(publicAssetDir, context.slug);
  const relativeAssetPath = path.relative(contentDir, sourcePath).split(path.sep).map(encodeURIComponent).join("/");
  const destination = path.join(destinationDir, ...path.relative(contentDir, sourcePath).split(path.sep));
  ensureDir(path.dirname(destination));
  fs.copyFileSync(sourcePath, destination);

  return `blog-assets/${context.slug}/${relativeAssetPath}`;
}

function findAsset(src, postDir) {
  const decoded = decodeURIComponent(src);
  const candidates = [
    path.resolve(postDir, decoded),
    path.resolve(contentDir, decoded),
    path.resolve(contentDir, "assets", decoded)
  ];

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
}

function excerptFromMarkdown(markdown) {
  return plainText(markdown).split(/\s+/).slice(0, 32).join(" ");
}

function countWords(markdown) {
  return plainText(markdown).split(/\s+/).filter(Boolean).length;
}

function plainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[\[([^\]]+)\]\]/g, " ")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, "$2 $1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function renderRss(posts) {
  const pkg = fs.existsSync(packageFile) ? JSON.parse(fs.readFileSync(packageFile, "utf8")) : {};
  const siteUrl = (pkg.homepage || "").replace(/\/$/, "");
  const items = posts
    .map((post) => {
      const link = `${siteUrl}/#/blog/${post.id}`;
      return [
        "  <item>",
        `    <title>${escapeXml(post.title)}</title>`,
        `    <link>${escapeXml(link)}</link>`,
        `    <guid>${escapeXml(link)}</guid>`,
        `    <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `    <description>${escapeXml(post.description || "")}</description>`,
        "  </item>"
      ].join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" ?>\n<rss version="2.0">\n<channel>\n  <title>David Garcia Blog</title>\n  <link>${escapeXml(siteUrl)}</link>\n  <description>Posts from David Garcia</description>\n${items}\n</channel>\n</rss>\n`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function escapeXml(value) {
  return escapeHtml(value);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

buildPosts();
