import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import type { AuthResult } from './auth.types';
import type { GoogleUserInfo, IUser } from './user.types';
import logger from './logger.util';
import { userModel } from './user.model';

export class AuthService {
  private googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  private async verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      if (!payload.email || !payload.name) {
        throw new Error('Missing required user information from Google');
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        profilePicture: payload.picture,
      };
    } catch (error) {
      logger.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  }

  private generateAccessToken(user: IUser): string {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: '19h',
    });
  }

  async signUpWithGoogle(idToken: string): Promise<AuthResult> {
    try {
      const googleUserInfo = await this.verifyGoogleToken(idToken);

      // Check if user already exists
      const existingUser = await userModel.findByGoogleId(
        googleUserInfo.googleId
      );
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create new user
      const user = await userModel.create(googleUserInfo);
      const token = this.generateAccessToken(user);

      return { token, user };
    } catch (error) {
      logger.error('Sign up failed:', error);
      throw error;
    }
  }

  async signInWithGoogle(idToken: string): Promise<AuthResult> {
    try {
      const googleUserInfo = await this.verifyGoogleToken(idToken);

      // Find existing user
      const user = await userModel.findByGoogleId(googleUserInfo.googleId);
      if (!user) {
        throw new Error('User not found');
      }

      const token = this.generateAccessToken(user);

      return { token, user };
    } catch (error) {
      logger.error('Sign in failed:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
