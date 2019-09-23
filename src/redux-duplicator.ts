// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...

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

export const reuseReducer = <Reducer>(reducer: Reducer, prefix: string): Reducer => {
  const matchPattern = new RegExp(`^${prefix}`)
  return function(state, action) {
    if (matchPattern.test(action.type)) {
      return reducer(state, action)
    } else {
      return state
    }
  } as Reducer
}
