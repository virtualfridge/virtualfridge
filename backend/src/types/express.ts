import { IUser } from './user';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
