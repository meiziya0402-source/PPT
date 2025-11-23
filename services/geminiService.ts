import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedDeck, SlideType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const deckSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    themeColor: { type: Type.STRING, description: "A hex color code extracted from the image vibe." },
    slides: {
      type: Type.ARRAY,
      description: "Array of 10 slides for a year-end report.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: Object.values(SlideType) },
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          bodyText: { type: Type.STRING, description: "Paragraph text for Split/Overview slides." },
          bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List items for Agenda/List slides." },
          bigValue: { type: Type.STRING, description: "A large number or metric (e.g., '1.2亿', '+45%') for Metric slides." },
          gridItems: { 
            type: Type.ARRAY, 
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                desc: { type: Type.STRING }
              }
            },
            description: "3-4 items for Grid/Team slides."
          }
        },
        required: ["type", "title", "subtitle"]
      }
    }
  },
  required: ["themeColor", "slides"]
};

export const generateDeckContent = async (
  imageBase64: string, 
  userPrompt?: string
): Promise<GeneratedDeck> => {
  try {
    const modelId = "gemini-2.5-flash"; 
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const basePrompt = `
      You are a world-class presentation designer. 
      Analyze the provided image and generate content for a **10-slide Year-End Report (年终汇报)** presentation in Chinese.
      The tone should be professional, inspiring, and high-end.
      
      Structure the 10 slides exactly as follows:
      1. COVER: Main Title & Slogan.
      2. AGENDA: List of 4-5 main sections.
      3. OVERVIEW: Executive Summary (Split layout).
      4. METRIC: One key financial or growth metric (Big number).
      5. GRID3: Key Highlights or Achievements (3 items).
      6. SPLIT_LEFT: Market Analysis or Industry Insight.
      7. TEAM: Team overview or Core Values (Grid style).
      8. SPLIT_RIGHT: Challenges & Solutions.
      9. LIST: Future Strategic Plan (Next year's goals).
      10. THANK_YOU: Closing slide.

      Extract a matching 'themeColor' from the image.
      If the user provided specific instructions: "${userPrompt || 'None'}", incorporate them into the context.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
          { text: basePrompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: deckSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeneratedDeck;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback deck
    return {
      themeColor: "#60A5FA",
      slides: [
        { type: SlideType.Cover, title: "年度汇报", subtitle: "2024 总结与展望" },
        { type: SlideType.Agenda, title: "目录", subtitle: "本次汇报概览", bulletPoints: ["年度经营概况", "核心项目复盘", "市场数据分析", "2025 战略规划"] },
        { type: SlideType.Overview, title: "回顾", subtitle: "稳健前行", bodyText: "在过去的一年中，我们克服了多重挑战，实现了核心业务的稳步增长。" },
        { type: SlideType.Metric, title: "核心营收", subtitle: "同比增长显著", bigValue: "¥1.2B" },
        { type: SlideType.Grid3, title: "主要成就", subtitle: "里程碑时刻", gridItems: [{title: "产品发布", desc: "全新系列上线"}, {title: "市场扩张", desc: "新增30+城市"}, {title: "客户满意", desc: "NPS达到历史新高"}] },
        { type: SlideType.SplitLeft, title: "市场洞察", subtitle: "趋势分析", bodyText: "行业正向数字化转型加速，我们需要抓住这一波红利。" },
        { type: SlideType.Team, title: "团队建设", subtitle: "人才梯队", gridItems: [{title: "技术部", desc: "突破核心算法"}, {title: "市场部", desc: "品牌声量翻倍"}, {title: "运营部", desc: "效率提升30%"}] },
        { type: SlideType.SplitRight, title: "挑战与对策", subtitle: "破局之道", bodyText: "面对激烈的同质化竞争，我们将坚持差异化战略，深耕垂直领域。" },
        { type: SlideType.List, title: "未来规划", subtitle: "2025 战略目标", bulletPoints: ["Q1：完成产品迭代", "Q2：拓展海外市场", "Q3：建立生态联盟", "Q4：实现百亿营收"] },
        { type: SlideType.ThankYou, title: "感谢聆听", subtitle: "Q & A" }
      ]
    };
  }
};