import {Node} from 'rete';
import {actionTypes, Dialogue, DialogueAction} from '../dialogue.data';

export interface DialogueNodeData {
  main: boolean;
  type: actionTypes;
  parent: number[];
  dialogue?: Dialogue;
  actions: DialogueAction[];
  baseAction: DialogueAction;
  parsedDialogue?: ParsedDialogue;
  parsedAction?: ParsedAction;
  name?: string;
  [key: string]: unknown;
}

export interface DialogueNode extends Node {
  saved?: boolean;
  data: DialogueNodeData;
}

export interface ParsedAction {
  reqOpenedQuest: string;
  reqCompletedQuest: string;
  excludingQuest: string;
  audioClip: string;
  text: string;
  itemReq: string;
  itemReqConsume: string;
  currency: string;
  currencyAmount: number;
  requirements: number;
  actionOrder: number;
}

export interface ParsedDialogue {
  openingDialogue: boolean;
  repeatable: boolean;
  prereqDialogue: string;
  prereqQuest: string;
  prereqFaction: string;
  prereqFactionStance: string;
  text: string;
  audioClip: string;
}
