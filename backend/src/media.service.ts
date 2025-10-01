import fs from 'fs';
import path from 'path';

import { IMAGES_DIR } from './hobbies';

export class MediaService {
  static async saveImage(filePath: string, userId: string): Promise<string> {
    try {
      const fileExtension = path.extname(filePath);
      const fileName = `${userId}-${Date.now()}${fileExtension}`;
      const newPath = path.join(IMAGES_DIR, fileName);

      fs.renameSync(filePath, newPath);

      return newPath.split(path.sep).join('/');
    } catch (error) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Failed to save profile picture: ${error}`);
    }
  }

  static async deleteImage(url: string): Promise<void> {
    try {
      if (url.startsWith(IMAGES_DIR)) {
        const filePath = path.join(process.cwd(), url.substring(1));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to delete old profile picture:', error);
    }
  }

  static async deleteAllUserImages(userId: string): Promise<void> {
    try {
      if (!fs.existsSync(IMAGES_DIR)) {
        return;
      }

      const files = fs.readdirSync(IMAGES_DIR);
      const userFiles = files.filter(file => file.startsWith(userId + '-'));

      await Promise.all(userFiles.map(file => this.deleteImage(file)));
    } catch (error) {
      console.error('Failed to delete user images:', error);
    }
  }
}
