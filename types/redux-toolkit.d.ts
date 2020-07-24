import { Reducer, AnyAction } from '@reduxjs/toolkit'
declare module '@reduxjs/toolkit' {
  type NoInfer<T> = [T][T extends any ? 0 : never]

  interface ActionMatcher<A extends AnyAction> {
    (action: AnyAction): action is A
  }

  type ActionMatcherDescription<S, A extends AnyAction> = {
    matcher: ActionMatcher<A>
    reducer: CaseReducer<S, NoInfer<A>>
  }

  interface GeneralActionCreator {
    (...args: any[]): any
    type: string
  }
  type ActionMatcherDescriptionCollection<S> = Array<
    ActionMatcherDescription<S, any>
  >

  export type DefinedActions<
    ActionCreators extends {
      [key: string]: GeneralActionCreator
    }
  > = ReturnType<ActionCreators[keyof ActionCreators]>

  export type ActionReducerMap<
    State,
    IActionCreators extends {
      [key: string]: GeneralActionCreator
    }
  > = {
    [key in IActionCreators[keyof IActionCreators]['type']]: (
      state: State,
      action: ReturnType<
        Extract<IActionCreators[keyof IActionCreators], { type: key }>
      >
    ) => State
  }

  export function createReducer<
    S,
    IActionCreators extends {
      [key in string]: GeneralActionCreator
    }
  >(
    initialState: S,
    actionsMap: ActionReducerMap<S, IActionCreators>,
    actionMatchers?: ActionMatcherDescriptionCollection<S>,
    defaultCaseReducer?: CaseReducer<S>
  ): Reducer<S>
}
