const express = require('express');
const axios = require('axios');
const http = require('http');
const { randomInt } = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use("/", express.static("./public"))

app.post('/generate-password', async (req, res) => {
  const { 
    length = 12, 
    useSpecialChars = true, 
    useUppercase = true 
  } = req.body;

  if (isNaN(length) || length < 4 || length > 100) {
    return res.status(400).json({ 
      error: 'Length must be between 4 and 100' 
    });
  }

  const requirements = [];
  if (useUppercase) requirements.push('uppercase letters (A-Z)');
  requirements.push('lowercase letters (a-z)');
  requirements.push('numbers (0-9)');
  if (useSpecialChars) requirements.push('symbols (!@#$%^&*)');

  const prompt = `Generate a secure password of exactly ${length} characters with:
    - ${requirements.join('\n    - ')}
    Format: ONLY the password, without quotes, dots or extra text.
    Example: Xya!c365@`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 1.0,
        seed: randomInt(0, 10000),
        max_tokens: 100,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );
    let password = response.data.choices[0].message.content.trim();

    res.json({ password });

  } catch (error) {
    console.error('Generation error:', {
      request: { length, useSpecialChars, useUppercase },
      error: error.response?.data || error.message
    });

    res.status(500).json({ 
      error: "Generation failed",
      details: error.response?.data?.error?.message || error.message 
    });
  }
});

app.post('/analyze-password', async (req, res) => {
  const { password } = req.body;

  if (!password || typeof password !== 'string' || password.length < 4) {
    return res.status(400).json({ error: 'Invalid password' });
  }

  const prompt = `Analyze password security level: "${password}". 
Evaluate: 
1. Length.
2. Use of uppercases and lowercases characters, numbers and special characters..
3. Common vulnerabilities (es. dictionary, brute-force).
4. Score between 1 and 10.
Answer ONLY in JSON format, like:
{
  "length": "...",
  "characters": "...",
  "vulnerabilities": "...",
  "score": number
}`;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const content = response.data.choices[0].message.content.trim();

    try {
      const analysis = JSON.parse(content);
      res.json(analysis);
    } catch (parseError) {
      console.error("Error in JSON parsing:", content);
      res.status(500).json({ error: "Invalid JSON" });
    }
  } catch (error) {
    console.error("Errore OpenAI:", error.response?.data || error.message);
    res.status(500).json({ error: "Error in password analysis" });
  }
});

const PORT = process.env.PORT || 3000;

http.createServer(app).listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
