export interface SlotGroup {
  id?: number;
  name: string;
  all_slots: boolean;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  slot_id?: string;
}

export interface SlotInGroup {
  id?: number;
  slot_group_id: number;
  slot_id: number;
}
