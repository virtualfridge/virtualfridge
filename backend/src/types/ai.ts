import z from 'zod';
import { nutrientsSchema } from './foodType';

export interface GeminiInlineDataPart {
  inlineData: {
    mimeType: string;
    data: string; // base64
  };
}

export interface GeminiTextPart {
  text: string;
}

export interface GeminiCandidate {
  content?: {
    parts?: { text?: string }[];
  };
}

export interface GeminiResponse {
  candidates?: GeminiCandidate[];
  modelVersion?: string;
}

export const produceAnalysisSchema = z.object({
  isProduce: z.boolean(),
  category: z
    .string()
    .refine(val => val == 'fruit' || val == 'vegetable')
    .optional(),
  name: z.string().optional(),
  nutrients: nutrientsSchema.optional(),
});

export type ProduceAnalysis = z.infer<typeof produceAnalysisSchema>;
