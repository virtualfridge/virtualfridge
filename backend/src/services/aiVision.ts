import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import logger from '../util/logger';

type GeminiInlineDataPart = {
  inlineData: {
    mimeType: string;
    data: string; // base64
  };
};

type GeminiTextPart = {
  text: string;
};

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
  modelVersion?: string;
};

export type NutrientsPer100g = {
  calories?: string;
  energy_kj?: string;
  protein?: string;
  fat?: string;
  saturated_fat?: string;
  monounsaturated_fat?: string;
  polyunsaturated_fat?: string;
  trans_fat?: string;
  cholesterol?: string;
  carbs?: string;
  sugars?: string;
  fiber?: string;
  salt?: string;
  sodium?: string;
  calcium?: string;
  iron?: string;
  potassium?: string;
};

export type ProduceAnalysis = {
  isProduce: boolean;
  category?: 'fruit' | 'vegetable';
  name?: string;
  nutrients?: NutrientsPer100g;
};

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash';
const GEMINI_API_HOST =
  process.env.GEMINI_API_URL ||
  'https://generativelanguage.googleapis.com/v1beta';

export class AiVisionService {
  constructor(private readonly apiKey = process.env.GEMINI_API_KEY) {}

  async analyzeProduce(imagePath: string): Promise<ProduceAnalysis> {
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
      'The nutrients_per_100g object should include as many of these string fields as you can estimate: calories, energy_kj, protein, fat, saturated_fat, monounsaturated_fat, polyunsaturated_fat, trans_fat, cholesterol, carbs, sugars, fiber, salt, sodium, calcium, iron, magnesium, potassium, zinc, caffeine.',
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

  private parseJsonFromResponse(resp: GeminiResponse): ProduceAnalysis | null {
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
      const isProduce = Boolean(obj.isProduce ?? obj.is_produce);
      const category = (obj.category ?? obj.type) as
        | 'fruit'
        | 'vegetable'
        | undefined;
      const name = obj.name ?? obj.label ?? obj.item ?? undefined;
      const nutrientsRaw = obj.nutrients_per_100g ?? obj.nutrients ?? null;
      const nutrients = nutrientsRaw ? this.normalizeNutrients(nutrientsRaw) : undefined;
      return { isProduce, category, name, nutrients };
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

  private normalizeNutrients(obj: any): NutrientsPer100g {
    const pick = (k: string) => obj?.[k] ?? obj?.[k.replace(/_/g, '')] ?? obj?.[k.replace(/_/g, ' ')];
    const out: NutrientsPer100g = {
      calories: pick('calories')?.toString(),
      energy_kj: pick('energy_kj')?.toString(),
      protein: pick('protein')?.toString(),
      fat: pick('fat')?.toString(),
      saturated_fat: pick('saturated_fat')?.toString(),
      monounsaturated_fat: pick('monounsaturated_fat')?.toString(),
      polyunsaturated_fat: pick('polyunsaturated_fat')?.toString(),
      trans_fat: pick('trans_fat')?.toString(),
      cholesterol: pick('cholesterol')?.toString(),
      carbs: pick('carbs')?.toString() ?? pick('carbohydrates')?.toString(),
      sugars: pick('sugars')?.toString(),
      fiber: pick('fiber')?.toString(),
      salt: pick('salt')?.toString(),
      sodium: pick('sodium')?.toString(),
      calcium: pick('calcium')?.toString(),
      iron: pick('iron')?.toString(),
      potassium: pick('potassium')?.toString(),
    };
    return out;
  }
}

export const aiVisionService = new AiVisionService();
