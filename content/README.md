# David Garcia Portfolio

Small React portfolio with static content, Catppuccin themes, an embedded PDF resume, and Markdown blog publishing.

## Scripts

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm run publish:blog`

Builds `public/posts.json` and `public/rss.xml` from Markdown files in `content/blog`.

Think of `content/blog` as the source of truth and `public/posts.json` as the generated file the browser reads. You should edit Markdown posts, then let the publish script rewrite the JSON and RSS files.

Each post can use frontmatter:

```md
---
title: My Post
description: A short summary.
date: 2026-05-25
tags: [react, notes]
---

Write the post here.
```

Obsidian image embeds like `![[diagram.png]]` work when the image is next to the post, under `content/blog/assets`, or referenced with a normal Markdown image path.

### `npm run build`

Builds the production site into `build`. The build script publishes the blog first.

### `npm run deploy`

Builds the site and publishes the `build` directory with `gh-pages`.

## Editing The Site

Homepage copy, page links, and project data live in `src/siteConfig.js`.

The resume PDF is `public/resume.pdf`. Replace that file to update the embedded resume and download.

To add a new page later:

1. Create a component in `src/components`.
2. Add a route in `src/App.js`.
3. Add a page entry in `src/siteConfig.js` if you want it linked from the nav and homepage.
