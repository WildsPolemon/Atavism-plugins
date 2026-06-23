import {Component, Input, Node} from 'rete';
import {ActionSocket} from '../socket';

export class DialogComponent extends Component {
  data: any;

  constructor() {
    super('Dialog');
  }

  public builder(node: Node): Promise<void> {
    return new Promise((resolve) => {
      node.addInput(new Input('action_in', 'Action in', ActionSocket, true));
      resolve();
    });
  }

  public worker(): void {}
}
