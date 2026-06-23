export interface PvpRank{
  id?: number;
  title: string;
  // description: string;
  value: number;
  currency_id: number;
  currency_increase: number;
  currency_reduce: number;
  diff_below: string;
  diff_above: string;
  icon: string;
  icon2: string;
  effect_id: number;
  //isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  diffb?: Diffs[];
  diffa?: Diffs[];
}

export interface Diffs {
  leveldiff: number;
  currency_increase_diff: number;
  currency_reduce_diff: number;
}
