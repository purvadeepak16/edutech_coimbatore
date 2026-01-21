import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/generate-visual", async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: "Topic is required" });

  try {
    let visualMindMap;

    // ---------- AI OR MOCK ----------
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("⚠️ Using mock visual mind map data");

      visualMindMap = {
        root: {
          id: "root",
          title: topic,
          children: [
            {
              id: "branch_1",
              title: "Definition / Overview",
              children: [
                { id: "sub_1_1", title: "Process Overview", children: [] },
                { id: "sub_1_2", title: "Key Players (Chlorophyll & Chloroplasts)", children: [] }
              ]
            },
            {
              id: "branch_2",
              title: "Inputs",
              children: [
                { id: "sub_2_1", title: "Water (H2O)", children: [] },
                { id: "sub_2_2", title: "Carbon Dioxide (CO2)", children: [] },
                { id: "sub_2_3", title: "Sunlight (Energy)", children: [] }
              ]
            },
            {
              id: "branch_3",
              title: "Outputs",
              children: [
                { id: "sub_3_1", title: "Glucose (C6H12O6 - Sugar)", children: [] },
                { id: "sub_3_2", title: "Oxygen (O2)", children: [] }
              ]
            },
            {
              id: "branch_4",
              title: "Stages / Process",
              children: [
                {
                  id: "sub_4_1",
                  title: "Light-Dependent Reactions",
                  children: [
                    { id: "sub_4_1_1", title: "Occurs in Thylakoid Membranes", children: [] },
                    { id: "sub_4_1_2", title: "Photophosphorylation", children: [] },
                    { id: "sub_4_1_3", title: "Cyclic Electron Flow", children: [] }
                  ]
                },
                {
                  id: "sub_4_2",
                  title: "Calvin Cycle (Light-Independent)",
                  children: [
                    { id: "sub_4_2_1", title: "Occurs in Stroma", children: [] },
                    { id: "sub_4_2_2", title: "Carbon Fixation", children: [] },
                    { id: "sub_4_2_3", title: "Reduction Phase", children: [] }
                  ]
                }
              ]
            },
            {
              id: "branch_5",
              title: "Importance",
              children: [
                { id: "sub_5_1", title: "Food Production for Ecosystems", children: [] },
                { id: "sub_5_2", title: "Oxygen for Respiration", children: [] },
                { id: "sub_5_3", title: "Carbon Cycle Regulation", children: [] }
              ]
            },
            {
              id: "branch_6",
              title: "Variations / Types",
              children: [
                { id: "sub_6_1", title: "C3 Plants", children: [] },
                { id: "sub_6_2", title: "C4 Plants", children: [] },
                { id: "sub_6_3", title: "CAM Plants", children: [] }
              ]
            },
            {
              id: "branch_7",
              title: "Common Mistakes / Exam Focus",
              children: [
                { id: "sub_7_1", title: "Confusing Light vs Dark Reactions", children: [] },
                { id: "sub_7_2", title: "NADPH vs ATP Role", children: [] },
                { id: "sub_7_3", title: "Photorespiration Issues", children: [] }
              ]
            }
          ]
        }
      };
    } else {
      const prompt = `You are an expert educator creating a true mind map for students and teachers.

Given the topic: "${topic}", break it into natural, meaningful subtopics as they would appear in a hand-drawn mind map.

Semantic rules (follow exactly):
- Do NOT use generic template categories ("Definition", "Inputs", "Outputs", "Common Mistakes", "Key Components", etc.) unless they are genuinely natural to this topic.
- Prefer concept-driven decomposition used by humans when teaching or explaining the topic.
- Depth must vary naturally per branch (some branches may be deep, others shallow).
- Do NOT produce a syllabus outline, checklist, or process flow; produce a conceptual map.
- Use short, clear phrases (preferably noun phrases, ≤ 6 words).
- Do not invent unrelated sections — every node must be a real subtopic of the given topic.

Return ONLY valid JSON (NO markdown, NO explanations, NO extra text). The JSON must follow this structure exactly so the backend can parse it:

{
  "root": {
    "id": "root",
    "title": "${topic}",
    "children": [
      {
        "id": "branch_1",
        "title": "Subtopic",
        "children": [
          {
            "id": "sub_1_1",
            "title": "Nested subtopic",
            "children": []
          }
        ]
      }
    ]
  }
}

Strict formatting rules:
- Only return the JSON object above (no surrounding text or markdown fences).
- Titles must be concise (≤ 6 words) and conceptually meaningful.
- IDs should be short unique strings (you may use branch_1, sub_1_1 style).
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
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "StudySync Mind Map"
          }
        }
      );

      let content = response.data.choices?.[0]?.message?.content || "";
      console.log("📥 AI Response:", content);

      // Extract JSON from markdown if present
      const match = content.match(/```json([\s\S]*?)```/) || content.match(/```([\s\S]*?)```/);
      const jsonStr = match ? match[1] : content;
      
      visualMindMap = JSON.parse(jsonStr.trim());

      // Validate structure
      if (!visualMindMap.root || !visualMindMap.root.title || !Array.isArray(visualMindMap.root.children)) {
        throw new Error("Invalid mind map structure from AI");
      }
    }

    return res.json({ visualMindMap });

  } catch (err) {
    console.error("❌ Visual mind map generation failed:", {
      message: err.message,
      stack: err.stack,
      topic: topic,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      error: "Visual mind map generation failed",
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
