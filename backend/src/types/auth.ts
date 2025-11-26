import { z } from 'zod';

import { IUser } from './user';

// Zod schemas
// ------------------------------------------------------------
export const authenticateUserSchema = z.object({
  idToken: z.string().min(1, 'Google token is required'),
});

// Request types
// ------------------------------------------------------------
export type AuthenticateUserRequest = z.infer<typeof authenticateUserSchema>;

export interface AuthenticateUserResponse {
  message: string;
  data?: AuthResult;
}

// Generic types
// ------------------------------------------------------------
export interface AuthResult {
  token: string;
  user: IUser;
}
