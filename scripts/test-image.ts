export async function testImage() {
  const apiKey = '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';
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://auto-blog-generator.workers.dev',
      'X-Title': 'Auto Blog Generator',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/flux.2-klein-4b',
      messages: [
        {
          role: 'user',
          content: 'Generate a high-quality, professional blog header image for a blog post about: artificial intelligence trends. Make it visually appealing and relevant.',
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', text.slice(0, 2000));
}

testImage();
