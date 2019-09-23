import { Reducer, Action } from 'redux'

export const recreateActionTypes = <T extends { [key: string]: string }>(
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

export const recreateActionCreators = <
  ActionCreators extends {
    [key: string]: <Args, Action extends { type: string }>(...args: Args[]) => Action
  }
>(
  actionCreators: ActionCreators,
  prefix: string
) => {
  return Object.keys(actionCreators).reduce((records, key) => {
    return {
      ...records,
      [key]: <T, Action extends { type: string }>(...args: T[]): Action => {
        const action = actionCreators[key](...args)
        return {
          ...action,
          type: `${prefix}${action.type}`
        } as Action
      }
    }
  }, {})
}

export const reuseReducer = <S, A extends Action<any>>(
  reducer: Reducer<S, A>,
  prefix: string
): Reducer<S, A> => {
  const matchPattern = new RegExp(`^${prefix}`)
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

export default function duplicateRedux<
  ActionTypes extends { [key: string]: string },
  ActionCreators extends {
    [key: string]: <Args, Action extends { type: string }>(...args: Args[]) => Action
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
) {
  return {
    reducer: reuseReducer(reducer, prefix),
    actionTypes: recreateActionTypes(actionTypes, prefix),
    actionCreators: recreateActionCreators(actionCreators, prefix)
  }
}
