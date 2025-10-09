import { Router } from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /barcode
 * Body: { barcode: "0123456789" }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ message: 'Missing barcode' });
    }

    console.log('Received barcode:', barcode);

    // Call OpenFoodFacts API
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const response = await axios.get(url);

    // Check if the product exists
    if (!response.data || !response.data.product) {
      return res.status(404).json({ message: 'Product not found in OpenFoodFacts' });
    }

    const product = response.data.product;

    // Simplify the response (you can include more fields as needed)
    const productData = {
      name: product.product_name,
      brand: product.brands,
      quantity: product.quantity,
      ingredients: product.ingredients_text,
      image: product.image_url,
      nutriments: {
        calories: product.nutriments['energy-kcal_100g'],
        protein: product.nutriments.proteins_100g,
        fat: product.nutriments.fat_100g,
        carbs: product.nutriments.carbohydrates_100g,
      },
    };

    return res.status(200).json({ success: true, product: productData });
  } catch (err: any) {
    console.error('Error handling barcode:', err.message || err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
