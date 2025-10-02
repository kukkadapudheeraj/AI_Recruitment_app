import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 8787;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

if (!OPENAI_API_KEY) {
  console.warn("[WARN] OPENAI_API_KEY is not set. Set it in .env");
}

app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: ALLOWED_ORIGIN === "*" ? true : ALLOWED_ORIGIN }));
app.use(morgan("tiny"));

// Basic rate limit (very lightweight)
let last = 0;
app.use((req, res, next) => {
  const now = Date.now();
  if (now - last < 750) {
    // 0.75s
    return res.status(429).json({ error: "Too many requests" });
  }
  last = now;
  next();
});

async function callOpenAI(messages, model = "gpt-4o-mini", temperature = 0.3) {
  if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model, messages, temperature }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI error ${resp.status}: ${t}`);
  }
  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content?.trim() || "";
  return text;
}

// Build JD from answers
app.post("/api/generate", async (req, res) => {
  try {
    const { answers, model } = req.body || {};
    const lines = [];
    lines.push(`Job Role: ${answers?.role || ""}`);
    lines.push(`Location: ${answers?.location || ""}`);
    if (answers?.timezone) lines.push(`Time zone: ${answers.timezone}`);
    lines.push(`Employment type: ${answers?.hireType || ""}`);
    if (answers?.duration) lines.push(`Contract duration: ${answers.duration}`);
    if (answers?.domain) lines.push(`Domain preference: ${answers.domain}`);
    if (answers?.skills) lines.push(`Key skills: ${answers.skills}`);
    if (answers?.goals) lines.push(`1-year success goals: ${answers.goals}`);
    if (answers?.kpi) lines.push(`KPIs: ${answers.kpi}`);
    if (answers?.superstar)
      lines.push(`Superstar outcomes: ${answers.superstar}`);
    if (answers?.ninety) lines.push(`First 90 days: ${answers.ninety}`);
    if (answers?.benefits)
      lines.push(`Benefits and perks: ${answers.benefits}`);
    if (answers?.applicationProcess)
      lines.push(`Application process: ${answers.applicationProcess}`);

    const system =
      "You are a professional HR assistant. Create a generic job description that HR can directly copy-paste into any system (ATS, job boards, company websites). \n\nRequirements:\n- Clean, professional formatting with NO markdown or special characters\n- Use clear headings: Job Title, Location, Job Summary, Key Responsibilities, Required Skills, Preferred Qualifications, Benefits & Perks, How to Apply\n- Do NOT include company name or company-specific information - keep it completely generic\n- Convert lists to clean bullet points\n- Professional, engaging tone\n- ATS-friendly structure\n- Include all provided information\n- Ready for immediate use by any HR professional at any company";
    const user = lines.join("\n");
    const text = await callOpenAI(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      model || "gpt-4o-mini",
      0.3
    );
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Polish an existing JD
app.post("/api/polish", async (req, res) => {
  try {
    const { jd, instructions, model } = req.body || {};
    const system =
      "You are a meticulous recruiter editor. Improve clarity, grammar, flow, and impact. Keep structure and bullet points. Do not invent facts; only refine based on the user's instructions.";
    const user = `Original JD:\n\n${jd}\n\nPolish instructions:\n${instructions}`;
    const text = await callOpenAI(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      model || "gpt-4o-mini",
      0.2
    );
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Generate sourcing strategy
app.post("/api/sourcing", async (req, res) => {
  try {
    const { jd, location, model } = req.body || {};

    const system = `You are a recruiter who has just completed an intake meeting and has a detailed job description for a role based in ${location}. Your next task is to identify potential candidates for this role. Follow these steps:

1. Based on the job description scoped above, identify 10 top companies known for having talent with relevant skills and experience for this role.

2. Generate a specific Boolean search string for each identified company to use in Google searches. The goal is to find LinkedIn profiles of potential candidates who could fit this role well.

3. Also create a Boolean string to search in Dice job portal.

IMPORTANT: You must respond with ONLY valid JSON in this exact format:
{
  "companies": [
    {
      "name": "Company Name",
      "linkedinSearch": "Boolean search string for LinkedIn",
      "reason": "Why this company has relevant talent"
    }
  ],
  "diceSearch": "Boolean search string for Dice job portal",
  "summary": "Brief summary of sourcing strategy"
}

Do not include any text before or after the JSON.`;

    const user = `Job Description:\n\n${jd}`;
    const response = await callOpenAI(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      model || "gpt-4o-mini",
      0.3
    );

    try {
      // Clean the response to extract JSON
      let jsonStr = response.trim();

      // Find JSON object boundaries
      const jsonStart = jsonStr.indexOf("{");
      const jsonEnd = jsonStr.lastIndexOf("}") + 1;

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd);
      }

      const parsed = JSON.parse(jsonStr);

      // Validate the structure
      if (!parsed.companies || !Array.isArray(parsed.companies)) {
        parsed.companies = [];
      }
      if (!parsed.diceSearch) {
        parsed.diceSearch = "";
      }
      if (!parsed.summary) {
        parsed.summary = "Sourcing strategy generated successfully.";
      }

      res.json(parsed);
    } catch (e) {
      console.error("JSON parsing failed:", e);
      console.error("Response was:", response);

      // Fallback with sample data
      res.json({
        companies: [
          {
            name: "Sample Company",
            linkedinSearch: `site:linkedin.com/in/ "${location}" AND "software developer"`,
            reason: "Sample company with relevant talent",
          },
        ],
        diceSearch: `"${location}" AND "software developer" AND "full time"`,
        summary:
          "Fallback sourcing strategy generated. Please check your AI settings.",
      });
    }
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
