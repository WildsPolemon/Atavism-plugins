export interface SlotProfile {
  id?: number;
  name: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  slot_id?: string;
}

export interface SlotInProfile {
  id?: number;
  slot_profile_id: number;
  slot_id: number;
}
