export enum ActionsTypes {
  ADD,
  EDIT,
  MARK_AS_REMOVED,
  RESTORE,
  DELETE,
  DUPLICATE,
  COPY_TO,
}

export enum ActionsNames {
  ADD = 'ADD',
  EDIT = 'EDIT',
  MARK_AS_REMOVED = 'MARK_AS_REMOVED',
  RESTORE = 'RESTORE',
  DELETE = 'DELETE',
  DUPLICATE = 'DUPLICATE',
  COPY_TO = 'COPY_TO',
  DEACTIVATE = 'DEACTIVATE',
  ACTIVATE = 'ACTIVATE',
}

export enum ActionsIcons {
  ADD = 'add',
  EDIT = 'edit',
  MARK_AS_REMOVED = 'delete',
  RESTORE = 'restore',
  DELETE = 'delete',
  DUPLICATE = 'file_copy',
  COPY_TO = 'file_copy',
}

export interface TableAction {
  type: ActionsTypes;
  name: ActionsNames;
  icon: ActionsIcons;
}

export interface ActionTrigger {
  id: any;
  type: ActionsTypes;
}
