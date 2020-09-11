import { Reducer, Action } from 'redux'

type GeneralActionCreator<IAction extends Action<string> = Action<string>> = {
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

export type WiddenActionCreator<IActionCreator extends GeneralActionCreator,IAction extends Action<string> =Action<string>> = {
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
        [key]: (...args: any[]): Action<string> => {
          const { type,  ..._restAction} = actionCreators[key](...args)
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

export const reuseReducer = <S, A extends Action<any>>(
  reducer: Reducer<S, A>,
  prefix: string,
  initialState?: S
): Reducer<S, A> => {
  const matchPattern = new RegExp(`^${prefix}(.*)`)
  return function(state: S | undefined = initialState, action: A) {
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
  } as Reducer<S, A>
}

export default function duplicateRedux<
  ActionCreators extends {
    [key: string]: GeneralActionCreator
  },
  S,
  A extends Action<any>
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
    reducer: Reducer<S, A>
    initialState?: S
  }
): {
  actionTypes?: { [key: string]: string }
  actionCreators: WiddenActionCreators<ActionCreators>
  reducer: Reducer<S, A>
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
