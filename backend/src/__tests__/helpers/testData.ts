import mongoose from 'mongoose';
import { IUser } from '../../types/user';
import { FoodType } from '../../types/foodType';
import { FoodItem } from '../../types/foodItem';

export const mockUser: Partial<IUser> = {
  googleId: 'test-google-id-123',
  email: 'test@example.com',
  name: 'Test User',
  profilePicture: 'https://example.com/profile.jpg',
  bio: 'Test bio',
};

export const mockFoodType: Partial<FoodType> = {
  name: 'Apple',
  nutrients: {
    calories: '52',
    protein: '0.3g',
    carbohydrates: '14g',
    sugars: '10g',
    fiber: '2.4g',
  },
  shelfLifeDays: 14,
  barcodeId: '123456789',
};

export const mockFoodItem = (userId: mongoose.Types.ObjectId, typeId: mongoose.Types.ObjectId): Partial<FoodItem> => ({
  userId,
  typeId,
  expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  percentLeft: 100,
});

export const mockGoogleUserInfo = {
  googleId: 'test-google-id-456',
  email: 'newuser@example.com',
  name: 'New Test User',
  profilePicture: 'https://example.com/newprofile.jpg',
};
