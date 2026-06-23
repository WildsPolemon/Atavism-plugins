import {Injectable} from '@angular/core';
import {DialogueService} from '../dialogue.service';
import {actionTypes, Dialogue, DialogueAction} from '../dialogue.data';
import {DialogueNodeData, ParsedAction, ParsedDialogue} from './dialogue-node';
import {FactionsService} from '../../factions/factions.service';
import {DropdownItemsService} from '../../dropdown-items.service';
import {TranslateService} from '@ngx-translate/core';

@Injectable()
export class ReteDialogueHelperService {
  private notSelected = this.translate.instant('SETTINGS.NOT_SELECTED');

  constructor(
    private readonly translate: TranslateService,
    private readonly dialogueService: DialogueService,
    private readonly factionsService: FactionsService,
    private readonly dropdownItemService: DropdownItemsService,
  ) {}

  name(data: DialogueNodeData): string {
    if ((data as DialogueNodeData).type === actionTypes.Dialogue) {
      return ((data as DialogueNodeData).dialogue as Dialogue).name + ' (' + actionTypes.Dialogue + ')';
    }
    return this.updateNodeName(data.type as actionTypes, (data as DialogueNodeData).baseAction.actionID as number);
  }

  parseDialogue(dialogue: Dialogue): ParsedDialogue {
    const prereqDialogue = dialogue.prereqDialogue
      ? this.dialogueService.dialoguesList.find((item) => item.id === dialogue.prereqDialogue)
      : undefined;
    const prereqQuest = dialogue.prereqQuest
      ? this.dialogueService.questsList.find((item) => item.id === dialogue.prereqQuest)
      : undefined;
    const faction = dialogue.prereqFaction
      ? this.dialogueService.factionsList.find((item) => item.id === dialogue.prereqFaction)
      : undefined;
    const factionStance = this.factionsService.stancesList.find((item) => item.id === dialogue.prereqFactionStance);
    return {
      openingDialogue: dialogue.openingDialogue,
      repeatable: dialogue.repeatable,
      prereqDialogue: prereqDialogue ? prereqDialogue.value : this.notSelected,
      prereqQuest: prereqQuest ? prereqQuest.value : this.notSelected,
      prereqFaction: faction ? faction.value : this.notSelected,
      prereqFactionStance: factionStance ? factionStance.value : this.notSelected,
      text: dialogue.text,
      audioClip: dialogue.audioClip,
    };
  }

  async parseAction(action: DialogueAction): Promise<ParsedAction> {
    const reqOpenedQuest = action.reqOpenedQuest
      ? this.dialogueService.questsList.find((item1) => item1.id === action.reqOpenedQuest)
      : undefined;
    const reqCompletedQuest = action.reqCompletedQuest
      ? this.dialogueService.questsList.find((item2) => item2.id === action.reqCompletedQuest)
      : undefined;
    const excludingQuest = action.excludingQuest
      ? this.dialogueService.questsList.find((item3) => item3.id === action.excludingQuest)
      : undefined;
    const item = action.itemReq ? await this.dropdownItemService.getItem(action.itemReq) : '';
    const currency = action.currency
      ? this.dialogueService.currenciesList.find((item4) => item4.id === action.currency)
      : undefined;
    return {
      reqOpenedQuest: reqOpenedQuest ? reqOpenedQuest.value : this.notSelected,
      reqCompletedQuest: reqCompletedQuest ? reqCompletedQuest.value : this.notSelected,
      excludingQuest: excludingQuest ? excludingQuest.value : this.notSelected,
      audioClip: action.audioClip,
      text: action.text,
      actionOrder: action.actionOrder,
      itemReq: item ? item.value : this.notSelected,
      itemReqConsume: this.translate.instant('GENERAL.' + (action.itemReqConsume ? 'YES' : 'NO')),
      currency: currency ? currency.value : this.notSelected,
      currencyAmount: action.currencyAmount ? action.currencyAmount : 0,
      requirements: action.requirements ? action.requirements.length : 0,
    };
  }

  updateNodeName(action: actionTypes, actionId: number): string {
    const actionTranslation = this.getActionType(action);
    let name: string = actionTranslation;
    if (action === actionTypes.Quest || action === actionTypes.QuestProgress) {
      const quest = this.dialogueService.questsList.find((item) => item.id === actionId);
      if (quest) {
        name = quest.value + ' (' + actionTranslation + ')';
      }
    } else if (action === actionTypes.Ability) {
      const ability = this.dialogueService.abilitiesList.find((item) => item.id === actionId);
      if (ability) {
        name = ability.value + ' (' + actionTranslation + ')';
      }
    } else if (action === actionTypes.Dialogue) {
      const dialogue = this.dialogueService.dialoguesList.find((item) => item.id === actionId);
      if (dialogue) {
        name = dialogue.value + ' (' + actionTranslation + ')';
      }
    } else if (action === actionTypes.Merchant) {
      const merchant = this.dialogueService.merchantsList.find((item) => item.id === actionId);
      if (merchant) {
        name = merchant.value + ' (' + actionTranslation + ')';
      }
    } else if (action === actionTypes.Auction) {
      const auction = this.dialogueService.auctionProfilesList.find((item) => item.id === actionId);
      if (auction) {
        name = auction.value + ' (' + actionTranslation + ')';
      }
    } else if (action === actionTypes.Bank) {
      name = actionId + ' (' + actionTranslation + ')';
    }
    return name;
  }

  getActionType(action: actionTypes): string {
    const item = this.dialogueService.actionList.find((aItem) => aItem.id === action);
    return item ? item.value : '';
  }
}
