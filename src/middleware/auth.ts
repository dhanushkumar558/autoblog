import { Context, Next } from 'hono';

export async function authMiddleware(c: Context, next: Next) {
  const session = c.req.header('cookie')?.match(/session=([^;]+)/)?.[1];
  if (!session) {
    return c.redirect('/admin/login');
  }
  
  const [data, sig] = session.split(':');
  if (!data || !sig) {
    return c.redirect('/admin/login');
  }
  
  const expectedSig = await sign(c, data);
  if (sig !== expectedSig) {
    return c.redirect('/admin/login');
  }
  
  const timestamp = parseInt(data, 10);
  if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
    return c.redirect('/admin/login');
  }
  
  await next();
}

async function sign(c: Context, data: string): Promise<string> {
  const key = new TextEncoder().encode(c.env.ADMIN_SECRET as string);
  const signature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    new TextEncoder().encode(data)
  );
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
