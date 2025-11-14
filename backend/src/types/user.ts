import mongoose, { Document } from 'mongoose';
import z from 'zod';

// User model
// ------------------------------------------------------------
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  googleId: string;
  email: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
  dietaryPreferences?: DietaryPreferences;
  notificationPreferences?: NotificationPreferences;
  fcmToken?: string;
}

// TODO: expand/reduce as necessary
export interface DietaryPreferences {
  vegetarian?: boolean;
  vegan?: boolean;
  halal?: boolean;
  keto?: boolean;
}

// TODO: expand/reduce as necessary
export interface NotificationPreferences {
  enableNotifications: boolean;
  expiryThresholdDays?: number;
  notificationTime?: number;
};

// Zod schemas
// ------------------------------------------------------------
export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  googleId: z.string().min(1),
  profilePicture: z.string().optional(),
  bio: z.string().max(500).optional(),
  dietaryPreferences: z
    .object({
      vegetarian: z.boolean().optional(),
      vegan: z.boolean().optional(),
      halal: z.boolean().optional(),
      keto: z.boolean().optional(),
    })
    .optional(),
  notificationPreferences: z
    .object({
      enableNotifications: z.boolean(),
      expiryThresholdDays: z.uint32().optional(),
      notificationTime: z.uint32().optional(),
    })
    .optional(),
  fcmToken: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().max(500).optional(),
  profilePicture: z.string().min(1).optional(),
  dietaryPreferences: z
    .object({
      vegetarian: z.boolean().optional(),
      vegan: z.boolean().optional(),
      halal: z.boolean().optional(),
      keto: z.boolean().optional(),
    })
    .optional(),
  notificationPreferences: z
    .object({
      enableNotifications: z.boolean(),
      expiryThresholdDays: z.uint32().optional(),
      notificationTime: z.uint32().optional(),
    })
    .optional(),
  fcmToken: z.string().optional(),
});

// Request types
// ------------------------------------------------------------
export interface GetProfileResponse {
  message: string;
  data?: {
    user: IUser;
  };
};

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

// Generic types
// ------------------------------------------------------------
export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  profilePicture?: string;
};
