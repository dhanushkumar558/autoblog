import { Context } from 'hono';
import { getBlogs, createBlog, deleteBlog, getSetting, setSetting } from '../lib/db';
import { generateBlogContent } from '../lib/ai';
import { processMarkdown, generateSlug } from '../lib/markdown';
import { GLOBAL_CSS } from '../constants';
import { authMiddleware } from '../middleware/auth';

export async function adminDashboard(c: Context) {
  const blogs = await getBlogs(c);
  
  return c.render(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Admin - Auto Blog Generator</title>
        <style>{GLOBAL_CSS}</style>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Blog Dashboard</h1>
            <div class="flex gap-3">
              <a href="/admin/new" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                + New Blog
              </a>
              <button id="backfillBtn" class="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                Backfill Images
              </button>
              <a href="/" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                View Site
              </a>
              <form method="post" action="/admin/logout">
                <button type="submit" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Logout
                </button>
              </form>
            </div>
          </div>

          <div class="bg-white shadow rounded-lg overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {blogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} class="px-6 py-12 text-center text-gray-500">
                      No blogs yet. Create your first blog to get started.
                    </td>
                  </tr>
                ) : (
                  blogs.map(blog => (
                    <tr key={blog.id} class="hover:bg-gray-50">
                      <td class="px-6 py-4">
                        {blog.image_url ? (
                          <img src={blog.image_url} alt={blog.title} class="h-12 w-12 object-cover rounded" />
                        ) : (
                          <span class="text-gray-400 text-sm">No image</span>
                        )}
                      </td>
                      <td class="px-6 py-4">
                        <div class="text-sm font-medium text-gray-900">{blog.title}</div>
                        <div class="text-sm text-gray-500">/{blog.slug}</div>
                      </td>
                      <td class="px-6 py-4">
                        <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${blog.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {blog.status}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-sm text-gray-500">
                        {new Date(blog.created_at).toLocaleDateString()}
                      </td>
                      <td class="px-6 py-4 text-right text-sm font-medium">
                        <a href={`/blog/${blog.slug}`} class="text-blue-600 hover:text-blue-900 mr-4">View</a>
                        <form method="POST" action={`/admin/delete/${blog.id}`} class="inline" onsubmit="return confirm('Delete this blog?')">
                          <button type="submit" class="text-red-600 hover:text-red-900">Delete</button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <script>
          {`
            document.getElementById('backfillBtn')?.addEventListener('click', async () => {
              const btn = document.getElementById('backfillBtn');
              if (!btn || btn.disabled) return;
              
              btn.disabled = true;
              btn.textContent = 'Backfilling...';
              
              try {
                const response = await fetch('/admin/backfill-images', { 
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                });
                const data = await response.json();
                
                if (data.success) {
                  alert('Backfill complete: ' + data.updated + ' images generated, ' + data.failed + ' failed');
                  window.location.reload();
                } else {
                  alert('Error: ' + data.error);
                }
              } catch (err) {
                alert('Error: ' + err.message);
              } finally {
                btn.disabled = false;
                btn.textContent = 'Backfill Images';
              }
            });
          `}
        </script>
      </body>
    </html>
  );
}

export async function newBlogForm(c: Context) {
  return c.render(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>New Blog - Auto Blog Generator</title>
        <style>{GLOBAL_CSS}</style>
      </head>
      <body class="bg-gray-50 min-h-screen">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="mb-8">
            <a href="/admin" class="text-blue-600 hover:text-blue-800 mb-4 inline-block">&larr; Back to Dashboard</a>
            <h1 class="text-3xl font-bold text-gray-900">Create New Blog</h1>
            <p class="mt-2 text-gray-600">Enter a topic or prompt and AI will generate a professional blog post for you.</p>
          </div>

          <div class="bg-white shadow rounded-lg p-6">
            <form id="blogForm" method="post" action="/admin/generate">
              <div class="mb-6">
                <label for="prompt" class="block text-sm font-medium text-gray-700 mb-2">
                  Blog Topic / Prompt
                </label>
                <textarea
                  id="prompt"
                  name="prompt"
                  rows={4}
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., The Future of Artificial Intelligence in Healthcare"
                  required
                />
              </div>

              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  AI Model
                </label>
                <select name="model" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="deepseek/deepseek-v4-flash-0731" selected>DeepSeek V4 Flash (Default)</option>
                  <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B</option>
                  <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                </select>
              </div>

              <button
                type="submit"
                id="submitBtn"
                class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Generate Blog
              </button>
            </form>

            <div id="loading" class="hidden mt-6">
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex items-center">
                  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                  <p class="text-blue-800 font-medium">Generating your blog post... This may take 10-30 seconds.</p>
                </div>
              </div>
            </div>

            <div id="error" class="hidden mt-6">
              <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <p class="text-red-800 font-medium" id="errorMsg"></p>
              </div>
            </div>
          </div>
        </div>

        <script>
          {`
            document.getElementById('blogForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const btn = document.getElementById('submitBtn');
              const loading = document.getElementById('loading');
              const error = document.getElementById('error');
              
              btn.disabled = true;
              btn.textContent = 'Generating...';
              loading.classList.remove('hidden');
              error.classList.add('hidden');
              
              try {
                const formData = new FormData(e.target);
                const response = await fetch('/admin/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    prompt: formData.get('prompt'),
                    model: formData.get('model')
                  })
                });
                
                if (!response.ok) {
                  const data = await response.json();
                  throw new Error(data.error || 'Failed to generate blog');
                }
                
                window.location.href = '/admin';
              } catch (err) {
                document.getElementById('errorMsg').textContent = err.message;
                error.classList.remove('hidden');
              } finally {
                btn.disabled = false;
                btn.textContent = 'Generate Blog';
                loading.classList.add('hidden');
              }
            });
          `}
        </script>
      </body>
    </html>
  );
}

export async function loginForm(c: Context, error?: string) {
  return c.render(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Admin Login - Auto Blog Generator</title>
        <style>{GLOBAL_CSS}</style>
      </head>
      <body class="bg-gray-50 min-h-screen flex items-center justify-center">
        <div class="max-w-md w-full mx-4">
          <div class="bg-white shadow rounded-lg p-8">
            <h1 class="text-2xl font-bold text-gray-900 text-center mb-6">Admin Login</h1>
            
            {error && (
              <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p class="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            <form method="post" action="/admin/login">
              <div class="mb-6">
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autofocus
                />
              </div>
              <button
                type="submit"
                class="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </body>
    </html>
  );
}
