import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ImageAnnotatorClient, protos } from '@google-cloud/vision';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
const client = new ImageAnnotatorClient();

const JsonBody = z.object({ imageBase64: z.string().min(1).optional() });

router.post(
  '/classify',
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      let bytes: Buffer | null = null;

      if (req.file?.buffer) {
        bytes = req.file.buffer;
      } else if (req.is('application/json')) {
        const parsed = JsonBody.safeParse(req.body);
        if (parsed.success && parsed.data.imageBase64) {
          const b64 = parsed.data.imageBase64.replace(/^data:image\/\w+;base64,/, '');
          bytes = Buffer.from(b64, 'base64');
        }
      }
      if (!bytes) {
        return res.status(400).json({ error: 'No image provided. Use multipart "image" or JSON "imageBase64".' });
      }

      const [result] = await client.labelDetection({ image: { content: bytes } });
      const annotations = (result.labelAnnotations ?? []) as protos.google.cloud.vision.v1.EntityAnnotation[];

      type Label = { name: string; confidence: number };
      const labels: Label[] = annotations
        .map((a: protos.google.cloud.vision.v1.EntityAnnotation) => ({
          name: (a.description ?? '').trim(),
          confidence: a.score ?? 0
        }))
        .filter((l: Label) => l.name.length > 0)
        .sort((a: Label, b: Label) => b.confidence - a.confidence)
        .slice(0, 5);

      const canonical = pickCanonical(labels);
      return res.json({ labels, canonical });
    } catch (e) {
      console.error('[vision/classify] error:', e);
      return res.status(500).json({ error: 'Vision classification failed.' });
    }
  }
);

export default router;

type Canonical = { id: string; displayName: string; confidence: number };

const CANON = [
  { id: 'BANANA', keys: ['banana', 'bananas'], displayName: 'Banana' },
  { id: 'APPLE',  keys: ['apple', 'apples'],   displayName: 'Apple' },
  { id: 'TOMATO', keys: ['tomato','tomatoes'], displayName: 'Tomato' },
  { id: 'LETTUCE',keys: ['lettuce'],           displayName: 'Lettuce' },
  { id: 'AVOCADO',keys: ['avocado'],           displayName: 'Avocado' },
  { id: 'CARROT', keys: ['carrot','carrots'],  displayName: 'Carrot' },
  { id: 'ORANGE', keys: ['orange','oranges'],  displayName: 'Orange' },
  { id: 'GRAPE',  keys: ['grape','grapes'],    displayName: 'Grapes' },
  { id: 'BROCCOLI',keys:['broccoli'],          displayName: 'Broccoli' }
];

function pickCanonical(labels: { name: string; confidence: number }[]): Canonical | null {
  let best: Canonical | null = null;
  for (const l of labels) {
    const low = l.name.toLowerCase();
    const match = CANON.find(c => c.keys.some(k => low.includes(k)));
    if (match && (!best || l.confidence > best.confidence)) {
      best = { id: match.id, displayName: match.displayName, confidence: l.confidence };
    }
  }
  return best;
}