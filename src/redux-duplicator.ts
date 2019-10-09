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

type ddd = Parameters<(a: 1, b: 2, c: 3) => void>

export const recreateActionCreators = <
  ActionCreators extends IActionCreators<ActionCreators, any, any>,
  ExtMetaArg,
  ExtMeta
>(
  actionCreators: ActionCreators,
  prefix: string,
  metaCreator?: (meta: ExtMetaArg) => ExtMeta
) => {
  return (Object.keys(actionCreators) as (keyof ActionCreators)[]).reduce(
    (records, key) => {
      return {
        ...records,
        // @ts-ignore
        [key]: (...args: Concat<Parameters<ActionCreators[typeof key]>, [ExtMetaArg]>) => {
          let meta = metaCreator ? metaCreator(args.pop() as ExtMetaArg) : {}
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
            } as const
          } else {
            return {
              ...action,
              type: `${prefix}${action.type}`
            } as const
          }
        }
      } as const
    },
    {} as {
      [key in keyof ActionCreators]: IActionCreator<
        Concat<Parameters<(a: 1, b: 2, c: 3) => void>, [string]>,
        string,
        string
      >
    }
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

type ActionCreator<Args extends any[], Payload extends {}> = (...args: Args) => Action<Payload>

type MetaActionCreator<
  Args extends any[],
  Payload extends {},
  Meta extends {} | undefined = undefined
> = (...args: Args) => ActionMeta<Payload, Meta>

type IActionCreator<Args extends any[], Payload = {}, Meta = undefined> =
  | ActionCreator<Args, Payload>
  | MetaActionCreator<Args, Payload, Meta>

type IActionCreators<ActionCreators, Args extends any[], Payload = {}, Meta = undefined> = {
  [key in keyof ActionCreators]: IActionCreator<Args, Payload, Meta>
}

// WARNING: ActionTypesはdestructuring assignmentの場合、
// 型推論が上手く機能しない。
export default function duplicateRedux<
  ActionTypes extends { [key in keyof ActionTypes]: string },
  ActionCreators extends IActionCreators<ActionCreators, any, any, any>,
  S,
  A extends Action<any>,
  ExtMetaArg,
  ExtMeta
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
    metaCreator?: (meta: ExtMetaArg) => ExtMeta
  }
) {
  return {
    reducer: reuseReducer(reducer, prefix),
    actionTypes: recreateActionTypes(actionTypes, prefix) as ActionTypes,
    actionCreators: recreateActionCreators(actionCreators, prefix, metaCreator)
  } as const
}
