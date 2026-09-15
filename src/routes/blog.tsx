import { Context } from 'hono';
import { getBlogs, getBlogBySlug } from '../lib/db';
import { GLOBAL_CSS } from '../constants';

export async function homePage(c: Context) {
  const blogs = await getBlogs(c);
  const publishedBlogs = blogs.filter(b => b.status === 'published');

  return c.render(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Auto Blog Generator</title>
        <meta name="description" content="Professional AI-generated blog posts" />
        <style>{GLOBAL_CSS}</style>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <header class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex justify-between items-center">
              <a href="/" class="text-2xl font-bold text-gray-900">Auto Blog</a>
            </div>
          </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div class="text-center mb-12">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">Professional AI-Generated Blogs</h1>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              High-quality, well-researched blog posts generated with advanced AI technology.
            </p>
          </div>

          {publishedBlogs.length === 0 ? (
            <div class="text-center py-12">
              <p class="text-gray-500 text-lg">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedBlogs.map(blog => (
                <article key={blog.id} class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                  {blog.image_url && (
                    <div class="w-full h-48 overflow-hidden">
                      <img src={blog.image_url} alt={blog.title} class="w-full h-full object-cover" />
                    </div>
                  )}
                  <div class="p-6 flex-1 flex flex-col">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">
                      <a href={`/blog/${blog.slug}`} class="hover:text-blue-600 transition-colors">
                        {blog.title}
                      </a>
                    </h2>
                    <p class="text-gray-600 mb-4 flex-1 line-clamp-3">
                      {blog.excerpt}
                    </p>
                    <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <time class="text-sm text-gray-500">
                        {new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </time>
                      <a href={`/blog/${blog.slug}`} class="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        Read more &rarr;
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <footer class="bg-gray-900 text-white py-8 mt-12">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p class="text-gray-400">Auto Blog Generator. Powered by AI.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

export async function blogPost(c: Context) {
  const slug = c.req.param('slug');
  if (!slug) return c.notFound();
  const blog = await getBlogBySlug(c, slug);
  
  if (!blog || blog.status !== 'published') {
    c.status(404);
    return c.html(
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Not Found - Auto Blog Generator</title>
          <style>{GLOBAL_CSS}</style>
        </head>
        <body class="bg-gray-50 min-h-screen flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p class="text-gray-600 mb-6">Blog post not found</p>
            <a href="/" class="text-blue-600 hover:text-blue-800 font-medium">Go back home</a>
          </div>
        </body>
      </html>
    );
  }

  const tocItems = blog.toc_html ? blog.toc_html.match(/<li[^>]*>.*?<\/li>/gi) || [] : [];

  return c.render(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{blog.title} - Auto Blog Generator</title>
        <meta name="description" content={blog.excerpt} />
        <style>{GLOBAL_CSS}</style>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <header class="bg-white shadow-sm">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex justify-between items-center">
              <a href="/" class="text-xl font-bold text-gray-900">Auto Blog</a>
            </div>
          </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <article class="flex gap-8">
            <div class="flex-1 min-w-0">
              <header class="mb-8">
                <h1 class="text-4xl font-bold text-gray-900 mb-4">{blog.title}</h1>
                <time class="text-gray-500">
                  {new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              </header>

              {blog.image_url && (
                <div class="mb-8">
                  <img src={blog.image_url} alt={blog.title} class="w-full max-h-96 object-cover rounded-lg shadow-sm" />
                </div>
              )}

              {blog.toc_html && (
                <details class="mb-8 bg-white rounded-lg shadow-sm p-4 md:hidden">
                  <summary class="font-semibold text-gray-900 cursor-pointer">Table of Contents</summary>
                  <div class="mt-4 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.toc_html }} />
                </details>
              )}

              <div class="bg-white rounded-lg shadow-sm p-6 md:p-10">
                 <div class="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: blog.content_html }} />
              </div>
            </div>

            {blog.toc_html && (
              <aside class="hidden lg:block w-64 flex-shrink-0">
                <div class="sticky top-8">
                  <div class="bg-white rounded-lg shadow-sm p-6">
                    <h3 class="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Table of Contents</h3>
                    <nav class="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: blog.toc_html }} />
                  </div>
                </div>
              </aside>
            )}
          </article>
        </main>

        <footer class="bg-gray-900 text-white py-8 mt-12">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p class="text-gray-400">Auto Blog Generator. Powered by AI.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
