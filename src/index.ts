import { Hono } from 'hono';
import { adminDashboard, newBlogForm, loginForm } from './routes/admin';
import { homePage, blogPost } from './routes/blog';
import { generateBlogHandler, loginHandler, logoutHandler, deleteBlogHandler, backfillImagesHandler } from './routes/api';
import { authMiddleware } from './middleware/auth';

type Bindings = {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  ADMIN_SECRET: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', homePage);

app.get('/blog/:slug', blogPost);

app.get('/admin/login', (c) => loginForm(c));

app.post('/admin/login', loginHandler);

app.get('/admin/logout', logoutHandler);

const adminRoutes = new Hono();
adminRoutes.use('*', authMiddleware);
adminRoutes.get('/', adminDashboard);
adminRoutes.get('/new', newBlogForm);
adminRoutes.post('/generate', generateBlogHandler);
adminRoutes.post('/delete/:id', deleteBlogHandler);
adminRoutes.post('/backfill-images', backfillImagesHandler);
app.route('/admin', adminRoutes);

export default app;
