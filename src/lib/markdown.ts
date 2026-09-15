import { marked } from 'marked';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export function processMarkdown(md: string): { title: string; excerpt: string; content: string; toc_html: string } {
  let html = marked.parse(md) as string;

  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]) : '';
  if (titleMatch) {
    html = html.replace(titleMatch[0], '');
  }

  const excerptMatch = html.match(/<p[^>]*>(.*?)<\/p>/is);
  const excerpt = excerptMatch ? stripHtml(excerptMatch[1]).substring(0, 200) : '';

  const toc: { level: number; id: string; text: string }[] = [];
  html = html.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, content) => {
    const text = stripHtml(content);
    const id = slugify(text);
    toc.push({ level: parseInt(level), id, text });
    return `<h${level} id="${id}"${attrs}>${content}</h${level}>`;
  });

  const tocHtml = toc.length > 0
    ? `<nav class="toc"><ul>${toc.map(item => `<li class="toc-level-${item.level}"><a href="#${item.id}">${item.text}</a></li>`).join('')}</ul></nav>`
    : '';

  return { title, excerpt, content: html, toc_html: tocHtml };
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
