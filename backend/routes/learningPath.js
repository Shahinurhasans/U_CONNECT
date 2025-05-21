const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

/**
 * Generate a learning path using OpenAI API
 * POST /api/generate-learning-path
 * Body: { topic: string }
 */
router.post('/generate-learning-path', async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    
    // Get OpenAI API key from environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured in environment variables');
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }
    
    // Create the prompt for OpenAI
    const prompt = generateOpenAIPrompt(topic);
    
    // Call OpenAI API
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates structured learning paths with emojis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );
    
    // Extract the learning path from the response
    const learningPath = response.data.choices[0].message.content;
    
    // Return the learning path
    return res.json({ learningPath });
  } catch (error) {
    console.error('Error generating learning path:', error);
    return res.status(500).json({ 
      error: 'Failed to generate learning path',
      message: error.message
    });
  }
});

/**
 * Generate the prompt for OpenAI
 * @param {string} topic - The topic to generate a learning path for
 * @returns {string} - The prompt for OpenAI
 */
function generateOpenAIPrompt(topic) {
  return `Create a detailed learning path for someone who wants to learn ${topic}. 
  Format the response exactly as follows with emojis and clear structure:

  🧭 ${topic} Learning Path

  ✅ Stage 1: Foundations (Beginner)
  🎯 Goal: [Brief description of beginner goal]
  📚 Learn:
  - [Key concept 1]
  - [Key concept 2]
  - [Key concept 3]
  - [Key concept 4]

  🛠 Tools:
  - [Tool/resource 1]
  - [Tool/resource 2]
  - [Tool/resource 3]

  📈 Milestone:
  [Specific achievement for this stage]

  ✅ Stage 2: Intermediate Skills (Junior Level)
  🎯 Goal: [Brief description of intermediate goal]
  📚 Learn:
  - [Key concept 1]
  - [Key concept 2]
  - [Key concept 3]
  - [Key concept 4]

  🛠 Tools:
  - [Tool/resource 1]
  - [Tool/resource 2]
  - [Tool/resource 3]

  📈 Milestone:
  [Specific achievement for this stage]

  ✅ Stage 3: Advanced Expertise (Mid-level)
  🎯 Goal: [Brief description of advanced goal]
  📚 Learn:
  - [Key concept 1]
  - [Key concept 2]
  - [Key concept 3]
  - [Key concept 4]

  🛠 Tools:
  - [Tool/resource 1]
  - [Tool/resource 2]
  - [Tool/resource 3]

  📈 Milestone:
  [Specific achievement for this stage]`;
}

module.exports = router;
