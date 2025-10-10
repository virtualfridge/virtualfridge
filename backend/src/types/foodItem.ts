import mongoose, { Document } from 'mongoose';

export interface IFoodItem extends Document {
  _id: mongoose.Types.ObjectId;
  typeId: mongoose.Types.ObjectId;
  barcodeId?: string;
  expirationDate: Date;
  nutritionalInfo: NutritionalInfo;
  amount: number;
  amountUnit: string; // TODO: consider using a Unit enum for all units
}

export type NutrientInfo = {
  value: number;
  unit: string;
  perSourceValue: number;
  perSourceUnit: string;
};
export type NutritionalInfo = {
  energy?: NutrientInfo;
  energyKcal?: NutrientInfo;
  energyKj?: NutrientInfo;
  fat?: NutrientInfo;
  saturatedFat?: NutrientInfo;
  transFat?: NutrientInfo;
  cholesterol?: NutrientInfo;
  salt?: NutrientInfo;
  sodium?: NutrientInfo;
  carbohydrates?: NutrientInfo;
  carbohydratesTotal?: NutrientInfo;
  fiber?: NutrientInfo;
  sugars?: NutrientInfo;
  addedSugars?: NutrientInfo;
  proteins?: NutrientInfo;
  vitaminD?: NutrientInfo;
  calcium?: NutrientInfo;
  iron?: NutrientInfo;
  potassium?: NutrientInfo;
};
