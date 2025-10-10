import mongoose, { Document } from 'mongoose';
import { NutritionalInfo } from './foodItem';

export interface IFoodType extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  shelfLifeDays: number;
  nutritionalInfo?: NutritionalInfo;
}
