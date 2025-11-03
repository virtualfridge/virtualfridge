import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { AiVisionService, ProduceAnalysis } from '../../services/aiVision';

// Mock axios and fs
jest.mock('axios');
jest.mock('fs');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('AiVisionService', () => {
  let service: AiVisionService;
  const mockApiKey = 'test-api-key-123';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiVisionService(mockApiKey);

    // Mock fs.readFileSync to return a base64 string
    mockedFs.readFileSync = jest.fn().mockReturnValue(Buffer.from('fake-image-data'));
  });

  describe('analyzeProduce', () => {
    test('should analyze produce successfully and return full data', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      isProduce: true,
                      category: 'fruit',
                      name: 'Apple',
                      nutrients_per_100g: {
                        calories: '52',
                        protein: '0.3g',
                        carbs: '14g',
                        sugars: '10g',
                        fiber: '2.4g',
                      },
                    }),
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/image.jpg');

      expect(result).toBeDefined();
      expect(result.isProduce).toBe(true);
      expect(result.category).toBe('fruit');
      expect(result.name).toBe('Apple');
      expect(result.nutrients).toBeDefined();
      expect(result.nutrients?.calories).toBe('52');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('generateContent'),
        expect.objectContaining({
          contents: expect.any(Array),
          generationConfig: {
            response_mime_type: 'application/json',
          },
        }),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    test('should handle non-produce items correctly', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({ isProduce: false }),
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/non-produce.jpg');

      expect(result.isProduce).toBe(false);
      expect(result.category).toBeUndefined();
      expect(result.name).toBeUndefined();
    });

    test('should handle vegetable category', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      isProduce: true,
                      category: 'vegetable',
                      name: 'Carrot',
                    }),
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/carrot.jpg');

      expect(result.isProduce).toBe(true);
      expect(result.category).toBe('vegetable');
      expect(result.name).toBe('Carrot');
    });

    test('should throw error when API key is missing', async () => {
      const serviceWithoutKey = new AiVisionService('');

      await expect(serviceWithoutKey.analyzeProduce('/path/to/image.jpg')).rejects.toThrow(
        'GEMINI_API_KEY is not set'
      );
    });

    test('should return fallback when Gemini returns empty response', async () => {
      const mockResponse = {
        data: {
          candidates: [],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/image.jpg');

      expect(result.isProduce).toBe(false);
    });

    test('should return fallback when response has no content', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {},
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/image.jpg');

      expect(result.isProduce).toBe(false);
    });

    test('should handle API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      await expect(service.analyzeProduce('/path/to/image.jpg')).rejects.toThrow('API Error');
    });

    test('should handle absolute paths', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ isProduce: false }) }],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const absolutePath = path.join(process.cwd(), 'test', 'image.jpg');
      await service.analyzeProduce(absolutePath);

      expect(mockedFs.readFileSync).toHaveBeenCalledWith(absolutePath);
    });

    test('should handle relative paths by converting to absolute', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ isProduce: false }) }],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const relativePath = 'uploads/image.jpg';
      await service.analyzeProduce(relativePath);

      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        path.join(process.cwd(), relativePath)
      );
    });

    test('should detect JPEG mime type correctly', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ isProduce: false }) }],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.analyzeProduce('/path/to/image.jpeg');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contents: [
            {
              parts: [
                expect.any(Object),
                expect.objectContaining({
                  inlineData: expect.objectContaining({
                    mimeType: 'image/jpeg',
                  }),
                }),
              ],
            },
          ],
        }),
        expect.any(Object)
      );
    });

    test('should detect PNG mime type correctly', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ isProduce: false }) }],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.analyzeProduce('/path/to/image.png');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contents: [
            {
              parts: [
                expect.any(Object),
                expect.objectContaining({
                  inlineData: expect.objectContaining({
                    mimeType: 'image/png',
                  }),
                }),
              ],
            },
          ],
        }),
        expect.any(Object)
      );
    });

    test('should detect WebP mime type correctly', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ isProduce: false }) }],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.analyzeProduce('/path/to/image.webp');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contents: [
            {
              parts: [
                expect.any(Object),
                expect.objectContaining({
                  inlineData: expect.objectContaining({
                    mimeType: 'image/webp',
                  }),
                }),
              ],
            },
          ],
        }),
        expect.any(Object)
      );
    });

    test('should default to JPEG for unknown extensions', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ isProduce: false }) }],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await service.analyzeProduce('/path/to/image.unknown');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          contents: [
            {
              parts: [
                expect.any(Object),
                expect.objectContaining({
                  inlineData: expect.objectContaining({
                    mimeType: 'image/jpeg',
                  }),
                }),
              ],
            },
          ],
        }),
        expect.any(Object)
      );
    });

    test('should handle alternative field names in response', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      is_produce: true,
                      type: 'fruit',
                      label: 'Banana',
                    }),
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/banana.jpg');

      expect(result.isProduce).toBe(true);
      expect(result.category).toBe('fruit');
      expect(result.name).toBe('Banana');
    });

    test('should handle JSON wrapped in other text', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Here is the result: {"isProduce": true, "category": "fruit", "name": "Orange"} end',
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/orange.jpg');

      expect(result.isProduce).toBe(true);
      expect(result.category).toBe('fruit');
      expect(result.name).toBe('Orange');
    });

    test('should return null for invalid JSON', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'This is not valid JSON',
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/image.jpg');

      expect(result.isProduce).toBe(false);
    });

    test('should normalize nutrients with various naming conventions', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      isProduce: true,
                      category: 'fruit',
                      name: 'Apple',
                      nutrients: {
                        calories: 52,
                        energy_kj: 218,
                        protein: '0.3g',
                        fat: '0.2g',
                        saturatedfat: '0.1g', // No underscore
                        carbohydrates: '14g', // Alternative name
                        sugars: '10g',
                        fiber: '2.4g',
                      },
                    }),
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/apple.jpg');

      expect(result.nutrients).toBeDefined();
      expect(result.nutrients?.calories).toBe('52');
      expect(result.nutrients?.energy_kj).toBe('218');
      expect(result.nutrients?.protein).toBe('0.3g');
      expect(result.nutrients?.carbs).toBe('14g');
    });

    test('should handle empty nutrients object', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      isProduce: true,
                      category: 'fruit',
                      name: 'Unknown Fruit',
                      nutrients_per_100g: {},
                    }),
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/unknown.jpg');

      expect(result.isProduce).toBe(true);
      expect(result.nutrients).toBeDefined();
    });

    test('should handle missing nutrients field', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      isProduce: true,
                      category: 'fruit',
                      name: 'Mango',
                    }),
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.analyzeProduce('/path/to/mango.jpg');

      expect(result.isProduce).toBe(true);
      expect(result.nutrients).toBeUndefined();
    });
  });
});
