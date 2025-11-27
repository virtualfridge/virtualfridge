import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import axios from 'axios';
import { AiRecipeService } from '../../../services/aiRecipe';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AiRecipeService', () => {
  let service: AiRecipeService;
  const mockApiKey = 'test-api-key-123';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AiRecipeService(mockApiKey);
  });

  describe('generateRecipe', () => {
    test('should generate recipe successfully with provided ingredients', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '## Delicious Apple Pie\n\n### Ingredients\n- 4 apples\n- 2 cups flour\n\n### Steps\n1. Peel apples\n2. Mix ingredients\n3. Bake at 350°F',
                  },
                ],
              },
            },
          ],
          modelVersion: 'gemini-2.5-flash',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.generateRecipe(['apples', 'flour', 'sugar']);

      expect(result).toBeDefined();
      expect(result.recipe).toContain('Apple Pie');
      expect(result.ingredients).toEqual(['Apples', 'Flour', 'Sugar']);
      expect(result.model).toBe('gemini-2.5-flash');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('generateContent'),
        expect.objectContaining({
          contents: expect.any(Array),
        }),
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    test('should throw error when API key is missing', async () => {
      const serviceWithoutKey = new AiRecipeService('');

      await expect(serviceWithoutKey.generateRecipe(['apple'])).rejects.toThrow(
        'GEMINI_API_KEY is not set'
      );
    });

    test('should throw error when Gemini returns empty response', async () => {
      const mockResponse = {
        data: {
          candidates: [],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      await expect(service.generateRecipe(['apple'])).rejects.toThrow(
        'Gemini returned an empty response'
      );
    });

    test('should handle API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      await expect(service.generateRecipe(['apple'])).rejects.toThrow(
        'API Error'
      );
    });

    test('should format ingredient names correctly', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '## Recipe\n\n### Ingredients\n- Test\n\n### Steps\n1. Cook',
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await service.generateRecipe([
        'red_apple',
        'brown-sugar',
        'whole_wheat_flour',
      ]);

      expect(result.ingredients).toEqual([
        'Red Apple',
        'Brown Sugar',
        'Whole Wheat Flour',
      ]);
    });
  });
});
