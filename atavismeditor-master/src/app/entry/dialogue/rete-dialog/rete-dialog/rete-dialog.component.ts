import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {Component as ReteComponent, Engine, Input, Node, NodeEditor, Output} from 'rete';
// @ts-ignore
import {AngularRenderPlugin} from 'vasko-retejs-angular-render-plugin';
// @ts-ignore
import AreaPlugin from 'rete-area-plugin';
// @ts-ignore
import AutoArrangePlugin from 'rete-auto-arrange-plugin';
// @ts-ignore
import ConnectionPathPlugin from 'rete-connection-path-plugin';
import ConnectionPlugin from 'rete-connection-plugin';
// @ts-ignore
import ContextMenuPlugin from 'rete-context-menu-plugin';
// @ts-ignore
import MinimapPlugin from 'rete-minimap-plugin';
import {NodeData} from 'rete/types/core/data';
import {v4 as uuid} from 'uuid';
import {LoadingService} from '../../../../components/loading/loading.service';
import {NotificationService} from '../../../../services/notification.service';
import {actionTypes, Dialogue, DialogueAction} from '../../dialogue.data';
import {DialogueService} from '../../dialogue.service';
import {CustomNodeComponent} from '../components/custom-node.component';
import {DialogComponent} from '../components/dialog.component';
import {ItemComponent} from '../components/item.component';
import {TextControl} from '../controls/text.control';
import {DialogueNode, DialogueNodeData} from '../dialogue-node';
import {ActionSocket} from '../socket';
import {ReteDialogueHelperService} from '../rete-dialogue-helper.service';
import {interval} from 'rxjs';
import {take} from 'rxjs/operators';

@Component({
  selector: 'atv-rete-dialog',
  templateUrl: './rete-dialog.component.html',
  styleUrls: ['./rete-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ReteDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('nodeEditor') nodeEditor!: ElementRef;
  public editor!: NodeEditor;
  private listOfActions: actionTypes[] = [
    actionTypes.Dialogue,
    actionTypes.Quest,
    actionTypes.Ability,
    actionTypes.Repair,
    actionTypes.Merchant,
    actionTypes.GuildMerchant,
    actionTypes.Bank,
    actionTypes.Auction,
    actionTypes.Mail,
    actionTypes.GearModification,
    actionTypes.GuildWarehouse,
    actionTypes.QuestProgress,
  ];
  private components: Record<actionTypes, ReteComponent> = {
    [actionTypes.Dialogue]: new DialogComponent(),
    [actionTypes.Quest]: new ItemComponent(),
    [actionTypes.Ability]: new ItemComponent(),
    [actionTypes.Repair]: new ItemComponent(),
    [actionTypes.Merchant]: new ItemComponent(),
    [actionTypes.GuildMerchant]: new ItemComponent(),
    [actionTypes.Bank]: new ItemComponent(),
    [actionTypes.Auction]: new ItemComponent(),
    [actionTypes.Mail]: new ItemComponent(),
    [actionTypes.GearModification]: new ItemComponent(),
    [actionTypes.GuildWarehouse]: new ItemComponent(),
    [actionTypes.QuestProgress]: new ItemComponent(),
  };
  private list: number[] = [];
  private dialogHeight = 565;
  private itemHeight = 340;
  private itemWidth = 360;
  private itemLeftSpace = 120;
  private itemBottomSpace = 40;
  private sizes: {x: number; y: number}[] = [];
  private mousePosition: {x: number; y: number} | undefined = undefined;
  private readonly mainDialogId!: number;
  private doubleRemove = false;

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    public matDialogRef: MatDialogRef<ReteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: {id: number},
    private readonly dialogueService: DialogueService,
    private readonly loadingService: LoadingService,
    private readonly translateService: TranslateService,
    private readonly reteDialogueHelperService: ReteDialogueHelperService,
    private readonly notificationService: NotificationService,
  ) {
    this.loadingService.show();
    if (!this.data.id) {
      this.matDialogRef.close();
      return;
    }
    this.mainDialogId = this.data.id;
    this.dialogueService.init();
  }

  public async ngAfterViewInit(): Promise<void> {
    if (this.nodeEditor) {
      const dialogue = await this.dialogueService.getDialogue(this.mainDialogId);
      if (!dialogue) {
        this.matDialogRef.close();
        return;
      }
      this.prepareEditor();
      const node = (await this.components[actionTypes.Dialogue].createNode()) as unknown as DialogueNode;
      node.position = [0, 80];
      node.id = uuid() as any;
      node.data = {
        main: true,
        dialogue,
        parent: [],
        actions: [],
        baseAction: {
          action: actionTypes.Dialogue,
          actionID: dialogue.id,
          text: '',
        } as DialogueAction,
        type: actionTypes.Dialogue,
      };
      this.updateNodeData(node);
      this.editor.addNode(node as unknown as Node);
      this.list.push(dialogue.id as number);
      this.sizes[0] = {
        x: 0,
        y: 2 * this.itemBottomSpace + this.dialogHeight + this.itemBottomSpace,
      };
      await this.buildLevel({...dialogue}, node, 0, this.itemWidth + this.itemLeftSpace, 0);
      setTimeout(() => {
        AreaPlugin.zoomAt(this.editor, this.editor.nodes);
        this.changeDetectorRef.detectChanges();
        this.loadingService.hide();
      }, 1000);
    }
  }

  public ngOnDestroy(): void {
    this.editor.destroy();
  }

  /**
   * Edit dialogue which is assign to node.
   * Important is that while we update everything directly in dialogue object
   * we don't need to get data from different sources
   *
   * @param node: DialogueNode
   */
  private async editDialogue(node: DialogueNode): Promise<void> {
    const nodeDataDialogue = {...node.data.dialogue};
    const usedDialogues: number[] = nodeDataDialogue.actions
      .filter((action) => action.action === actionTypes.Dialogue)
      .map((action) => action.actionID);
    const dialogue = await this.dialogueService.updateDialogue(nodeDataDialogue, usedDialogues);
    if (dialogue) {
      const currentNode = this.getNode(node.id);
      currentNode.outputs.forEach((output) => {
        const actionNumberId = Number(output.key.replace('action_', ''));
        const existedAction = [...dialogue.actions].find((action) => action.id === actionNumberId);
        const newAction = [...nodeDataDialogue.actions].find((action) => action.id === actionNumberId);
        if (!existedAction || !newAction) {
          if (output.connections.length > 0) {
            this.editor.removeConnection(output.connections[0]);
            const actionNumber = output.key.replace('action_', '');
            currentNode.outputs.delete(output.key);
            currentNode.controls.delete('text_' + actionNumber);
            currentNode.update();
          }
        }
      });
      currentNode.data.name = dialogue.name + ' (' + actionTypes.Dialogue + ')';
      currentNode.data.dialogue = dialogue;
      await this.updateNodeData(currentNode);
      const level = Math.max(currentNode.position[0] / (this.itemWidth + this.itemLeftSpace));
      if (!this.sizes[level]) {
        this.sizes[level] = {
          x: (level - 1) * (this.itemWidth + this.itemLeftSpace),
          y: level * -80,
        };
      }
      const xAxis = this.sizes[level + 1]
        ? this.sizes[level + 1].x
        : this.sizes[level].x + this.itemWidth + this.itemLeftSpace;
      const yAxis = this.sizes[level + 1] ? this.sizes[level + 1].y : level * -80;
      await this.buildLevel({...dialogue}, currentNode, level, xAxis, yAxis);
    }
    this.loadingService.hide();
  }

  /**
   * Create / Update nodes based on adding/editing Dialogue actions
   *
   * @param actions List of Dialogue actions
   * @param currentNode Optional DialogueNode
   */
  private async addSubItem(actions: DialogueAction[], currentNode?: DialogueNode): Promise<void> {
    let baseActionChanged = false;
    const connections: Record<number, number> = {};
    if (currentNode) {
      this.mousePosition = undefined;
      /**
       * Check if current node actions contain baseAction.
       * That mean that during edit of dialogue actions user can change any action,
       * and everything inside:
       *  - if there is baseAction, we just update it.
       *  - if there are no baseAction in actions,
       *      first same type of action will be baseAction
       *      first action will be baseAction
       */
      if (currentNode.data.actions.length > 0) {
        let baseAction = currentNode.data.baseAction;
        const existedBaseAction = actions.find(({id}) => id === baseAction.id);
        if (!existedBaseAction) {
          const firstTypeOccurrence = actions.find(({action}) => action === baseAction.action);
          if (firstTypeOccurrence) {
            currentNode.data.baseAction = firstTypeOccurrence;
          } else {
            currentNode.data.baseAction = actions[0];
          }
          baseActionChanged = true;
        } else {
          if (
            currentNode.data.baseAction.action !== existedBaseAction.action ||
            currentNode.data.baseAction.actionID !== existedBaseAction.actionID
          ) {
            baseActionChanged = true;
          }
          currentNode.data.baseAction = existedBaseAction;
        }
        baseAction = currentNode.data.baseAction;
        currentNode.data.type = baseAction.action as actionTypes;
        await this.updateNodeData(currentNode);
        currentNode.data.actions = [];
        currentNode.data.parent = [];
        const newActions = [];
        const newParents = [];
        const levelCurrent = Math.max(currentNode.position[0] / (this.itemWidth + this.itemLeftSpace));
        if (!this.sizes[levelCurrent]) {
          this.sizes[levelCurrent] = {
            x: (levelCurrent - 1) * (this.itemWidth + this.itemLeftSpace),
            y: levelCurrent * -80,
          };
        }
        if (currentNode.data.type === actionTypes.Dialogue) {
          const dialogue = await this.dialogueService.getDialogue(baseAction.actionID);
          if (dialogue) {
            currentNode.data.dialogue = dialogue;
            this.list.push(baseAction.actionID);
            await this.buildLevel(
              {...dialogue},
              currentNode,
              levelCurrent,
              this.sizes[levelCurrent].x + this.itemWidth + this.itemLeftSpace,
              0,
            );
          }
        }
        const connectionForRemove = [];
        currentNode.inputs.get('action_in').connections.forEach((connection) => {
          const output = {...connection.output};
          const actionKeyNumber = Number(output.key.replace('action_', ''));
          connections[actionKeyNumber] = output.node.id;
          if (actionKeyNumber !== baseAction.canvasId) {
            connectionForRemove.push(connection);
          } else {
            newActions.push(baseAction);
            newParents.push((output.node.data as DialogueNodeData).dialogue.id);
            const parentNode = this.getNode(output.node.id);
            const dialogueActionIndex = parentNode.data.dialogue.actions.findIndex(({id}) => id === baseAction.id);
            if (dialogueActionIndex > -1) {
              parentNode.data.dialogue.actions[dialogueActionIndex] = baseAction;
              (parentNode.outputs.get(`action_${actionKeyNumber}`) as Output).name =
                this.reteDialogueHelperService.getActionType(baseAction.action as actionTypes);
              (parentNode.controls.get(`text_${actionKeyNumber}`) as any).setValue(baseAction.text);
              parentNode.data[`text_${actionKeyNumber}`] = baseAction.text;
              parentNode.update();
            }
          }
          this.changeDetectorRef.detectChanges();
        });

        connectionForRemove.forEach((connection) => {
          this.editor.removeConnection(connection);
          currentNode.update();
          this.changeDetectorRef.detectChanges();
        });

        if (baseActionChanged) {
          currentNode.outputs.forEach((output) => {
            if (output.connections.length > 0) {
              this.editor.removeConnection(output.connections[0]);
              const actionNumber = output.key.replace('action_', '');
              currentNode.outputs.delete(output.key);
              currentNode.controls.delete('text_' + actionNumber);
              currentNode.update();
              this.changeDetectorRef.detectChanges();
            }
          });
        }
        const usedActionIndex = actions.findIndex(({id}) => id === baseAction.id);
        actions.splice(usedActionIndex, 1);
        currentNode.data.actions = newActions;
        currentNode.data.parent = newParents;
        currentNode.update();
        this.changeDetectorRef.detectChanges();
      }
    }

    let level = Math.max(...(Object.keys(this.sizes) as unknown as number[]));
    for (const dialogueAction of actions) {
      if (this.listOfActions.includes(dialogueAction.action as actionTypes)) {
        let existingInputNode = this.editor.nodes.find(
          ({data}) =>
            data.type === dialogueAction.action &&
            (data as DialogueNodeData).actions.find(({id}) => id === dialogueAction.id),
        );
        if (!existingInputNode && dialogueAction.action === actionTypes.Dialogue) {
          existingInputNode = this.editor.nodes.find(
            ({data}) =>
              data.type === dialogueAction.action && (data.dialogue as Dialogue).id === dialogueAction.actionID,
          );
        }
        if (existingInputNode) {
          if (dialogueAction.canvasId && connections[dialogueAction.canvasId]) {
            const parentNode = this.getNode(connections[dialogueAction.canvasId]);
            if (parentNode) {
              (existingInputNode.data as DialogueNodeData).parent.push(parentNode.data.dialogue.id);
              (existingInputNode.data as DialogueNodeData).actions.push(dialogueAction);
              parentNode.data.dialogue.actions.push(dialogueAction);
              (parentNode.controls.get(`text_${dialogueAction.canvasId}`) as any).props.value = dialogueAction.text;
              parentNode.data[`text_${dialogueAction.canvasId}`] = dialogueAction.text;
              await this.updateNodeData(existingInputNode as DialogueNode);
              this.changeDetectorRef.detectChanges();
              this.createConnection(
                parentNode.outputs.get(`action_${dialogueAction.canvasId}`) as Output,
                existingInputNode.inputs.get('action_in') as Input,
              );
            }
          }
          continue;
        }
        const node = (await this.components[
          dialogueAction.action as actionTypes
        ].createNode()) as unknown as DialogueNode;
        if (this.mousePosition) {
          level = Math.round(this.mousePosition.x / this.itemWidth);
        }
        if (!this.sizes[level]) {
          this.sizes[level] = {
            x: (level - 1) * (this.itemWidth + this.itemLeftSpace),
            y: this.mousePosition ? this.mousePosition.y : 0,
          };
        }
        node.position = this.mousePosition
          ? [this.mousePosition.x, this.mousePosition.y]
          : [this.sizes[level].x, this.sizes[level].y];
        node.id = uuid() as any;
        node.data = {
          main: false,
          parent: [],
          type: dialogueAction.action as actionTypes,
          baseAction: dialogueAction,
          actions: [],
        };

        let childDialogue;
        if (dialogueAction.action === actionTypes.Dialogue) {
          childDialogue = await this.dialogueService.getDialogue(dialogueAction.actionID);
          if (childDialogue) {
            node.data.dialogue = childDialogue;
          }
        }
        await this.updateNodeData(node);
        this.editor.addNode(node as unknown as Node);

        if (dialogueAction.action === actionTypes.Dialogue && childDialogue) {
          await this.buildLevel(
            {...childDialogue},
            node,
            level,
            this.sizes[level].x + this.itemWidth + this.itemLeftSpace,
            level * -80,
          );
          this.sizes[level].y += this.dialogHeight + this.itemBottomSpace;
        } else {
          this.sizes[level].y += this.itemHeight + this.itemBottomSpace;
        }
        this.mousePosition = undefined;
        if (dialogueAction.canvasId && connections[dialogueAction.canvasId]) {
          const parentNode = this.getNode(connections[dialogueAction.canvasId]);
          if (parentNode) {
            node.data.parent.push(parentNode.data.dialogue.id);
            parentNode.data.dialogue.actions.push(dialogueAction);
            node.data.actions.push(dialogueAction);
            this.changeDetectorRef.detectChanges();
            this.createConnection(
              parentNode.outputs.get(`action_${dialogueAction.canvasId}`) as Output,
              node.inputs.get('action_in') as Input,
            );
            node.update();
          }
        }
      }
    }
    this.changeDetectorRef.detectChanges();
  }

  private async buildLevel(
    dialogue: Dialogue,
    parentNode: DialogueNode,
    level: number,
    xAxis: number,
    yAxis: number,
  ): Promise<void> {
    level += 1;
    for (const dialogueAction of dialogue.actions as DialogueAction[]) {
      if (!this.listOfActions.includes(dialogueAction.action as actionTypes)) {
        continue;
      }
      const actionId = this.createAction(parentNode, dialogueAction.id, dialogueAction.text);
      dialogueAction.canvasId = actionId;
      let existingNode = this.editor.nodes.find(
        ({data}) =>
          data.type === dialogueAction.action &&
          (data as DialogueNodeData).actions.find(({id}) => id === dialogueAction.id),
      );

      if (!existingNode && dialogueAction.action === actionTypes.Dialogue) {
        existingNode = this.editor.nodes.find(
          ({data}) => data.type === dialogueAction.action && (data.dialogue as Dialogue).id === dialogueAction.actionID,
        );
      }
      if (existingNode) {
        if (
          !(existingNode.data as DialogueNodeData).parent.includes(dialogue.id) &&
          !(existingNode.data as DialogueNodeData).actions.includes(dialogueAction)
        ) {
          (existingNode.data as DialogueNodeData).parent.push(dialogue.id);
          (existingNode.data as DialogueNodeData).actions.push(dialogueAction);
          this.createConnection(
            parentNode.outputs.get(`action_${actionId}`) as Output,
            (existingNode as Node).inputs.get('action_in') as Input,
          );
          existingNode.update();
        }
        await this.updateNodeData(existingNode as DialogueNode);
        this.changeDetectorRef.detectChanges();
        continue;
      }
      const node = (await this.components[
        dialogueAction.action as actionTypes
      ].createNode()) as unknown as DialogueNode;
      if (!this.sizes[level]) {
        this.sizes[level] = {x: xAxis, y: yAxis};
      }
      this.sizes[level] = {x: xAxis, y: this.sizes[level].y};
      if (dialogueAction.action === actionTypes.Dialogue) {
        this.list.push(dialogueAction.actionID);
      }
      node.position = [this.sizes[level].x, this.sizes[level].y];
      node.id = uuid() as any;
      node.data = {
        main: false,
        parent: [],
        type: dialogueAction.action as actionTypes,
        baseAction: dialogueAction,
        actions: [],
      };
      let childDialogue;
      if (node.data.type === actionTypes.Dialogue) {
        childDialogue = await this.dialogueService.getDialogue(dialogueAction.actionID);
        if (childDialogue) {
          this.sizes[level].y += this.dialogHeight + this.itemBottomSpace;
          node.data.dialogue = childDialogue;
        }
      } else {
        this.sizes[level].y += this.itemHeight + this.itemBottomSpace;
      }
      this.editor.addNode(node as unknown as Node);
      if (node.data.type === actionTypes.Dialogue) {
        await this.buildLevel(
          {...childDialogue},
          node,
          level,
          this.sizes[level].x + this.itemWidth + this.itemLeftSpace,
          level * -80,
        );
      }
      node.data.parent.push(dialogue.id);
      node.data.actions.push(dialogueAction);
      await this.updateNodeData(node);
      this.createConnection(
        parentNode.outputs.get(`action_${actionId}`) as Output,
        node.inputs.get('action_in') as Input,
      );
    }
  }

  private createAction(node: DialogueNode, actionId?: number, text?: string): number {
    const id = actionId ?? new Date().getTime();
    const control = node.controls.get(`text_${id}`);
    if (!control) {
      node
        .addControl(new TextControl(this.editor, `text_${id}`, text ?? ''))
        .addOutput(new Output(`action_${id}`, `Action`, ActionSocket, false));
      node.update();
    }
    return id;
  }

  private prepareEditor(): void {
    this.editor = new NodeEditor('demo@0.2.0', this.nodeEditor.nativeElement);
    const engine = new Engine('demo@0.2.0');
    this.editor.use(AreaPlugin, {
      snap: true,
      scaleExtent: {min: 0.1, max: 1},
      translateExtent: {width: 10000, height: 8000},
    });
    const addDialogActionTranslation = this.translateService.instant('DIALOGUE.ADD_DIALOGUE_ACTION');
    const editDialogueTranslation = this.translateService.instant('DIALOGUE.EDIT_TITLE');
    const editActionTranslation = this.translateService.instant('DIALOGUE.EDIT_DIALOGUE_ACTION');
    const addActionTranslation = this.translateService.instant('ACTIONS.ADD_ACTION');
    const deleteTranslation = this.translateService.instant('ACTIONS.DELETE');
    this.editor.use(ConnectionPlugin);
    // @ts-ignore
    this.editor.use(AngularRenderPlugin, {component: CustomNodeComponent});
    this.editor.use(ContextMenuPlugin, {
      searchBar: false,
      delay: 100,
      allocate() {
        return null;
      },
      nodeItems: (node: DialogueNode) => {
        const actions: Record<string, unknown> = {
          Clone: false,
        };
        if (node.data.type === actionTypes.Dialogue) {
          actions[editDialogueTranslation] = (args) => this.editDialogue(args.node);
        }
        if (!node.data.main) {
          actions[editActionTranslation] = (args) => {
            this.dialogueService.handleSubItem(this.list, args.node.data.actions).then((list) => {
              if (list) {
                this.addSubItem(list, args.node);
              }
              this.loadingService.hide();
            });
          };
        }
        if (node.data.type === actionTypes.Dialogue) {
          // @ts-ignore
          actions[addActionTranslation] = (args) => this.createAction(args.node);
        }
        // @ts-ignore
        actions[deleteTranslation] = !node.data.main;
        return actions;
      },
      items: {
        [addDialogActionTranslation]: () => {
          this.dialogueService.handleSubItem(this.list, []).then((actions) => {
            if (actions) {
              this.addSubItem(actions);
            }
            this.loadingService.hide();
          });
        },
      },
    });
    this.editor.use(MinimapPlugin);
    this.editor.use(AutoArrangePlugin);
    this.editor.use(ConnectionPathPlugin, {
      curve: ConnectionPathPlugin.curveBundle,
      arrow: {color: 'steelblue', marker: 'M-5,-10 L-5,10 L20,0 z'},
    });
    [new DialogComponent(), new ItemComponent()].forEach((component) => {
      this.editor.register(component);
      engine.register(component);
    });
    this.editor.view.resize();
    this.editor.trigger('process');
    this.editor.on('contextmenu', ({view}) => {
      this.mousePosition = view && view.area ? view.area.mouse : undefined;
    });
    this.editor.on('connectioncreated', (connection) => {
      const outputNode = this.getNode(connection.output.node.id);
      const inputNode = this.getNode(connection.input.node.id);
      const actionId = Number(connection.output.key.replace('action_', ''));
      if (!(connection.data as any).existedConnection) {
        if (!inputNode.data.parent) {
          inputNode.data.parent = [];
        }
        if (inputNode.data.parent.includes((outputNode.data.dialogue as Dialogue).id as number)) {
          this.doubleRemove = true;
          this.editor.removeConnection(connection);
          return;
        }
        if (!inputNode.data.parent.includes((outputNode.data.dialogue as Dialogue).id as number)) {
          inputNode.data.parent.push((outputNode.data.dialogue as Dialogue).id as number);
        }
        let baseAction = inputNode.data.actions.find(({canvasId}) => canvasId === actionId);
        if (!baseAction) {
          baseAction = {...inputNode.data.baseAction};
          baseAction.canvasId = actionId;
          baseAction.id = actionId;
          inputNode.data.actions.push(baseAction);
        }
        (outputNode.outputs.get(`action_${actionId}`) as Output).name = this.reteDialogueHelperService.getActionType(
          inputNode.data.type,
        );
        (outputNode.controls.get(`text_${actionId}`) as any).props.value = baseAction.text;
        outputNode.data[`text_${actionId}`] = baseAction.text;
        const dialogueActions = (outputNode.data.dialogue as Dialogue).actions as DialogueAction[];
        const currentAction = dialogueActions.find(({canvasId}) => canvasId === actionId);
        if (currentAction) {
          dialogueActions[dialogueActions.indexOf(currentAction)] = baseAction;
        } else {
          dialogueActions.push(baseAction);
        }
        (outputNode.data.dialogue as Dialogue).actions = dialogueActions;
      } else {
        (outputNode.outputs.get(`action_${actionId}`) as Output).name = this.reteDialogueHelperService.getActionType(
          inputNode.data.type,
        );
      }
      outputNode.update();
      inputNode.update();
    });
    this.editor.on('connectionremoved', (connection) => {
      const outputNode = this.getNode(connection.output.node.id);
      const inputNode = this.getNode(connection.input.node.id);
      const parentNodeIndex = (inputNode.data.parent as (number | string)[]).indexOf(
        (outputNode.data.dialogue as Dialogue).id as number,
      );
      if (this.doubleRemove) {
        if (parentNodeIndex !== -1) {
          (inputNode.data.parent as (number | string)[]).splice(parentNodeIndex, 1);
        }
        this.doubleRemove = false;
        return;
      }
      if (!inputNode.data.parent) {
        inputNode.data.parent = [];
      }
      if (parentNodeIndex !== -1) {
        (inputNode.data.parent as (number | string)[]).splice(parentNodeIndex, 1);
      }
      const actionId = Number(connection.output.key.replace('action_', ''));
      (outputNode.controls.get(`text_${actionId}`) as any).props.value = '';
      (outputNode.outputs.get(`action_${actionId}`) as Output).name = 'Action';
      outputNode.data[`text_${actionId}`] = '';
      const outputActions = (outputNode.data.dialogue as Dialogue).actions as DialogueAction[];
      const actionIndex = outputActions.findIndex(({canvasId}) => canvasId === actionId);
      outputActions.splice(actionIndex, 1);
      (outputNode.data.dialogue as Dialogue).actions = outputActions;
      const inputActionIndex = inputNode.data.actions.findIndex(({canvasId}) => canvasId === actionId);
      inputNode.data.actions.splice(inputActionIndex, 1);
      outputNode.update();
      inputNode.update();
    });
    this.editor.on('rendernode', ({el, node}) => {
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (node.data.main) {
          this.editDialogue(node as DialogueNode);
        } else {
          this.dialogueService.handleSubItem(this.list, (node as DialogueNode).data.actions).then((actions) => {
            if (actions) {
              this.addSubItem(actions, node as DialogueNode);
            }
            this.loadingService.hide();
          });
        }
      });
    });
  }

  /**
   * Helper function to get node by id from editor nodes
   *
   * @param nodeId
   */
  private getNode(nodeId: number): DialogueNode | undefined {
    return this.editor.nodes.find(({id}) => id === nodeId) as unknown as DialogueNode;
  }

  private createConnection(parent: Output, child: Input): void {
    interval(500)
      .pipe(take(1))
      .subscribe(() => {
        this.editor.connect(parent, child, {existedConnection: true});
      });
  }

  /**
   * Update node parsed data
   *
   * @param node
   */
  private async updateNodeData(node: DialogueNode): Promise<void> {
    node.data.name = this.reteDialogueHelperService.name(node.data);
    if (node.data.type === actionTypes.Dialogue) {
      node.data.parsedDialogue = this.reteDialogueHelperService.parseDialogue(node.data.dialogue);
    } else {
      node.data.parsedAction = await this.reteDialogueHelperService.parseAction(node.data.baseAction);
    }
    node.update();
  }

  public saveDialogs(): void {
    this.loadingService.show();
    const nodesObj = this.editor.toJSON().nodes as Record<string, NodeData>;
    let isConnectionError = false;
    let isEmptyError = false;
    const markAsActive = [];
    const nodes: DialogueNode[] = [];
    Object.keys(nodesObj).forEach((nodeId) => {
      nodes.push(nodesObj[nodeId] as unknown as DialogueNode);
    });
    for (const node of nodes) {
      if (!node.data.main) {
        if ((node.inputs as any).action_in.connections.length === 0) {
          isConnectionError = true;
          markAsActive.push(node.id);
        }
      }
      if (!isConnectionError && node.data.type === actionTypes.Dialogue) {
        Object.keys(node.outputs).forEach((action) => {
          const keyNumber = action.replace('action_', '');
          if (
            (node.outputs as any)[action] &&
            (node.outputs as any)[action].connections.length > 0 &&
            (node.data as any)[`text_${keyNumber}`].length === 0
          ) {
            isEmptyError = true;
            markAsActive.push(node.id);
          }
        });
      }
    }
    if (isConnectionError) {
      this.notificationService.error(this.translateService.instant('DIALOGUE.MISSING_CONNECTIONS'));
    } else if (isEmptyError) {
      this.notificationService.error(this.translateService.instant('DIALOGUE.MISSING_TEXTS'));
    }
    if ((isConnectionError || isEmptyError) && markAsActive.length > 0) {
      let firstShow = false;
      for (const nodeID of markAsActive) {
        const node = this.editor.nodes.find((nodeItem) => nodeItem.id === nodeID);
        this.editor.selectNode(node as Node, firstShow);
        firstShow = true;
      }
      this.loadingService.hide();
      return;
    }
    const forSaveDialogues = [];
    nodes.forEach((node) => {
      if (node.data.type === actionTypes.Dialogue) {
        forSaveDialogues.push({...node.data.dialogue});
      }
    });
    this.matDialogRef.close(forSaveDialogues);
  }
}
