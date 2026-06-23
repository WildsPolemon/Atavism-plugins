export interface Slot {
  id?: number;
  name: string;
  type: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  slotsSets?: SlotsSets[],
}


export interface SlotsSets {
  id?: number;
  slot_id: number;
  set_id: number;
  race: number;
  class: number;
  creationtimestamp: string;
  updatetimestamp: string;
}
