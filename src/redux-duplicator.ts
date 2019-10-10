import { Reducer, Action as ActionType } from 'redux'

type Action<T = any, Type extends string = string> = {
  type: Type
} & T

// WARNING: ActionTypesはdestructuring assignmentの場合、
// 型推論が上手く機能しない。
export const recreateActionTypes = <T extends { [key in keyof T]: string }>(
  actionTypes: T,
  prefix: string
) => {
  return Object.keys(actionTypes).reduce((data, key) => {
    return {
      ...data,
      [key]: `${prefix}/${actionTypes[key as keyof T]}`
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
  return Object.keys(actionCreators).reduce(
    (records, key) => {
      const type = `${prefix}/${actionCreators[key].toString()}`
      let f = (...args: any[]): Action => {
        const action = actionCreators[key](...args)
        return {
          ...action,
          type
        } as Action
      }
      f.toString = () => type
      return {
        ...records,
        [key]: f
      }
    },
    {} as { [key in keyof ActionCreators]: ActionCreators[key] }
  )
}

export const recreateActionMetaCreators = <
  ActionCreators extends {
    [key: string]: (...args: any[]) => Action
  },
  ExtMetaArgs extends any,
  ExtMetaResult extends object
>(
  actionCreators: ActionCreators,
  prefix: string,
  metaCreator: (args: ExtMetaArgs) => ExtMetaResult
) => {
  return Object.keys(actionCreators).reduce(
    (records, key) => {
      const type = `${prefix}/${actionCreators[key].toString()}`
      let f = (...args: any[]): Action => {
        let meta: object = metaCreator ? metaCreator(args.shift() as ExtMetaArgs) : {}
        const action = actionCreators[key](...args)
        if ((action as Action<{ meta: any }>).meta) {
          meta = {
            ...(action as Action<{ meta: any }>).meta,
            ...meta
          } as Action
        }
        return {
          ...action,
          type,
          meta
        } as const
      }
      f.toString = () => type
      return {
        ...records,
        [key]: f
      }
    },
    {} as {
      [key in keyof ActionCreators]: IActionMetaCreator<
        ActionCreators[key],
        {
          args: ExtMetaArgs
          result: ExtMetaResult
        }
      >
    }
  )
}

interface IActionMetaCreator<
  F extends (...args: any[]) => Action<any>,
  MetaSetting extends {
    args: any
    result: object
  }
> {
  (m: MetaSetting['args'], ...args: Parameters<F>): ReturnType<F> & { meta: MetaSetting['result'] }
}

export const reuseReducer = <S, A extends ActionType<any>>(
  reducer: Reducer<S, A>,
  prefix: string
): Reducer<S, A> => {
  const matchPattern = new RegExp(`^${prefix}\/(.*)`)
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
  A extends ActionType<any>
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
    actionTypes: recreateActionTypes(actionTypes, prefix) as ActionTypes,
    actionCreators: recreateActionCreators(actionCreators, prefix)
  }
}

// ToDo: default exportに統合する
export function duplicateWithMetaRedux<
  ActionTypes extends { [key in keyof ActionTypes]: string },
  ActionCreators extends {
    [key: string]: (...args: any[]) => Action
  },
  S,
  A extends ActionType<any>,
  ExtMetaArgs extends any,
  ExtMetaResult extends object
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
  },
  metaCreator: (args: ExtMetaArgs) => ExtMetaResult
) {
  return {
    reducer: reuseReducer(reducer, prefix),
    actionTypes: recreateActionTypes(actionTypes, prefix) as ActionTypes,
    actionCreators: recreateActionMetaCreators(actionCreators, prefix, metaCreator)
  }
}
