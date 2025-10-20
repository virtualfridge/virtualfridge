import { HOBBIES } from '../config/constants';

export type GetAllHobbiesResponse = {
  message: string;
  data?: {
    hobbies: typeof HOBBIES;
  };
};
