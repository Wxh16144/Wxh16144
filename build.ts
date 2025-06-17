import rehypeFigure from '@microflash/rehype-figure';
import rehypeStringify from 'rehype-stringify';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeRaw from 'rehype-raw';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkFrontmatter from 'remark-frontmatter'
import { matter } from 'vfile-matter'
import { minify } from '@node-minify/core';
import { htmlMinifier } from '@node-minify/html-minifier';
import fetch from 'node-fetch';
import path from 'node:path';
import fs from 'node:fs';
import fse from 'fs-extra';
import figlet from 'figlet';
import fg from 'fast-glob';
import { encodeDigits } from 'digit-font';
import { visit } from 'unist-util-visit';

import pkg from './package.json' assert { type: 'json' };
import { generateObfuscatedFontCss, withObfuscationConfig, OBFUSCATION_META } from './genCss';

// region Plugins

function remarkWrapTextWithSpan() {
  const obfuscationConfig = withObfuscationConfig((config) => config);

  const rules = [
    {
      // 手机号正则匹配
      regex: /(?<!\d)1[3-9]\d\D{0,3}\d{4}\D{0,3}\d{4}(?!\d)/g,
      replace: (match: RegExpExecArray) => {
        // 2. 将 match[0] 和外部获取好的 config 传入 encodeDigits 进行处理
        const obfuscatedText = encodeDigits(match[0], obfuscationConfig.numberMap);

        // return `<a class="${OBFUSCATION_META.className}" href="tel:${match[0]}">${obfuscatedText}</a>`;
        return `<span class="${OBFUSCATION_META.className}">${obfuscatedText}</span>`;
      },
    },
    {
      // 2019.09
      regex: /(?<!\d)\d{4}\.\d{2}(?!\d)/g,
      replace: (match: RegExpExecArray) => {
        const obfuscatedText = encodeDigits(match[0], obfuscationConfig.numberMap);
        return `<span class="${OBFUSCATION_META.className}" aria-label="${match[0]}">${obfuscatedText}</span>`;
      }
    }
  ];

  return (tree: any) => {
    for (const rule of rules) {
      visit(tree, 'text', (node, index, parent) => {
        if (!parent || !rule.regex.test(node.value)) return;

        rule.regex.lastIndex = 0;

        const newNodes: any[] = [];
        let lastIndex = 0;
        let match;

        while ((match = rule.regex.exec(node.value)) !== null) {
          if (match.index > lastIndex) {
            newNodes.push({
              type: 'text',
              value: node.value.slice(lastIndex, match.index),
            });
          }

          newNodes.push({
            type: 'html',
            value: rule.replace(match),
          });

          lastIndex = match.index + match[0].length;

          if (!rule.regex.global) break;
        }

        if (lastIndex < node.value.length) {
          newNodes.push({
            type: 'text',
            value: node.value.slice(lastIndex),
          });
        }

        parent.children.splice(index, 1, ...newNodes);

        return index! + newNodes.length;
      });
    }
  };
}

function rehypeInjectScripts(scripts: { path?: string; src?: string; type?: string; defer?: boolean }[]) {
  return (tree: any) => {
    scripts.forEach(script => {
      const properties: any = {};
      if (script.type) properties.type = script.type;
      if (script.defer) properties.defer = true;
      if (script.src) properties.src = script.src;

      let content = '';
      if (script.path && fs.existsSync(script.path)) {
        content = fs.readFileSync(script.path, 'utf-8');
      }

      tree.children.push({
        type: 'element',
        tagName: 'script',
        properties,
        children: content ? [{ type: 'text', value: content }] : []
      });
    });
  };
}
// endregion

// region Main Logic

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const outputDir = path.resolve(__dirname, './dist');
const assetsDir = path.resolve(__dirname, './assets');
const templatePath = path.resolve(assetsDir, 'template.html');
const outputPath = path.resolve(outputDir, 'index.html');
const javascriptAssetFiles = fg.sync('*.js', { cwd: assetsDir, dot: false, absolute: true });

const dynamicScripts = javascriptAssetFiles.map((file) => {
  if (file.endsWith('.module.js')) {
    return { path: file, type: 'module' };
  }
  return { path: file, defer: true };
});

function markdown2Html(content: string) {
  let metadata = {};
  const result = remark()
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(() => (_, vfile) => {
      matter(vfile);
      metadata = vfile.data?.matter || {};
    })
    .use(remarkWrapTextWithSpan)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] })
    .use(rehypeInjectScripts, [
      { src: 'https://registry.npmmirror.com/jquery/3.7.1/files/dist/jquery.slim.min.js', defer: true },
      ...dynamicScripts
    ])
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
  favicon: "https://github.com/Wxh16144.png",
  css_content: generateObfuscatedFontCss()
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

const minifiedHtml = await minify({
  // @ts-ignore
  compressor: htmlMinifier,
  content: templateHtml,
  options: {
    removeComments: true,
    removeOptionalTags: true,
    removeTagWhitespace: true,
    collapseWhitespace: true,
    minifyCSS: true,
    minifyJS: true,
  }
});

const banner = `<!--
${figlet.textSync("Wxh16144/resume", { font: 'Small Block' })}
Source Code: ${pkg.repository.url}
Generated date: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} (Asia/Shanghai)
-->`;

fs.writeFileSync(outputPath, `${banner}\n${minifiedHtml}`);

// #endregion

globalThis.console.log(`✅ Resume generated successfully at ${path.relative(__dirname, outputPath)}`);
