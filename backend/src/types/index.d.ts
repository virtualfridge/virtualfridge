declare global {
  namespace Express {
    interface Request {
      user?: import('./user').IUser;
    }
  }
}
export {};
