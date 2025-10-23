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
const mapProductData = (product: any) => {
  const expirationDate =
    product.expiration_date ||
    product.expiry_date ||
    product['expiration_date'] ||
    null;

  return {
    name: product.product_name_en || product.product_name || null,
    brand: product.brands || null,
    quantity: product.quantity || null,
    ingredients: product.ingredients_text_en || product.ingredients_text || null,
    image: product.image_url || null,
    expiration_date: expirationDate,
    allergens:
      product.allergens_hierarchy
        ?.filter((a: string) => a.startsWith('en:'))
        .map((a: string) => a.replace(/^en:/, '')) || null,
    nutrients: {
      calories: product.nutriments?.['energy-kcal_100g'] ?? null,
      energy_kj: product.nutriments?.['energy-kj_100g'] ?? null,
      protein: product.nutriments?.proteins_100g ?? null,
      fat: product.nutriments?.fat_100g ?? null,
      saturated_fat: product.nutriments?.['saturated-fat_100g'] ?? null,
      monounsaturated_fat:
        product.nutriments?.['monounsaturated-fat_100g'] ?? null,
      polyunsaturated_fat:
        product.nutriments?.['polyunsaturated-fat_100g'] ?? null,
      trans_fat: product.nutriments?.['trans-fat_100g'] ?? null,
      cholesterol: product.nutriments?.cholesterol_100g ?? null,
      carbs: product.nutriments?.carbohydrates_100g ?? null,
      sugars: product.nutriments?.['sugars_100g'] ?? null,
      fiber: product.nutriments?.['fiber_100g'] ?? null,
      salt: product.nutriments?.['salt_100g'] ?? null,
      sodium: product.nutriments?.['sodium_100g'] ?? null,
      caffeine: product.nutriments?.['caffeine_100g'] ?? null,
    },
    minerals: {
      calcium: product.nutriments?.['calcium_100g'] ?? null,
      iron: product.nutriments?.['iron_100g'] ?? null,
      magnesium: product.nutriments?.['magnesium_100g'] ?? null,
      potassium: product.nutriments?.['potassium_100g'] ?? null,
      sodium: product.nutriments?.['sodium_100g'] ?? null,
      zinc: product.nutriments?.['zinc_100g'] ?? null,
    },
    category_properties: product.category_properties ?? null,
  };
};

const fetchProductData = async (barcode: string) => {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?lc=en`;
  const response = await axios.get(url);

  if (!response.data || !response.data.product) {
    throw new Error('Product not found in OpenFoodFacts');
  }

  return mapProductData(response.data.product);
};

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
    let productData: ReturnType<typeof mapProductData>;

    try {
      productData = await fetchProductData(barcode);
    } catch (error) {
      console.error('Failed to fetch product details', error);
      return res.status(404).json({ message: 'Product not found in OpenFoodFacts' });
    }

    if (foodType == null) {
      const nutritionalInfo =
        productData?.nutrients && productData.nutrients.calories
          ? {
              energyKcal: {
                value: productData.nutrients.calories,
                unit: 'kcal/100g',
              },
              proteins: productData.nutrients.protein
                ? { value: productData.nutrients.protein, unit: 'g/100g' }
                : undefined,
              fat: productData.nutrients.fat
                ? { value: productData.nutrients.fat, unit: 'g/100g' }
                : undefined,
              carbohydrates: productData.nutrients.carbs
                ? { value: productData.nutrients.carbs, unit: 'g/100g' }
                : undefined,
              salt: productData.nutrients.salt
                ? { value: productData.nutrients.salt, unit: 'g/100g' }
                : undefined,
            }
          : undefined;

      foodType = await foodTypeModel.create({
        name: productData?.name ?? 'Unknown product',
        barcodeId: barcode,
        nutritionalInfo,
      });
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

    return res.status(200).json({
      message: 'Barcode processed successfully.',
      data: productData,
    });
  } catch (err: any) {
    console.error('Error handling barcode:', err.message || err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


export default router;
