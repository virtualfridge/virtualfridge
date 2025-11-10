import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userModel } from '../models/user';

const router = Router();

/**
 * TEST-ONLY ENDPOINT: Create or get test user and return JWT
 *
 * This endpoint should ONLY be used in test/development environments.
 * It bypasses Google authentication and creates a test user.
 */
router.post('/test-user', async (req: Request, res: Response) => {
  try {
    const testGoogleId = 'test-google-id-e2e-testing';
    const testEmail = 'test-user@virtualfridge.test';
    const testName = 'Test User';

    // Find or create test user
    let user = await userModel.findByGoogleId(testGoogleId);

    if (!user) {
      user = await userModel.create({
        googleId: testGoogleId,
        email: testEmail,
        name: testName,
        profilePicture: '',
      });
    }

    // Generate JWT token (use 'id' to match auth middleware expectation)
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          bio: user.bio || '',
          profilePicture: user.profilePicture,
          hobbies: user.hobbies || [],
        },
      },
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return res.status(500).json({ message: 'Test authentication failed' });
  }
});

export default router;
