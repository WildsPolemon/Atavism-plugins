export enum Requirements {
  LEVEL = 74,
  SKILL = 75,
  RACE = 76,
  CLASS = 77,
  STAT = 78,
  GUILD_LEVEL = 400,
}

export interface EditorOption {
  id: number;
  optionType: string;
  deletable: boolean;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  option?: EditorOptionChoice[];
  choices?: EditorOptionChoice[];
}

export interface EditorOptionChoice {
  id: number;
  optionTypeID: number;
  choice: string;
  deletable: boolean;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}
