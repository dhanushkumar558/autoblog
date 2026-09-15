import { Context } from 'hono';
import { createBlog, deleteBlog, getBlogs, updateBlogImage } from '../lib/db';
import { generateBlogContent, generateBlogImage } from '../lib/ai';
import { processMarkdown, generateSlug } from '../lib/markdown';

export async function generateBlogHandler(c: Context) {
  try {
    let prompt: string;
    let model: string | undefined;

    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await c.req.json();
      prompt = body?.prompt;
      model = body?.model;
    } else {
      const formData = await c.req.formData();
      prompt = formData.get('prompt') as string;
      model = (formData.get('model') as string) || undefined;
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return c.json({ error: 'Please provide a valid prompt (at least 5 characters)' }, 400);
    }

    const apiKey = c.env.OPENROUTER_API_KEY as string;
    if (!apiKey) {
      return c.json({ error: 'OpenRouter API key not configured' }, 500);
    }

    const selectedModel = model || (c.env.OPENROUTER_MODEL as string) || 'deepseek/deepseek-v4-flash-0731';
    const result = await generateBlogContent(prompt.trim(), apiKey, selectedModel);
    const { title, excerpt, content } = result;
    let slug = generateSlug(title);
    
    const existingSlug = await c.env.DB.prepare('SELECT id FROM blogs WHERE slug = ?').bind(slug).first();
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const processed = processMarkdown(content);
    const finalTitle = processed.title || title;
    const finalSlug = generateSlug(finalTitle);
    
    const finalProcessed = processMarkdown(content);
    let imageUrl: string | null = null;
    try {
      imageUrl = await generateBlogImage(prompt.trim(), apiKey);
    } catch (imageError) {
      console.error('Image generation error:', imageError);
    }
    
    const blog = await createBlog(c, {
      title: finalTitle,
      slug: finalSlug,
      prompt: prompt.trim(),
      content_html: finalProcessed.content,
      toc_html: finalProcessed.toc_html,
      excerpt: finalProcessed.excerpt || excerpt,
      image_url: imageUrl,
    });

    return c.json({ success: true, blog, redirect: `/blog/${blog.slug}` });
  } catch (error) {
    console.error('Generation error:', error);
    return c.json({ error: error instanceof Error ? error.message : 'Failed to generate blog' }, 500);
  }
}

export async function loginHandler(c: Context) {
  try {
    const formData = await c.req.formData();
    const password = formData.get('password') as string;

    const adminPassword = c.env.ADMIN_PASSWORD as string;
    if (password !== adminPassword) {
      return c.json({ error: 'Invalid password' }, 401);
    }

    const timestamp = Date.now().toString();
    const key = new TextEncoder().encode(c.env.ADMIN_SECRET as string);
    const signature = await crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      new TextEncoder().encode(timestamp)
    );
    const sig = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const session = `${timestamp}:${sig}`;
    c.header('Set-Cookie', `session=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`);
    
    return c.redirect('/admin');
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
}

export async function logoutHandler(c: Context) {
  c.header('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  return c.redirect('/admin/login');
}

export async function deleteBlogHandler(c: Context) {
  const idParam = c.req.param('id');
  const id = parseInt(idParam || '');
  if (isNaN(id)) {
    return c.json({ error: 'Invalid blog ID' }, 400);
  }

  await deleteBlog(c, id);
  return c.redirect('/admin');
}

export async function backfillImagesHandler(c: Context) {
  try {
    const apiKey = c.env.OPENROUTER_API_KEY as string;
    if (!apiKey) {
      return c.json({ error: 'OpenRouter API key not configured' }, 500);
    }

    const blogs = await getBlogs(c);
    const results: { id: number; title: string; image_url: string | null; error?: string }[] = [];

    for (const blog of blogs) {
      if (blog.image_url) {
        results.push({ id: blog.id, title: blog.title, image_url: blog.image_url });
        continue;
      }

      try {
        const imageUrl = await generateBlogImage(blog.prompt || blog.title, apiKey);
        await updateBlogImage(c, blog.id, imageUrl);
        results.push({ id: blog.id, title: blog.title, image_url: imageUrl });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({ id: blog.id, title: blog.title, image_url: null, error: message });
      }
    }

    const updated = results.filter(r => r.image_url).length;
    const failed = results.filter(r => r.error).length;

    return c.json({ success: true, total: results.length, updated, failed, results });
  } catch (error) {
    console.error('Backfill error:', error);
    return c.json({ error: error instanceof Error ? error.message : 'Backfill failed' }, 500);
  }
}

