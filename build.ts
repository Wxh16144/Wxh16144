import rehypeFigure from '@microflash/rehype-figure';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkFrontmatter from 'remark-frontmatter'
import { matter } from 'vfile-matter'
import { minify } from 'html-minifier';
import fetch from 'node-fetch';
import path from 'node:path';
import fs from 'node:fs';
import fse from 'fs-extra/esm';

import pkg from './package.json' assert { type: 'json' };

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const outputDir = path.resolve(__dirname, './dist');
const templatePath = path.resolve(__dirname, './assets/template.html');
const outputPath = path.resolve(outputDir, 'index.html');

function markdown2Html(content: string) {
  let metadata = {};
  const result = remark()
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(() => (_, vfile) => {
      matter(vfile);
      metadata = vfile.data?.matter || {};
    })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeFigure)
    .use(rehypeStringify)
    .processSync(content)
    .toString();

  return { metadata, html: result.toString() };
}

// https://www.30secondsofcode.org/js/s/is-absolute-url
function isAbsoluteURL(url?: any): url is URL {
  if (typeof url !== 'string') return false;
  return /^[a-z][a-z0-9+.-]*:/.test(url)
}

function hasMarkdownSyntax(content: string): boolean {
  const patterns = [
    /^#{1,6}\s+.+/m, // 标题 (# Heading)
    /^[-*+]\s+.+/m, // 无序列表 (- item)
    /^\d+\.\s+.+/m, // 有序列表 (1. item)
    /^>\s.+/m, // 引用 (>)
    /`{1,3}[^`]+`{1,3}/m, // 行内/代码块 (`code`)
    /\[.*?\]\(.*?\)/m // 链接 ([text](url))
  ]

  return patterns
    .filter(pattern => pattern.test(content)).length >= 3;
}

function mergeMetadata(target: Record<string, any>, ...sources: Record<string, any>[]) {
  function _fn(target: Record<string, any>, source: Record<string, any>) {
    for (const key in source) {
      if (Array.isArray(source[key]) && Array.isArray(target[key])) {
        target[key] = [...new Set([...target[key], ...source[key]])];
      } else if (typeof source[key] === 'object' && typeof target[key] === 'object') {
        target[key] = { ...target[key], ...source[key] };
      } else {
        target[key] = source[key];
      }
    }
  }

  sources.forEach(source => {
    if (source && typeof source === 'object') {
      _fn(target, source);
    } else {
      throw new TypeError(`Expected an object, but received ${typeof source}`);
    }
  });

  return target;
}

// ========== Main Execution ==========
fse.emptyDirSync(outputDir);

let resumePath = path.resolve(__dirname, process.argv[2] || 'resume.md');

const resumeSource = process.env.RESUME;
if (isAbsoluteURL(resumeSource)) {
  const response = await fetch(resumeSource);
  if (!response.ok) {
    throw new Error(`Failed to fetch resume from ${resumeSource}`);
  }
  const text = await response.text();
  if (!hasMarkdownSyntax(text)) {
    console.log(text);
    throw new Error(`Resume content from ${resumeSource} does not contain enough Markdown syntax.`);
  }
  resumePath = path.resolve(outputDir, 'resume.md');
  fs.writeFileSync(resumePath, text);
}

if (!fs.existsSync(resumePath)) {
  throw new Error(`Resume file not found: ${resumePath}`);
}

const resume = markdown2Html(fs.readFileSync(resumePath, 'utf-8'));

const defaultMetadata = {
  title: `${pkg.author.name_cn} - 高级前端工程师 | React/Vue 方向 | ${new Date().getFullYear() - 2019}年经验 (中文)`,
  description: pkg.description || `${pkg.author.name_cn} 的个人简历`,
  keywords: pkg.keywords || [],
  favicon: "https://github.com/Wxh16144.png"
}

const mergedMetadata = mergeMetadata(
  defaultMetadata,
  resume.metadata || {},
  { resume: resume.html }
);

let templateHtml = fs.readFileSync(templatePath, 'utf-8');
Object.entries(mergedMetadata).forEach(([key, value]) => {
  templateHtml = templateHtml.replace(new RegExp(`{{${key.toUpperCase()}}}`, 'g'), value);
});

const metadataRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
const matches = templateHtml.match(metadataRegex);
if (matches) {
  throw new Error(`has unfilled metadata: ${matches.join(', ')}`);
}

const result = minify(templateHtml, {
  removeComments: true,
  removeOptionalTags: true,
  removeTagWhitespace: true,
  collapseWhitespace: true,
  // collapseInlineTagWhitespace: true,
  minifyCSS: true,
  minifyJS: true,
});

fs.writeFileSync(outputPath, result);

globalThis.console.log(`✅ Resume generated successfully at ${path.relative(__dirname, outputPath)}`);
