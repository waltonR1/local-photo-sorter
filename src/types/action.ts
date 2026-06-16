export type ActionType = 'move' | 'rename'

export interface BaseAction {
  id: string
  type: ActionType
  timestamp: number
}

export interface MoveAction extends BaseAction {
  type: 'move'
  fromPath: string
  toPath: string
}

export interface RenameAction extends BaseAction {
  type: 'rename'
  fromPath: string
  toPath: string
}

export type ActionRecord = MoveAction | RenameAction
