import { HOBBIES } from './hobbies';

export type GetAllHobbiesResponse = {
  message: string;
  data?: {
    hobbies: typeof HOBBIES;
  };
};
