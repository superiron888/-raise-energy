// api/quote.js

// 简单内存速率限制（每IP每分钟最多10次）
const rateLimitMap = new Map();
const RATE_LIMIT = 10; // 每分钟最多10次
const WINDOW_MS = 60 * 1000; // 1分钟

function isRateLimited(ip) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  const data = rateLimitMap.get(ip);
  if (now - data.start > WINDOW_MS) {
    // 窗口过期，重置
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  if (data.count >= RATE_LIMIT) {
    return true;
  }
  data.count++;
  return false;
}

export default async function handler(req, res) {
  // 获取IP
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Too Many Requests. Please try again later.' });
    return;
  }

  const { region } = req.query;
  let prompt = 'Generate an inspirational quote.';
  // 多国语言支持
  if (region === 'china') prompt = '请生成一句中国文化风格的励志语录，可以是名人名言、谚语、诗句等。';
  else if (region === 'europe') prompt = 'Please generate an inspirational quote in the style of Western culture, such as a famous saying, proverb, or a line from literature or movies.';
  else if (region === 'japan') prompt = '日本や韩国の文化風の、心に響く一言（名言、諺、文学や映画の台詞など）を生成してください。';
  else if (region === 'indonesia') prompt = 'Tolong buatkan satu kutipan motivasi atau inspirasi dalam gaya budaya Indonesia, bisa berupa pepatah, kutipan tokoh, atau kalimat dari buku/film.';
  else if (region === 'france') prompt = 'Veuillez générer une citation inspirante dans le style de la culture française, telle qu’un proverbe, une citation littéraire ou cinématographique.';
  else if (region === 'germany') prompt = 'Bitte generieren Sie ein inspirierendes Zitat im Stil der deutschen Kultur, z.B. ein Sprichwort, ein berühmtes Zitat oder ein Satz aus Literatur oder Film.';
  else if (region === 'spain') prompt = 'Por favor, genera una cita inspiradora al estilo de la cultura española, como un refrán, una cita famosa o una frase de literatura o cine.';
  else if (region === 'russia') prompt = 'Пожалуйста, сгенерируйте вдохновляющую цитату в стиле русской культуры: пословица, известное высказывание или фраза из литературы или кино.';
  // 你可以继续添加更多语言...

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 60,
      temperature: 0.8
    })
  });
  const data = await response.json();
  res.status(200).json({ quote: data.choices?.[0]?.message?.content?.trim() });
}
