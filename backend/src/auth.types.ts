import { z } from 'zod';

import { IUser } from './user.types';

// Zod schemas
// ------------------------------------------------------------
export const authenticateUserSchema = z.object({
  idToken: z.string().min(1, 'Google token is required'),
});

// Request types
// ------------------------------------------------------------
export type AuthenticateUserRequest = z.infer<typeof authenticateUserSchema>;

export type AuthenticateUserResponse = {
  message: string;
  data?: AuthResult;
};

// Generic types
// ------------------------------------------------------------
export type AuthResult = {
  token: string;
  user: IUser;
};

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
