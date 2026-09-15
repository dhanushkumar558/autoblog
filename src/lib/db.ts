import { Context } from 'hono';

export type Blog = {
  id: number;
  title: string;
  slug: string;
  prompt: string;
  content_html: string;
  toc_html: string;
  excerpt: string;
  image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export async function getBlogs(c: Context): Promise<Blog[]> {
  const result = await c.env.DB.prepare(
    'SELECT id, title, slug, prompt, content_html, toc_html, excerpt, image_url, status, created_at, updated_at FROM blogs ORDER BY created_at DESC'
  ).all();
  return result.results as Blog[];
}

export async function getBlogBySlug(c: Context, slug: string): Promise<Blog | null> {
  const result = await c.env.DB.prepare(
    'SELECT id, title, slug, prompt, content_html, toc_html, excerpt, image_url, status, created_at, updated_at FROM blogs WHERE slug = ?'
  ).bind(slug).first();
  return (result as Blog) || null;
}

export async function createBlog(c: Context, data: {
  title: string;
  slug: string;
  prompt: string;
  content_html: string;
  toc_html: string;
  excerpt: string;
  image_url?: string | null;
  status?: string;
}): Promise<Blog> {
  const result = await c.env.DB.prepare(
    'INSERT INTO blogs (title, slug, prompt, content_html, toc_html, excerpt, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, title, slug, prompt, content_html, toc_html, excerpt, image_url, status, created_at, updated_at'
  ).bind(
    data.title,
    data.slug,
    data.prompt,
    data.content_html,
    data.toc_html,
    data.excerpt,
    data.image_url || null,
    data.status || 'published'
  ).first();
  return result as Blog;
}

export async function updateBlogImage(c: Context, id: number, imageUrl: string | null): Promise<Blog | null> {
  const result = await c.env.DB.prepare(
    'UPDATE blogs SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING id, title, slug, prompt, content_html, toc_html, excerpt, image_url, status, created_at, updated_at'
  ).bind(imageUrl, id).first();
  return (result as Blog) || null;
}

export async function deleteBlog(c: Context, id: number): Promise<boolean> {
  const result = await c.env.DB.prepare('DELETE FROM blogs WHERE id = ?').bind(id).run();
  return result.changes > 0;
}

export async function getSetting(c: Context, key: string): Promise<string | null> {
  const result = await c.env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return (result?.value as string) || null;
}

export async function setSetting(c: Context, key: string, value: string): Promise<void> {
  await c.env.DB.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).bind(key, value).run();
}
