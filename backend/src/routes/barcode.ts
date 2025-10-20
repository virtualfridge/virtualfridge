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
    //send barcode

    // Call OpenFoodFacts API
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const response = await axios.get(url);

    // Check if the product exists
    if (!response.data || !response.data.product) {
      return res.status(404).json({ message: 'Product not found in OpenFoodFacts' });
    }

    const product = response.data.product;

    // Extract expiration or shelf-life related info if available
    const expirationDate =
      product.expiration_date ||
      product.expiry_date ||
      product["expiration_date"] ||
      null;

    const shelfLife =
      product.conservation_conditions ||
      product.storage_instructions ||
      product.packaging_text ||
      null;

    // Simplify the response (add expiration/shelf-life fields)
    const productData = {
      name: product.product_name,
      brand: product.brands,
      quantity: product.quantity,
      ingredients: product.ingredients_text,
      image: product.image_url,
      expiration_date: expirationDate,
      shelf_life: shelfLife,
      nutriments: {
        calories: product.nutriments?.['energy-kcal_100g'],
        protein: product.nutriments?.proteins_100g,
        fat: product.nutriments?.fat_100g,
        carbs: product.nutriments?.carbohydrates_100g,
      },
    };

    // Print for debugging
    console.log('Product data retrieved:', productData);

    // Eventually, save productData to DB here

    return res.status(200).json({ success: true, product: productData });
  } catch (err: any) {
    console.error('Error handling barcode:', err.message || err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
