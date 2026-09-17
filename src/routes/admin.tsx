import { Context } from 'hono';
import { getBlogs, createBlog, deleteBlog, getSetting, setSetting } from '../lib/db';
import { generateBlogContent } from '../lib/ai';
import { processMarkdown, generateSlug } from '../lib/markdown';
import { GLOBAL_CSS } from '../constants';
import { authMiddleware } from '../middleware/auth';

const ADMIN_CSS = `
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  .text-gradient{background:linear-gradient(135deg,#667eea,#764ba2,#f093fb,#f5576c);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradient-shift 4s ease infinite}
  .animate-float{animation:float 3s ease-in-out infinite}
  .prose h2{color:#fff!important;border-bottom-color:rgba(255,255,255,0.1)!important}
  .prose h3{color:#e0e0ff!important}
  .prose p{color:#b0b0cc!important}
  .prose a{color:#818cf8!important}
  .prose code{background:rgba(255,255,255,0.1)!important;color:#e0e0ff!important}
  .prose pre{background:#1a1a2e!important}
  .prose blockquote{border-left-color:#818cf8!important;color:#b0b0cc!important}
  .prose strong{color:#fff!important}
  .stat-card{transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)}
  .stat-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px -10px rgba(99,102,241,0.3)}
  .table-row{transition:all 0.2s ease}
  .table-row:hover{background:rgba(255,255,255,0.05)}
`;

function StyleBlock(css: string) {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export async function adminDashboard(c: Context) {
  const blogs = await getBlogs(c);
  const publishedBlogs = blogs.filter(b => b.status === 'published');
  const draftBlogs = blogs.filter(b => b.status !== 'published');

  return c.render(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Admin Dashboard - Auto Blog Generator</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {StyleBlock(ADMIN_CSS)}
        {StyleBlock(GLOBAL_CSS)}
      </head>
      <body class="min-h-screen font-sans antialiased bg-[#0a0a1a] text-white">
        <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div class="blob-decoration blob-1 bg-blue-500 top-[-10%] left-[-10%]" style={{ width:300, height:300, opacity:0.06 }}></div>
          <div class="blob-decoration blob-2 bg-purple-500 top-[20%] right-[-10%]" style={{ width:300, height:300, opacity:0.06 }}></div>
        </div>

        <header class="glass sticky top-0 z-50 border-b border-white/10">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 hero-gradient rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span class="text-lg font-bold text-gradient font-space">Admin Panel</span>
              </div>
              <div class="flex items-center gap-2">
                <a href="/admin/new" class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                  <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New
                </a>
                <button id="backfillBtn" class="inline-flex items-center px-4 py-2 bg-white/10 text-white text-sm font-semibold rounded-lg border border-white/10 hover:bg-white/20 transition-all">
                  <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Backfill
                </button>
                <a href="/" class="inline-flex items-center px-4 py-2 bg-white/5 text-gray-300 text-sm font-medium rounded-lg border border-white/10 hover:bg-white/10 transition-all">
                  View Site
                </a>
                <form method="post" action="/admin/logout">
                  <button type="submit" class="inline-flex items-center px-4 py-2 bg-red-500/10 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all">
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="mb-8">
            <h1 class="text-3xl font-black text-white font-space">Dashboard</h1>
            <p class="text-gray-400 mt-1">Overview of your blog content and performance</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="stat-card bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-400">Total Posts</p>
                  <p class="text-3xl font-black text-white mt-1">{blogs.length}</p>
                </div>
                <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="stat-card bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-400">Published</p>
                  <p class="text-3xl font-black text-green-400 mt-1">{publishedBlogs.length}</p>
                </div>
                <div class="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="stat-card bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-400">Drafts</p>
                  <p class="text-3xl font-black text-yellow-400 mt-1">{draftBlogs.length}</p>
                </div>
                <div class="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div class="stat-card bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-400">With Images</p>
                  <p class="text-3xl font-black text-purple-400 mt-1">{blogs.filter(b => b.image_url).length}</p>
                </div>
                <div class="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 class="font-bold text-white font-space">All Posts</h2>
              <span class="text-sm text-gray-400">{blogs.length} total</span>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-white/5">
                <thead class="bg-white/5">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Image</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                    <th class="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  {blogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} class="px-6 py-16 text-center">
                        <div class="mx-auto h-20 w-20 text-gray-600 mb-4">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" class="h-full w-full">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <p class="text-gray-400 font-medium">No blog posts yet</p>
                        <p class="text-gray-500 text-sm mt-1">Create your first blog to get started</p>
                        <a href="/admin/new" class="mt-3 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                          Create Blog
                        </a>
                      </td>
                    </tr>
                  ) : (
                    blogs.map(blog => (
                      <tr key={blog.id} class="table-row">
                        <td class="px-6 py-4">
                          {blog.image_url ? (
                            <img src={blog.image_url} alt={blog.title} class="h-10 w-16 object-cover rounded-lg border border-white/10" />
                          ) : (
                            <div class="h-10 w-16 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </td>
                        <td class="px-6 py-4">
                          <div class="text-sm font-semibold text-white max-w-xs truncate">{blog.title}</div>
                          <div class="text-xs text-gray-500 mt-0.5">/{blog.slug}</div>
                        </td>
                        <td class="px-6 py-4">
                          <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${blog.status === 'published' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                            {blog.status === 'published' ? (
                              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                            {blog.status}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-400">
                          {new Date(blog.created_at).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })}
                        </td>
                        <td class="px-6 py-4 text-right">
                          <div class="flex items-center justify-end gap-2">
                            <a href={`/blog/${blog.slug}`} class="text-blue-400 hover:text-blue-300 text-sm font-medium px-2 py-1 rounded hover:bg-blue-500/10 transition-colors">View</a>
                            <a href={`/admin/new?edit=${blog.id}`} class="text-gray-400 hover:text-white text-sm font-medium px-2 py-1 rounded hover:bg-white/5 transition-colors">Edit</a>
                            <form method="post" action={`/admin/delete/${blog.id}`} class="inline" onsubmit="return confirm('Delete this blog?')">
                              <button type="submit" class="text-red-400 hover:text-red-300 text-sm font-medium px-2 py-1 rounded hover:bg-red-500/10 transition-colors">Delete</button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <script>
          {`
            document.getElementById('backfillBtn')?.addEventListener('click', async () => {
              const btn = document.getElementById('backfillBtn');
              if (!btn || btn.disabled) return;
              btn.disabled = true;
              btn.innerHTML = '<svg class="w-4 h-4 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Backfilling...';
              try {
                const response = await fetch('/admin/backfill-images', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
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
                btn.innerHTML = '<svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> Backfill';
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
        <title>Create Blog - Auto Blog Generator</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {StyleBlock(ADMIN_CSS)}
        {StyleBlock(GLOBAL_CSS)}
      </head>
      <body class="min-h-screen font-sans antialiased bg-[#0a0a1a] text-white">
        <header class="glass sticky top-0 z-50 border-b border-white/10">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 hero-gradient rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span class="text-lg font-bold text-gradient font-space">Admin Panel</span>
              </div>
              <a href="/admin" class="text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">← Dashboard</a>
            </div>
          </div>
        </header>

        <main class="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <div class="mb-8">
            <div class="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 mb-4">
              <span class="text-xs font-semibold text-purple-300">Create New</span>
            </div>
            <h1 class="text-3xl font-black text-white font-space">Create New Blog</h1>
            <p class="text-gray-400 mt-2">Enter a topic or prompt and AI will generate a professional blog post with an accompanying image.</p>
          </div>

          <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
            <form id="blogForm" method="post" action="/admin/generate">
              <div class="mb-6">
                <label for="prompt" class="block text-sm font-semibold text-gray-300 mb-2">Blog Topic / Prompt</label>
                <textarea
                  id="prompt"
                  name="prompt"
                  rows={4}
                  class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-white placeholder-gray-500"
                  placeholder="e.g., The Future of Artificial Intelligence in Healthcare"
                  required
                />
              </div>
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-300 mb-2">AI Model</label>
                <select name="model" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-white bg-[#0a0a1a]">
                  <option value="deepseek/deepseek-v4-flash-0731" selected>DeepSeek V4 Flash (Default)</option>
                  <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B</option>
                  <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                </select>
              </div>
              <button
                type="submit"
                id="submitBtn"
                class="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 font-semibold text-sm flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Generate Blog
              </button>
            </form>
            <div id="loading" class="hidden mt-6">
              <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
                <div class="flex items-center">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-3"></div>
                  <div>
                    <p class="text-blue-300 font-semibold text-sm">Generating your blog post...</p>
                    <p class="text-blue-400 text-xs mt-0.5">This may take 10-30 seconds. Please don't close this page.</p>
                  </div>
                </div>
              </div>
            </div>
            <div id="error" class="hidden mt-6">
              <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p class="text-red-300 font-medium text-sm" id="errorMsg"></p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <script>
          {`
            document.getElementById('blogForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const btn = document.getElementById('submitBtn');
              const loading = document.getElementById('loading');
              const error = document.getElementById('error');
              btn.disabled = true;
              btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...';
              loading.classList.remove('hidden');
              error.classList.add('hidden');
              try {
                const formData = new FormData(e.target);
                const response = await fetch('/admin/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: formData.get('prompt'), model: formData.get('model') }) });
                if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to generate blog'); }
                window.location.href = '/admin';
              } catch (err) {
                document.getElementById('errorMsg').textContent = err.message;
                error.classList.remove('hidden');
              } finally {
                btn.disabled = false;
                btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Generate Blog';
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {StyleBlock(GLOBAL_CSS)}
      </head>
      <body class="min-h-screen font-sans antialiased bg-[#0a0a1a] text-white">
        <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div class="blob-decoration blob-1 bg-blue-500 top-[-10%] left-[-10%]" style={{ width:300, height:300, opacity:0.06 }}></div>
          <div class="blob-decoration blob-2 bg-purple-500 top-[20%] right-[-10%]" style={{ width:300, height:300, opacity:0.06 }}></div>
          <div class="blob-decoration blob-3 bg-pink-500 bottom-[10%] left-[20%]" style={{ width:200, height:200, opacity:0.04 }}></div>
        </div>
        <header class="glass sticky top-0 z-50 border-b border-white/10">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
              <a href="/" class="flex items-center gap-3 group"><div class="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div><span class="text-lg font-bold text-gradient font-space">Auto Blog</span></a>
            </div>
          </div>
        </header>
        <main class="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
          <div class="max-w-md w-full">
            <div class="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8 sm:p-10">
              <div class="text-center mb-8">
                <div class="w-16 h-16 hero-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25 animate-float">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h1 class="text-2xl font-bold text-white">Welcome Back</h1>
                <p class="text-gray-400 text-sm mt-1">Sign in to access the admin panel</p>
              </div>
              {error && (
                <div class="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p class="text-red-300 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}
              <form method="post" action="/admin/login">
                <div class="mb-5">
                  <label for="password" class="block text-sm font-semibold text-gray-300 mb-2">Password</label>
                  <div class="relative">
                    <input type="password" id="password" name="password" class="w-full px-4 py-3 pl-11 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-white placeholder-gray-500" placeholder="Enter your password" required autofocus />
                    <svg class="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                </div>
                <button type="submit" class="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3.5 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 font-semibold text-sm flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                  Sign In
                </button>
              </form>
              <div class="mt-6 pt-6 border-t border-white/10 text-center">
                <p class="text-xs text-gray-500">Protected by HMAC authentication</p>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
