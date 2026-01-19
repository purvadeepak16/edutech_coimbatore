import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/generate", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    const prompt = `
Create a structured mind map for "${topic}".

Return ONLY valid JSON in this format:
{
  "center": "Topic",
  "branches": [
    {
      "title": "Branch Name",
      "children": ["Subtopic 1", "Subtopic 2"]
    }
  ]
}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const json = JSON.parse(content);

    res.json(json);
  } catch (err) {
    console.error("Mind map error:", err.message);
    res.status(500).json({ error: "Failed to generate mind map" });
  }
});

export default router;
