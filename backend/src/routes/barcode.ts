import { Router } from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';
import { foodTypeModel } from '../models/foodType';
import { foodItemModel } from '../models/foodItem';
import { FoodType } from '../types/foodType';
import { addDaysToDate, dateDiffInDays } from '../util/dates';

const router = Router();

/**
 * POST /barcode
 * Body: { barcode: "0123456789" }
 */
router.post('/', authenticateToken, async (req, res) => {
  // TODO:
  // - Add stricter type/error checking
  // - Split into multiple files: types, service, route
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ message: 'Missing barcode' });
    }

    console.log('Received barcode:', barcode);

    var foodType = await foodTypeModel.findByBarcode(barcode);
    if (foodType == null) {
      // Call OpenFoodFacts API with English locale
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?lc=en`;
      const response = await axios.get(url);

      // Check if the product exists
      if (!response.data || !response.data.product) {
        return res
          .status(404)
          .json({ message: 'Product not found in OpenFoodFacts' });
      }
      const product = response.data.product;

      // Extract expiration or shelf-life related info if available
      let shelfLifeDays = undefined;
      const expirationDate =
        product.expiration_date || product.expiry_date || null;
      if (expirationDate) {
        shelfLifeDays = dateDiffInDays(expirationDate, new Date());
      }

      // Extract English-only product data
      const foodTypeData: Partial<FoodType> = {
        name: product.product_name_en || null,
        brand: product.brands || null,
        // quantity: product.quantity || null,
        // ingredients: product.ingredients_text_en || null,
        image: product.image_url || null,
        shelfLifeDays: shelfLifeDays,
        allergens:
          product.allergens_hierarchy
            ?.filter((a: string) => a.startsWith('en:'))
            .map((a: string) => a.replace(/^en:/, '')) || null,
        nutrients: {
          calories: product.nutrients?.['energy-kcal_100g'] || null,
          energyKj: product.nutrients?.['energy-kj_100g'] || null,
          protein: product.nutrients?.proteins_100g || null,
          fat: product.nutrients?.fat_100g || null,
          saturatedFat: product.nutrients?.['saturated-fat_100g'] || null,
          monounsaturatedFat:
            product.nutrients?.['monounsaturated-fat_100g'] || null,
          polyunsaturatedFat:
            product.nutrients?.['polyunsaturated-fat_100g'] || null,
          transFat: product.nutrients?.['trans-fat_100g'] || null,
          cholesterol: product.nutrients?.cholesterol_100g || null,
          carbohydrates: product.nutrients?.carbohydrates_100g || null,
          sugars: product.nutrients?.['sugars_100g'] || null,
          fiber: product.nutrients?.['fiber_100g'] || null,
          salt: product.nutrients?.['salt_100g'] || null,
          sodium: product.nutrients?.['sodium_100g'] || null,
          calcium: product.nutrients?.['calcium_100g'] || null,
          iron: product.nutrients?.['iron_100g'] || null,
          potassium: product.nutrients?.['potassium_100g'] || null,
        },
        // other: {
          // alcohol: product.nutriments?.['alcohol_100g'] || null,
          caffeine: product.nutriments?.['caffeine_100g'] || null,
        //   water: product.nutriments?.['water_100g'] || null,
        // }
      },

      category_properties: {
        ciqual_food_name: product.category_properties?.['ciqual_food_name:en'] || null,
      },
    };

    foodType = await foodTypeModel.create(productData);
  

      // Does not already exist so we save it
      foodType = await foodTypeModel.create(foodTypeData);
    }

    const expirationDate = addDaysToDate(new Date(), foodType.shelfLifeDays);

    const foodItem = await foodItemModel.create({
      userId: req.user!._id,
      typeId: foodType._id,
      expirationDate: expirationDate,
      percentLeft: 100,
    });

    // Print for debugging
    console.log('FoodItem created', foodItem);

    return res.status(200).json({ success: true, foodItem: foodItem });
  } catch (err: any) {
    console.error('Error handling barcode:', err.message || err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;
