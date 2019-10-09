import { Reducer, Action } from 'redux'

export interface ActionMeta<Payload, Meta> extends Action<Payload> {
  meta: Meta
}
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
    [key in keyof ActionCreators]: ActionCreator<any, any, any>
  },
  MetaArg = any,
  AppendMeta extends {} = any
>(
  actionCreators: ActionCreators,
  prefix: string,
  metaCreator?: (meta: MetaArg) => AppendMeta
) => {
  return Object.keys(actionCreators).reduce<ResultActionCreators>(
    (records, key) => {
      return {
        ...records,
        [key]: (
          ...args: AppendedTuppleArguments<Parameters<ActionCreators[typeof key]>, MetaArg>
        ) => {
          let meta = metaCreator ? metaCreator(args.pop() as MetaArg) : {}
          const action = actionCreators[key](...args)
          if ((action as ActionMeta<any, any>).meta) {
            meta = {
              ...(action as ActionMeta<any, any>).meta,
              ...meta
            }
          }
          if (metaCreator) {
            return {
              ...action,
              type: `${prefix}${action.type}`,
              meta
            }
          } else {
            return {
              ...action,
              type: `${prefix}${action.type}`
            }
          }
        }
      }
    },
    {} as ResultActionCreators
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

type ActionCreator<
  Args extends any[],
  Payload extends {},
  Meta extends {} | undefined = undefined
> = (...args: Args) => Meta extends undefined ? Action<Payload> : ActionMeta<any, Meta>

// WARNING: ActionTypesはdestructuring assignmentの場合、
// 型推論が上手く機能しない。
export default function duplicateRedux<
  ActionTypes extends { [key in keyof ActionTypes]: string },
  ActionCreators extends {
    [key in keyof ActionCreators]: ActionCreator<any, any, any>
  },
  S,
  A extends Action<any>,
  MetaCreator extends <T, R extends {}>(meta: T) => R,
  NewActionCreators extends {
    [key in keyof ActionCreators]: ActionCreator<
      AppendedTuppleArguments<Parameters<ActionCreators[key]>, Parameters<MetaCreator>[0]>,
      ReturnType<ActionCreators[key]>,
      ReturnType<MetaCreator> | undefined
    >
  }
>(
  prefix: string,
  {
    actionTypes,
    actionCreators,
    reducer,
    metaCreator
  }: {
    actionTypes: ActionTypes
    actionCreators: ActionCreators
    reducer: Reducer<S, A>
    metaCreator?: MetaCreator
  }
): {
  actionTypes: ActionTypes
  actionCreators: NewActionCreators
  reducer: Reducer<S, A>
} {
  return {
    reducer: reuseReducer(reducer, prefix),
    actionTypes: recreateActionTypes(actionTypes, prefix) as ActionTypes,
    actionCreators: recreateActionCreators(actionCreators, prefix, metaCreator)
  }
}
