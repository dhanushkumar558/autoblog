import { Context } from 'hono';
import { getBlogs, getBlogBySlug } from '../lib/db';
import { GLOBAL_CSS } from '../constants';

const HOME_CSS = `
  @keyframes float { 0%,100%{transform:translateY(0)} 33%{transform:translateY(-20px) rotate(2deg)} 66%{transform:translateY(10px) rotate(-1deg)} }
  @keyframes pulse-glow { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)} 50%{box-shadow:0 0 40px rgba(139,92,246,0.5)} }
  @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes blob-move { 0%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} 25%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%} 50%{border-radius:50% 60% 30% 60%/30% 60% 70% 40%} 75%{border-radius:60% 40% 70% 30%/70% 40% 60% 30%} 100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%} }
  .animate-float{animation:float 6s ease-in-out infinite}
  .animate-pulse-glow{animation:pulse-glow 3s ease-in-out infinite}
  .animate-gradient-shift{background-size:200% 200%;animation:gradient-shift 5s ease infinite}
  .animate-slide-up{animation:slide-up 0.6s ease-out forwards}
  .blob-1{animation:blob-move 8s ease-in-out infinite}
  .blob-2{animation:blob-move 10s ease-in-out infinite reverse}
  .blob-3{animation:blob-move 12s ease-in-out infinite}
  .hero-gradient{background:linear-gradient(135deg,#667eea,#764ba2,#f093fb,#f5576c,#4facfe);background-size:400% 400%;animation:gradient-shift 8s ease infinite}
  .card-hover{transition:all 0.4s cubic-bezier(0.175,0.885,0.32,1.275)}
  .card-hover:hover{transform:translateY(-8px) scale(1.02);box-shadow:0 20px 60px -15px rgba(99,102,241,0.3)}
  .text-gradient{background:linear-gradient(135deg,#667eea,#764ba2,#f093fb,#f5576c);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:gradient-shift 4s ease infinite}
  .glass{background:rgba(255,255,255,0.7);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
  .nav-link{position:relative}
  .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:2px;background:linear-gradient(90deg,#667eea,#f093fb);transition:width 0.3s ease}
  .nav-link:hover::after{width:100%}
  .blob-decoration{position:absolute;width:400px;height:400px;opacity:0.15;filter:blur(80px)}
`;

const BLOG_CSS = `
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
`;

function StyleBlock(css: string) {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {StyleBlock(HOME_CSS)}
        {StyleBlock(GLOBAL_CSS)}
      </head>
      <body class="min-h-screen font-sans antialiased bg-[#0a0a1a] text-white">
        <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div class="blob-decoration blob-1 bg-blue-500 top-[-10%] left-[-10%]"></div>
          <div class="blob-decoration blob-2 bg-purple-500 top-[20%] right-[-10%]"></div>
          <div class="blob-decoration blob-3 bg-pink-500 bottom-[10%] left-[20%]"></div>
          <div class="blob-decoration blob-1 bg-indigo-500 top-[50%] right-[30%]" style={{ width:300, height:300, opacity:0.08 }}></div>
        </div>

        <header class="glass sticky top-0 z-50 border-b border-white/10">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16 sm:h-20">
              <a href="/" class="flex items-center gap-3 group">
                <div class="w-10 h-10 hero-gradient rounded-xl flex items-center justify-center animate-pulse-glow">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span class="text-xl sm:text-2xl font-bold text-gradient font-space">Auto Blog</span>
              </a>
              <nav class="flex items-center gap-2">
                <a href="/admin" class="nav-link text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-all duration-300 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </a>
              </nav>
            </div>
          </div>
        </header>

        <section class="relative z-10 overflow-hidden">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
            <div class="text-center max-w-4xl mx-auto">
              <div class="inline-flex items-center px-5 py-2 rounded-full bg-white/10 border border-white/20 mb-8 backdrop-blur-sm animate-slide-up">
                <span class="text-xs font-semibold text-purple-300 tracking-wider uppercase">✨ Powered by Advanced AI</span>
              </div>
              <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1] animate-slide-up" style={{ animationDelay:'0.1s' }}>
                <span class="text-gradient font-space">Stunning</span> Blogs,
                <br />
                <span class="text-white">Instantly</span>
              </h1>
              <p class="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay:'0.2s' }}>
                High-quality, well-researched blog posts generated with cutting-edge AI technology. Publish in seconds, not hours.
              </p>
              <div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay:'0.3s' }}>
                <a href="/admin/new" class="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 text-sm tracking-wide animate-pulse-glow">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Blog
                </a>
                <a href="/" class="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 text-sm tracking-wide backdrop-blur-sm">
                  Browse All Posts
                </a>
              </div>
              <div class="flex items-center justify-center gap-8 mt-12 animate-slide-up" style={{ animationDelay:'0.4s' }}>
                <div class="text-center"><p class="text-2xl font-bold text-white">AI-Powered</p><p class="text-xs text-gray-500 mt-1">Smart Content</p></div>
                <div class="w-px h-10 bg-white/10"></div>
                <div class="text-center"><p class="text-2xl font-bold text-white">Instant</p><p class="text-xs text-gray-500 mt-1">Fast Delivery</p></div>
                <div class="w-px h-10 bg-white/10"></div>
                <div class="text-center"><p class="text-2xl font-bold text-white">Free</p><p class="text-xs text-gray-500 mt-1">Open Source</p></div>
              </div>
            </div>
          </div>
        </section>

        <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {publishedBlogs.length === 0 ? (
            <div class="text-center py-24">
              <div class="mx-auto h-32 w-32 text-gray-600 mb-8 animate-float">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" class="h-full w-full">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12m-3.75.75h9.75m-9.75 0V19.5m9.75-3v3.75" />
                </svg>
              </div>
              <h2 class="text-3xl font-bold text-white mb-3">No blog posts yet</h2>
              <p class="text-gray-500 text-lg mb-8">Check back soon or create your first blog post!</p>
              <a href="/admin/new" class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all">
                Create Your First Blog
              </a>
            </div>
          ) : (
            <>
              <div class="flex items-center justify-between mb-10">
                <div><h2 class="text-3xl font-bold text-white font-space">Latest Articles</h2><p class="text-gray-500 mt-1">Fresh content powered by AI</p></div>
                <div class="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <span class="text-sm text-gray-400">{publishedBlogs.length} posts</span>
                  <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {publishedBlogs.map((blog, i) => (
                  <article key={blog.id} class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-all duration-500 hover:bg-white/10 hover:border-white/20 hover:-translate-y-2 card-hover animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                    <a href={`/blog/${blog.slug}`} class="block">
                      <div class="relative overflow-hidden h-56">
                        {blog.image_url ? (
                          <img src={blog.image_url} alt={blog.title} class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div class="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <svg class="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div class="absolute top-4 left-4"><span class="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold rounded-full backdrop-blur-sm">AI Generated</span></div>
                      </div>
                      <div class="p-6 flex-1 flex flex-col">
                        <h2 class="text-xl font-bold text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300 line-clamp-2">{blog.title}</h2>
                        <p class="text-gray-400 mb-4 flex-1 line-clamp-3 leading-relaxed text-sm">{blog.excerpt}</p>
                        <div class="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
                          <time class="text-sm text-gray-500">{new Date(blog.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</time>
                          <span class="text-blue-400 font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all duration-300">Read more <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></span>
                        </div>
                      </div>
                    </a>
                  </article>
                ))}
              </div>
            </>
          )}
        </main>

        <footer class="relative z-10 border-t border-white/5 mt-20">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                <span class="text-sm font-bold text-gradient font-space">Auto Blog Generator</span>
              </div>
              <p class="text-gray-500 text-sm">Powered by AI. Crafted with precision.</p>
            </div>
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
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
          {StyleBlock(BLOG_CSS)}
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
                <a href="/" class="flex items-center gap-3 group"><div class="w-8 h-8 hero-gradient rounded-lg flex items-center justify-center"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div><span class="text-lg font-bold text-gradient font-space">Auto Blog</span></a>
                <a href="/" class="text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">← Back to Home</a>
              </div>
            </div>
          </header>
          <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <div class="text-center mb-12">
              <div class="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 mb-4"><span class="text-xs font-semibold text-purple-300">Published</span></div>
              <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 font-space leading-tight">Page Not Found</h1>
              <div class="flex items-center justify-center gap-4 text-sm text-gray-500 mt-4"><span class="w-1 h-1 bg-gray-600 rounded-full"></span><span>The blog post doesn't exist</span></div>
            </div>
            <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10 text-center"><div class="prose prose-lg max-w-none"><p class="text-gray-400">The blog post you're looking for doesn't exist or hasn't been published yet.</p><a href="/" class="text-blue-400 hover:text-blue-300">Go back home</a></div></div>
          </main>
          <footer class="border-t border-white/5 mt-16"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div class="flex flex-col sm:flex-row items-center justify-between gap-4"><div class="flex items-center gap-2"><div class="w-6 h-6 hero-gradient rounded flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div><span class="text-sm font-bold text-gradient">Auto Blog Generator</span></div><p class="text-gray-500 text-sm">Powered by AI. Crafted with precision.</p></div></div></footer>
        </body>
      </html>
    );
  }

  const post = blog!;
  const tocItems = post.toc_html ? post.toc_html.match(/<li[^>]*>.*?<\/li>/gi) || [] : [];

  return c.render(
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{post.title} - Auto Blog Generator</title>
        <meta name="description" content={post.excerpt} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {StyleBlock(BLOG_CSS)}
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
              <a href="/" class="text-sm font-medium text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">← Back to Home</a>
            </div>
          </div>
        </header>
        <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <article class="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div class="flex-1 min-w-0">
              <header class="mb-8">
                <div class="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 mb-4"><span class="text-xs font-semibold text-purple-300">Published</span></div>
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4 font-space leading-tight">{post.title}</h1>
                <div class="flex items-center gap-4 text-sm text-gray-500"><time>{new Date(post.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</time><span class="w-1 h-1 bg-gray-600 rounded-full"></span><span>{tocItems.length} min read</span></div>
              </header>
              {post.image_url && <div class="mb-8 relative rounded-2xl overflow-hidden border border-white/10"><img src={post.image_url} alt={post.title} class="w-full h-64 sm:h-80 lg:h-96 object-cover" /><div class="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-transparent to-transparent"></div></div>}
              {post.toc_html && <details class="mb-8 lg:hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5"><summary class="font-semibold text-white cursor-pointer flex items-center gap-2"><svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>Table of Contents</summary><div dangerouslySetInnerHTML={{ __html: post.toc_html }} /></details>}
              <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10"><div class="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content_html }} /></div>
            </div>
            {post.toc_html && <aside class="hidden lg:block w-72 flex-shrink-0"><div class="sticky top-24"><div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"><h3 class="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2"><svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>Table of Contents</h3><nav dangerouslySetInnerHTML={{ __html: post.toc_html }} /></div></div></aside>}
          </article>
        </main>
        <footer class="border-t border-white/5 mt-16"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"><div class="flex flex-col sm:flex-row items-center justify-between gap-4"><div class="flex items-center gap-2"><div class="w-6 h-6 hero-gradient rounded flex items-center justify-center"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div><span class="text-sm font-bold text-gradient">Auto Blog Generator</span></div><p class="text-gray-500 text-sm">Powered by AI. Crafted with precision.</p></div></div></footer>
      </body>
    </html>
  );
}
