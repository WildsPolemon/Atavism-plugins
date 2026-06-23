export interface ActiveDateTime {
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

export interface Dialogue extends ActiveDateTime {
  id?: number;
  name: string;
  openingDialogue: boolean;
  repeatable: boolean;
  prereqDialogue: number;
  prereqQuest: number;
  prereqFaction: number;
  prereqFactionStance: number;
  reactionAutoStart: boolean;
  text: string;
  audioClip: string;
  action?: string[] | string | number[] | number;
  actionID?: string[] | string | number[] | number;
  itemReq?: string[] | string | number[] | number;
  actions?: DialogueAction[];
}

export interface DialogueAction extends ActiveDateTime {
  id?: number;
  canvasId?: number;
  dialogueID: number;
  actionOrder: number;
  reqOpenedQuest: number;
  reqCompletedQuest: number;
  excludingQuest: number;
  audioClip: string;
  text: string;
  action: string;
  actionID: number;
  actionID_bank?: number;
  itemReq: number;
  itemReqConsume: boolean;
  currency: number;
  currencyAmount: number;
  requirements?: DialogueActionsRequirements[];
}

export interface DialogueActionsRequirements extends ActiveDateTime {
  id?: number;
  dialogue_action_id?: number;
  editor_option_type_id: number;
  editor_option_choice_type_id: string;
  required_value: number;
}

export enum actionTypes {
  Dialogue = 'Dialogue',
  Quest = 'Quest',
  Ability = 'Ability',
  Repair = 'Repair',
  Merchant = 'Merchant',
  GuildMerchant = 'GuildMerchant',
  Bank = 'Bank',
  Auction = 'Auction',
  Mail = 'Mail',
  GearModification = 'GearModification',
  GuildWarehouse = 'GuildWarehouse',
  QuestProgress = 'QuestProgress',
}
