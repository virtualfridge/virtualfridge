import { HOBBIES } from '../config/constants';

export interface GetAllHobbiesResponse {
  message: string;
  data?: {
    hobbies: typeof HOBBIES;
  };
}
