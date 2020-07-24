import { Reducer, Action } from 'redux'

type GeneralActionCreator<IAction extends Action<string> = Action<string>> = {
  (...args: any[]): IAction
  type?: string
}

export const reuseActionTypes = <T extends { [key: string]: string }>(
  actionTypes: T,
  prefix: string
) => {
  return Object.keys(actionTypes).reduce((data, key) => {
    return {
      ...data,
      [key]: `${prefix}${actionTypes[key]}`
    }
  }, {}) as { [key in keyof T]: string }
}

export const reuseActionCreators = <
  ActionCreators extends {
    [key: string]: GeneralActionCreator
  }
>(
  actionCreators: ActionCreators,
  prefix: string
) => {
  return Object.keys(actionCreators).reduce<{ [key in keyof ActionCreators]: ActionCreators[key] }>(
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
    {} as { [key in keyof ActionCreators]: ActionCreators[key] }
  )
}

export const reuseReducer = <S, A extends Action<any>>(
  reducer: Reducer<S, A>,
  prefix: string
): Reducer<S, A> => {
  const matchPattern = new RegExp(`^${prefix}(.*)`)
  return function(state: S, action: A) {
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

type ExtractActionCreator<ActionCreators extends {
  [key: string]: GeneralActionCreator
}> = {
  [key in keyof ActionCreators]: ActionCreators[key]
}

export default function duplicateRedux<
  ActionTypes extends { [key: string]: string },
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
    reducer
  }: {
    actionTypes?: ActionTypes
    actionCreators: ActionCreators
    reducer: Reducer<S, A>
  }
): {
  actionTypes?: ActionTypes
  actionCreators: ExtractActionCreator<ActionCreators>
  reducer: Reducer<S, A>
} {
  let result = {
    reducer: reuseReducer(reducer, prefix),
    // actionTypes: reuseActionTypes(actionTypes, prefix) as ActionTypes,
    actionCreators: reuseActionCreators(actionCreators, prefix) as ExtractActionCreator<ActionCreators>
  }
  if (actionTypes) {
    return {
      ...result,
      actionTypes: reuseActionTypes(actionTypes, prefix) as ActionTypes,
    }
  }
  return result
}
