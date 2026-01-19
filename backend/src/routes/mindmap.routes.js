import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/generate", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  try {
    let aiMindMap;
    let aiLearningMap;

    // ---------- AI OR MOCK ----------
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("Using mock AI data");

      aiMindMap = {
        center: topic,
        branches: [
          { title: "Supervised Learning", children: ["Regression", "Classification"] },
          { title: "Unsupervised Learning", children: ["Clustering", "Dimensionality Reduction"] },
          { title: "Reinforcement Learning", children: ["MDP", "Q-Learning"] }
        ]
      };

      aiLearningMap = {
        subject: topic,
        units: [
          { title: "Mathematics", status: "inprogress", progress: "40%", topics: [
            { title: "Linear Algebra", status: "weak", progress: "30%" },
            { title: "Calculus", status: "inprogress", progress: "45%" }
          ] },
          { title: "Master Programming", status: "inprogress", progress: "50%", topics: [
            { title: "Python", status: "inprogress", progress: "50%" },
            { title: "R", status: "locked", progress: "0%" }
          ] },
          { title: "Explore Data", status: "inprogress", progress: "55%", topics: [
            { title: "EDA", status: "inprogress", progress: "55%" },
            { title: "Feature Engineering", status: "weak", progress: "30%" }
          ] },
          { title: "Machine Learning Models", status: "inprogress", progress: "60%", topics: [
            { title: "Regression", status: "mastered", progress: "90%" },
            { title: "Classification", status: "inprogress", progress: "60%" }
          ] },
          { title: "Deep Learning", status: "locked", progress: "0%", topics: [
            { title: "Neural Networks", status: "locked", progress: "0%" }
          ] }
        ]
      };
    } else {
      const prompt = `You are an educational content designer. For the topic "${topic}", produce TWO artifacts in JSON only (no markdown, no commentary):

{
  "mindMap": {
    "center": "${topic}",
    "branches": [
      { "title": "<area>", "children": ["<subtopic>", "<subtopic>"] }
    ]
  },
  "learningMap": {
    "subject": "${topic}",
    "units": [
      { "title": "<stage>", "status": "mastered|inprogress|weak|locked", "progress": "<percent or In Progress>",
        "topics": [ { "title": "<topic>", "status": "mastered|inprogress|weak|locked", "progress": "<percent>" } ] }
    ]
  }
}

Guidelines:
- Ensure valid JSON only.
- If topic is "machine learning", prefer learning stages: ["Mathematics", "Master Programming", "Explore Data", "Machine Learning Models", "Deep Learning"].
- For the mind map, include branches like Supervised Learning, Unsupervised Learning, Reinforcement Learning with 2-4 children each.
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

      let content = response.data.choices?.[0]?.message?.content || "";
      const match = content.match(/```json([\s\S]*?)```/);
      const parsed = JSON.parse(match ? match[1] : content);
      aiMindMap = parsed.mindMap || parsed;
      aiLearningMap = parsed.learningMap;
    }

    // ---------- FINAL RESPONSE (IMPORTANT) ----------
    const finalMindMap = aiMindMap || {
      center: topic,
      branches: [
        { title: "Supervised Learning", children: ["Regression", "Classification"] },
        { title: "Unsupervised Learning", children: ["Clustering", "Dimensionality Reduction"] },
        { title: "Reinforcement Learning", children: ["MDP", "Q-Learning"] }
      ]
    };

    const finalLearningMap = aiLearningMap || {
      subject: topic,
      units: (finalMindMap.branches || []).map((b, i) => ({
        title: b.title,
        status: i === 0 ? "mastered" : "inprogress",
        progress: i === 0 ? "90%" : "In Progress",
        topics: (b.children || []).map(c => ({ title: c, status: "weak", progress: "40%" }))
      }))
    };

    return res.json({ learningMap: finalLearningMap, mindMap: finalMindMap });

  } catch (err) {
     console.error("❌ Mind map generation failed:", {
       message: err.message,
       stack: err.stack,
       topic: topic,
       timestamp: new Date().toISOString()
     });
     res.status(500).json({ 
       error: "Mind map generation failed",
       details: err.message,
       timestamp: new Date().toISOString()
     });
  }
});

export default router;
