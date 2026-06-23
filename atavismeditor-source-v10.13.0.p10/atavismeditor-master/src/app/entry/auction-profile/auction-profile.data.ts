export interface AuctionHouseProfile {
  id?: number;
  name: string;
  cost_price_value: number;
  cost_price_value_percentage: number;
  currency: number;
  duration: number;
  display_limit: number;
  own_limit: number;
  start_price_value: number;
  start_price_percentage: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}
