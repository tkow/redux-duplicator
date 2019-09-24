import { Reducer, Action } from 'redux'

// WARNING: ActionTypesはdestructuring assignmentの場合、
// 型推論が上手く機能しない。
export const recreateActionTypes = <T extends { [key in keyof T]: string }>(
  actionTypes: T,
  prefix: string
) => {
  return Object.keys(actionTypes).reduce((data, key) => {
    return {
      ...data,
      [key]: `${prefix}${actionTypes[key as keyof T]}`
    }
  }, {}) as { [key in keyof T]: string }
}

export const recreateActionCreators = <
  ActionCreators extends {
    [key: string]: (...args: any[]) => Action
  }
>(
  actionCreators: ActionCreators,
  prefix: string
) => {
  return Object.keys(actionCreators).reduce<{ [key in keyof ActionCreators]: ActionCreators[key] }>(
    (records, key) => {
      return {
        ...records,
        [key]: (...args: any[]): Action => {
          const action = actionCreators[key](...args)
          return {
            ...action,
            type: `${prefix}${action.type}`
          } as Action
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

// WARNING: ActionTypesはdestructuring assignmentの場合、
// 型推論が上手く機能しない。
export default function duplicateRedux<
  ActionTypes extends { [key in keyof ActionTypes]: string },
  ActionCreators extends {
    [key: string]: (...args: any[]) => Action
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
    actionTypes: ActionTypes
    actionCreators: ActionCreators
    reducer: Reducer<S, A>
  }
): {
  actionTypes: ActionTypes
  actionCreators: ActionCreators
  reducer: Reducer<S, A>
} {
  return {
    reducer: reuseReducer(reducer, prefix),
    actionTypes: recreateActionTypes(actionTypes, prefix) as ActionTypes,
    actionCreators: recreateActionCreators(actionCreators, prefix) as ActionCreators
  }
}
