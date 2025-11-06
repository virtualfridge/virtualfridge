// TODO: use zod
export interface ExpiringItemResponse {
  message: string;
  data?: {
    expiringItemsCount: number;
    expiringItems: ExpiringItem[];
  };
}

export interface ExpiringItem {
  name: string;
  expirationDate: Date;
}
