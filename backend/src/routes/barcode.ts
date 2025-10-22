import { Router } from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth';
import { foodTypeModel } from '../models/foodType';
import { foodItemModel } from '../models/foodItem';

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
      const expirationDate =
        product.expiration_date ||
        product.expiry_date ||
        product['expiration_date'] ||
        null;

    // const shelfLife =
    //   product.conservation_conditions ||
    //   product.storage_instructions ||
    //   product.packaging_text ||
    //   null;

    // Extract English-only product data
    const productData = {
      name: product.product_name_en || null,
      brand: product.brands || null,
      quantity: product.quantity || null,
      ingredients: product.ingredients_text_en || null,
      image: product.image_url || null,
      expiration_date: expirationDate,
      allergens: product.allergens_hierarchy
        ?.filter((a: string) => a.startsWith('en:'))
        .map((a: string) => a.replace(/^en:/, '')) || null,
      nutrients: {
        calories: product.nutriments?.['energy-kcal_100g'] || null,
        energy_kj: product.nutriments?.['energy-kj_100g'] || null,
        protein: product.nutriments?.proteins_100g || null,
        fat: product.nutriments?.fat_100g || null,
        saturated_fat: product.nutriments?.['saturated-fat_100g'] || null,
        monounsaturated_fat: product.nutriments?.['monounsaturated-fat_100g'] || null,
        polyunsaturated_fat: product.nutriments?.['polyunsaturated-fat_100g'] || null,
        trans_fat: product.nutriments?.['trans-fat_100g'] || null,
        cholesterol: product.nutriments?.cholesterol_100g || null,
        carbs: product.nutriments?.carbohydrates_100g || null,
        sugars: product.nutriments?.['sugars_100g'] || null,
        fiber: product.nutriments?.['fiber_100g'] || null,
        salt: product.nutriments?.['salt_100g'] || null,
        sodium: product.nutriments?.['sodium_100g'] || null,
        // vitamins: {
        //   vitamin_a: product.nutriments?.['vitamin-a_100g'] || null,
        //   vitamin_c: product.nutriments?.['vitamin-c_100g'] || null,
        //   vitamin_d: product.nutriments?.['vitamin-d_100g'] || null,
        //   vitamin_e: product.nutriments?.['vitamin-e_100g'] || null,
        //   vitamin_k: product.nutriments?.['vitamin-k_100g'] || null,
        //   vitamin_b1: product.nutriments?.['vitamin-b1_100g'] || null,
        //   vitamin_b2: product.nutriments?.['vitamin-b2_100g'] || null,
        //   vitamin_b3: product.nutriments?.['vitamin-b3_100g'] || null,
        //   vitamin_b5: product.nutriments?.['vitamin-b5_100g'] || null,
        //   vitamin_b6: product.nutriments?.['vitamin-b6_100g'] || null,
        //   vitamin_b9: product.nutriments?.['vitamin-b9_100g'] || null,
        //   vitamin_b12: product.nutriments?.['vitamin-b12_100g'] || null,
        // },
        minerals: {
          calcium: product.nutriments?.['calcium_100g'] || null,
          iron: product.nutriments?.['iron_100g'] || null,
          magnesium: product.nutriments?.['magnesium_100g'] || null,
          // phosphorus: product.nutriments?.['phosphorus_100g'] || null,
          potassium: product.nutriments?.['potassium_100g'] || null,
          sodium: product.nutriments?.['sodium_100g'] || null,
          zinc: product.nutriments?.['zinc_100g'] || null,
          // copper: product.nutriments?.['copper_100g'] || null,
          // manganese: product.nutriments?.['manganese_100g'] || null,
          // selenium: product.nutriments?.['selenium_100g'] || null,
          // iodine: product.nutriments?.['iodine_100g'] || null,
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
  


    // console.log('Product data retrieved:', productData);
  }

    const expirationDate = new Date();
    const days = foodType?.shelfLifeDays;
    if (typeof days === "number" && Number.isFinite(days)) {
      expirationDate.setDate(expirationDate.getDate() + days);
    }
    
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
