import { Reducer, Action, AnyAction } from 'redux'

type ActionSupported = Function | AnyAction

type GeneralActionCreator<IAction extends ActionSupported = AnyAction> = {
  (...args: any[]): IAction
  type?: string
}

export const reuseActionTypes = (
  actionTypes: { [key: string]: string },
  prefix: string
): { [key: string]: string } => {
  return Object.keys(actionTypes).reduce((data, key) => {
    return {
      ...data,
      [key]: `${prefix}${actionTypes[key]}`
    }
  }, {})
}

export type WiddenActionCreator<IActionCreator extends GeneralActionCreator> = {
  (...args: Parameters<IActionCreator>): Omit<ReturnType<IActionCreator>,'type'> & {type: string}
  type: IActionCreator extends {type: string} ? string : undefined
}

export type WiddenActionCreators<ActionCreators extends {
  [key: string]: GeneralActionCreator
}> = {
  [key in keyof ActionCreators]: WiddenActionCreator<ActionCreators[key]>
}

export const reuseActionCreators = <
  ActionCreators extends {
    [key: string]: GeneralActionCreator
  }
>(
  actionCreators: ActionCreators,
  prefix: string
) => {
  return Object.keys(actionCreators).reduce<{ [key in keyof ActionCreators]: WiddenActionCreator<ActionCreators[key]> }>(
    (records, key) => {
      return {
        ...records,
        [key]: (...args: any[]): AnyAction => {
          const action  = actionCreators[key](...args)
          if(typeof action === 'function') return action
          const { type,  ..._restAction} = action
          return {
            ..._restAction,
            type: `${prefix}${type}`
          }
        }
      }
    },
    {} as { [key in keyof ActionCreators]: WiddenActionCreator<ActionCreators[key]> }
  )
}

export const reuseReducer = <S>(
  reducer: Reducer<S, AnyAction>,
  prefix: string,
  initialState?: S
): Reducer<S, AnyAction> => {
  const matchPattern = new RegExp(`^${prefix}(.*)`)
  return function(state: S | undefined = initialState, action: AnyAction) {
    const matcher = matchPattern.exec(action.type)
    if (matcher) {
      const originalAction = {
        ...action,
        type: matcher[1]
      }
      return reducer(state, originalAction)
    } else {
      return state
    }
  } as Reducer<S, AnyAction>
}

export default function duplicateRedux<
  ActionCreators extends {
    [key: string]: GeneralActionCreator
  },
  S,
>(
  prefix: string,
  {
    actionTypes,
    actionCreators,
    reducer,
    initialState,
  }: {
    actionTypes?: { [key: string]: string },
    actionCreators: ActionCreators
    reducer: Reducer<S, AnyAction>
    initialState?: S
  }
): {
  actionTypes?: { [key: string]: string }
  actionCreators: WiddenActionCreators<ActionCreators>
  reducer: Reducer<S, AnyAction>
} {
  let result = {
    reducer: reuseReducer(reducer, prefix, initialState),
    actionCreators: reuseActionCreators(actionCreators, prefix)
  }
  if (actionTypes) {
    return {
      ...result,
      actionTypes: reuseActionTypes(actionTypes, prefix),
    }
  }
  return result
}
