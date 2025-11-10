import axios from 'axios';
import fs from 'fs';
import path from 'path';
import logger from '../util/logger';
import {
  GeminiInlineDataPart,
  GeminiResponse,
  GeminiTextPart,
  IProduceAnalysis,
  produceAnalysisSchema,
} from '../types/ai';
import { GEMINI_API_HOST, GEMINI_MODEL } from '../config/constants';

export class AiVisionService {
  constructor(private readonly apiKey = process.env.GEMINI_API_KEY) {}

  async analyzeProduce(imagePath: string): Promise<IProduceAnalysis> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is not set.');
    }

    const absPath = path.isAbsolute(imagePath)
      ? imagePath
      : path.join(process.cwd(), imagePath);

    const mimeType = this.detectMimeType(absPath);
    const base64 = fs.readFileSync(absPath).toString('base64');

    const url = `${GEMINI_API_HOST}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;

    const prompt = [
      'You are a vision model helping identify produce items for a smart fridge.',
      'Analyze the attached image and determine if it contains a single food item that is a fruit or a vegetable only.',
      'If yes, respond strictly as JSON with keys: isProduce (boolean), category ("fruit" or "vegetable"), name (common English name), nutrients_per_100g (object).',
      'The nutrients_per_100g object should include as many of these string fields as you can estimate: calories, energyKj, protein, fat, saturatedFat, monounsaturatedFat, polyunsaturatedFat, transFat, cholesterol, carbohydrates, sugars, fiber, salt, sodium, calcium, iron, magnesium, potassium, zinc, caffeine.',
      'If not a single fruit/vegetable, respond: {"isProduce": false}. Do not include any additional text.',
    ].join('\n');

    logger.info('Requesting Gemini vision analysis');

    const { data } = await axios.post<GeminiResponse>(
      url,
      {
        contents: [
          {
            parts: [
              { text: prompt } as GeminiTextPart,
              {
                inlineData: { mimeType, data: base64 },
              } as GeminiInlineDataPart,
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
        },
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const parsed = this.parseJsonFromResponse(data);
    if (!parsed) {
      // Fallback safe default
      return { isProduce: false };
    }
    return parsed;
  }

  private detectMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      default:
        return 'image/jpeg';
    }
  }

  private parseJsonFromResponse(resp: GeminiResponse): IProduceAnalysis | null {
    const text = resp.candidates?.[0]?.content?.parts
      ?.map(p => p.text?.trim())
      .filter(Boolean)
      .join('\n');
    if (!text) return null;

    // If model respected response_mime_type, text should be JSON
    const jsonText = this.extractJson(text);
    if (!jsonText) return null;
    try {
      const obj = JSON.parse(jsonText);
      return produceAnalysisSchema.parse(obj);
    } catch (e) {
      return null;
    }
  }

  private extractJson(text: string): string | null {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
    const match = text.match(/\{[\s\S]*\}/);
    return match ? match[0] : null;
  }
}

export const aiVisionService = new AiVisionService();
