export async function generateBlogImage(prompt: string, apiKey: string, model = 'black-forest-labs/flux.2-klein-4b'): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://auto-blog-generator.workers.dev',
      'X-Title': 'Auto Blog Generator',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: `Create 1 high-quality generic blog header image for a blog post about: ${prompt}. STRICT REQUIREMENTS: NO TEXT, NO LETTERS, NO WORDS, NO DASHBOARD, NO UI, NO SCREENSHOT, NO WATERMARK, NO LOGO. Style: photorealistic or high-quality 3D render, clean composition, soft lighting, suitable as a professional article cover.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter image API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string; images?: any[]; image_url?: { url?: string } } }> };
  const message = data?.choices?.[0]?.message || {};
  const content = typeof message?.content === 'string' ? message.content : '';
  const firstImage = Array.isArray(message?.images) ? message.images[0] : undefined;
  const imageUrl = firstImage?.image_url?.url || message?.image_url?.url || content || '';

  const urlMatch = imageUrl.match(/https?:\/\/[^\s\)]+/);
  const dataMatch = imageUrl.match(/data:image\/[^;]+;base64,[^\s\)]+/);
  const finalUrl = urlMatch?.[0] || dataMatch?.[0] || '';

  if (!finalUrl) {
    throw new Error(`No image URL returned from AI. Response snippet: ${content.slice(0, 200)}`);
  }

  return finalUrl;
}

export async function generateBlogContent(prompt: string, apiKey: string, model = 'deepseek/deepseek-chat'): Promise<{ title: string; excerpt: string; content: string }> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://auto-blog-generator.workers.dev',
      'X-Title': 'Auto Blog Generator',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a professional blog writer. Generate a comprehensive, well-structured blog post based on the user's prompt.

Guidelines:
- Start with a clear, compelling title as an H1 heading (# Title)
- Follow with a brief introduction paragraph
- Use ## for main sections and ### for subsections
- Include practical examples, bullet points, and numbered lists where appropriate
- End with a conclusion
- Write in a professional yet engaging tone
- Aim for 800-1500 words
- Do NOT include a table of contents in the content

Output only the blog post content, starting with the title as # Title.`,
        },
        {
          role: 'user',
          content: `Write a professional blog post about: ${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  const content = data.choices[0]?.message?.content || '';
  
  if (!content) {
    throw new Error('Empty response from AI');
  }

  const lines = content.split('\n');
  let title = '';
  let contentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('# ')) {
      title = trimmed.replace(/^#+\s*/, '');
      contentStart = i + 1;
      break;
    }
  }

  if (!title) {
    title = prompt.split('.')[0].substring(0, 60);
  }

  const contentBody = lines.slice(contentStart).join('\n').trim();
  
  const excerptMatch = contentBody.match(/<p[^>]*>(.*?)<\/p>/is) || contentBody.match(/^(.*?)(?:\n\n|\r\n\r\n)/s);
  const excerpt = excerptMatch 
    ? excerptMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 200)
    : contentBody.replace(/<[^>]+>/g, '').trim().substring(0, 200);

  return {
    title,
    excerpt,
    content: contentBody,
  };
}
