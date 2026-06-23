import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, Type} from '@angular/core';
import {Control, NodeEditor} from 'rete';
import {AngularControl} from 'vasko-retejs-angular-render-plugin';
import {DialogueNode} from '../dialogue-node';

@Component({
  template: `
    <div class="input-container">
      <label>{{ 'DIALOGUE.TEXT' | translate }}</label>
      <input type="text" [value]="value"  (change)="change($event)" />
    </div>
  `,
  styles: [
    `
      .input-container {
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
      }
      label {
        width: 44px;
        line-height: 24px;
        padding-left: 6px;
      }
      input {
        border-radius: 30px;
        background-color: white;
        padding: 3px 6px;
        border: 1px solid #999;
        width: 144px;
        box-sizing: border-box;
      }
    `,
  ],
})
export class TextComponent implements OnInit {
  @Input() value!: string;
  @Input() change!: (value: unknown) => void;
  @Input() mounted!: () => void;

  constructor() {}

  public ngOnInit(): void {
    this.mounted();
  }
}

export class TextControl extends Control implements AngularControl {
  component: Type<TextComponent>;
  props: {[key: string]: unknown};

  constructor(
    public emitter: NodeEditor,
    public key: string,
    public text: string
  ) {
    super(key);
    this.component = TextComponent;
    this.props = {
      change: ($event: any) => this.onChange($event.target.value),
      value: text,
      mounted: () => this.setValue((this.getData(key) as any) || text),
    };
  }

  public onChange(val: string): void {
    this.setValue(val);
    const node = (this.getNode() as unknown) as DialogueNode;
    const dialogue = node.data.dialogue;
    if (dialogue && dialogue.actions) {
      const actionItemKey = this.key.replace('text_', 'action_');
      if ((node.outputs as any).get(actionItemKey) && (node.outputs as any).get(actionItemKey).connections.length > 0) {
        (node.outputs as any).get(actionItemKey).connections.forEach((connection) => {
          const actionItemId = Number(connection.output.key.replace('action_', ''));
          const action = dialogue.actions.find(({canvasId}) => canvasId === actionItemId);
          if (action) {
            dialogue.actions[dialogue.actions.indexOf(action)].text = val;
          }
        });
      }
    }
    this.emitter.trigger('process');
  }

  public setValue(val: string): void {
    this.props.value = val;
    this.putData(this.key, this.props.value);

  }
}
