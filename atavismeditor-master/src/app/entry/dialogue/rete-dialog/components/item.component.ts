import {Component, Input, Node} from 'rete';
import {ActionSocket} from '../socket';

export class ItemComponent extends Component {
  public data: any;

  constructor() {
    super('Item');
  }

  public builder(node: Node): Promise<void> {
    return new Promise((resolve) => {
      node.addInput(new Input('action_in', 'Action in', ActionSocket, true));
      resolve();
    });
  }

  public worker(): void {}
}
