import { Router } from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';
import { foodTypeModel } from '../models/foodType';
import { foodItemModel } from '../models/foodItem';
import { FoodType } from '../types/foodType';
import { addDaysToDate, dateDiffInDays, parseDate } from '../util/dates';

const router = Router();

/**
 * POST /barcode
 * Body: { barcode: "0123456789" }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { barcode } = req.body;
    if (!barcode) return res.status(400).json({ message: 'Missing barcode' });

    console.log('Received barcode:', barcode);

    let foodType = await foodTypeModel.findByBarcode(barcode);
    // Only call OpenFoodFacts if we don’t already have this food type
    if (!foodType) {
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?lc=en`;
      const { data } = await axios.get(url);

      if (!data || !data.product)
        return res
          .status(404)
          .json({ message: 'Product not found in OpenFoodFacts' });

      const product = data.product;
      // console.log('Product data from OpenFoodFacts:', product);

      const nutriments = product.nutriments || {};

      // Extract expiration or shelf-life related info if available
      let shelfLifeDays = undefined;
      const expirationDate =
        product.expiration_date || product.expiry_date || null;
      if (expirationDate) {
        shelfLifeDays = dateDiffInDays(
          new Date(),
          parseDate(expirationDate, 'mm-yyyy')
        );
      }
      // Extract calories (handle both kcal and kJ cases)
      let calories =
        nutriments['energy-kcal_100g'] ??
        nutriments['energy-kcal_serving'] ??
        nutriments['energy-kcal'] ??
        null;

      if (!calories && nutriments['energy_100g']) {
        // Convert from kJ to kcal if needed
        calories = Math.round(nutriments['energy_100g'] / 4.184);
      }

      let productData = {
        name: product.product_name_en || product.product_name || null,
        brand: product.brands || null,
        quantity: product.quantity || null,
        ingredients:
          product.ingredients_text_en || product.ingredients_text || null,
        image: product.image_url || null,
        expiration_date: expirationDate,
        allergens:
          product.allergens_hierarchy
            ?.filter((a: string) => a.startsWith('en:'))
            .map((a: string) => a.replace(/^en:/, '')) || null,

        nutrients: {
          calories,
          energy_kj:
            nutriments['energy-kj_100g'] ?? nutriments['energy_100g'] ?? null,
          protein: nutriments.proteins_100g ?? null,
          fat: nutriments.fat_100g ?? null,
          saturated_fat: nutriments['saturated-fat_100g'] ?? null,
          monounsaturated_fat: nutriments['monounsaturated-fat_100g'] ?? null,
          polyunsaturated_fat: nutriments['polyunsaturated-fat_100g'] ?? null,
          trans_fat: nutriments['trans-fat_100g'] ?? null,
          cholesterol: nutriments.cholesterol_100g ?? null,
          carbs: nutriments.carbohydrates_100g ?? null,
          sugars: nutriments['sugars_100g'] ?? null,
          fiber: nutriments['fiber_100g'] ?? null,
          salt: nutriments['salt_100g'] ?? null,
          sodium: nutriments['sodium_100g'] ?? null,
          calcium: nutriments['calcium_100g'] ?? null,
          iron: nutriments['iron_100g'] ?? null,
          magnesium: nutriments['magnesium_100g'] ?? null,
          potassium: nutriments['potassium_100g'] ?? null,
          zinc: nutriments['zinc_100g'] ?? null,
          caffeine: nutriments['caffeine_100g'] ?? null,
        },
      };
      console.log('Product data retrieved and stored:', productData);

      foodType = await foodTypeModel.create(productData);
      // console.log('Product data retrieved and stored:', productData);
    }

    // Create a food item instance for the user
    const expirationDate = new Date();
    const days = foodType?.shelfLifeDays;
    if (typeof days === 'number' && Number.isFinite(days)) {
      expirationDate.setDate(expirationDate.getDate() + days);
    }

    const foodItem = await foodItemModel.create({
      userId: req.user!._id,
      typeId: foodType!._id,
      expirationDate: expirationDate,
      percentLeft: 100,
    });
    const response = {
      foodItem: foodItem,
      foodType: foodType,
    };

    console.log('FoodItem created:', response);
    return res.status(200).json({ success: true, response });
  } catch (err: any) {
    console.error('Error handling barcode:', err.message || err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
