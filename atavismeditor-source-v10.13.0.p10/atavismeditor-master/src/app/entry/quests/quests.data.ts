export interface Quest {
  id: number;
  name: string;
  category: number;
  faction: number;
  chain: string;
  level: number;
  zone: string;
  numGrades: number;
  repeatable: boolean;
  description: string;
  objectiveText: string;
  progressText: string;
  completionText: string;
  deliveryItem1: number;
  deliveryItem2: number;
  deliveryItem3: number;
  questPrereq: number;
  questStartedReq: number;
  experience: number;
  currency1: number;
  currency1count: number;
  currency2: number;
  currency2count: number;
  rep1: number;
  rep1gain: number;
  rep2: number;
  rep2gain: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  items?: QuestItem[];
  chooseItems?: QuestItem[];
  requirements?: QuestRequirement[];
  objectives?: QuestObjective[];
}

export interface QuestItem {
  id?: number;
  quest_id: number;
  item: number;
  count: number;
  choose: boolean;
  rewardLevel: number;
}

export interface QuestRequirement {
  id?: number;
  quest_id: number;
  editor_option_type_id: number;
  editor_option_choice_type_id: string | number;
  required_value: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}

export interface QuestObjective {
  id?: number;
  questID: number;
  primaryObjective: boolean;
  objectiveType: string;
  target: number;
  targetCount: number;
  targetText: string;
  targets: string;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}
