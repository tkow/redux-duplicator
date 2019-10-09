declare type Last<T extends any[]> = {
  0: never
  1: Head<T>
  2: Last<Tail<T>>
}[T extends [] ? 0 : T extends [any] ? 1 : 2]

declare type Head<T extends any[], D = never> = T extends [infer X, ...any[]] ? X : D

declare type Tail<T extends any[]> = ((...x: T) => void) extends ((x: any, ...xs: infer XS) => void)
  ? XS
  : never

declare type Cons<X, XS extends any[]> = ((h: X, ...args: XS) => void) extends ((
  ...args: infer R
) => void)
  ? R
  : []

declare type Reverse<L extends any[], X extends any[] = []> = {
  1: X
  0: Reverse<Tail<L>, Cons<Head<L>, X>>
}[L extends [] ? 1 : 0]

declare type Concat<A extends any[], B extends any[], R extends any[] = []> = {
  0: Reverse<R>
  1: Concat<Tail<A>, B, Cons<Head<A>, R>>
  2: Concat<A, Tail<B>, Cons<Head<B>, R>>
}[A extends [] ? (B extends [] ? 0 : 2) : 1]

declare type Coalesced<T, Coalesce> = T extends void ? void : T extends Coalesce ? never : Coalesce

type ElementJudge<Prev, Current, Coalesce> = Current extends void
  ? Coalesced<Prev, Coalesce>
  : Current

declare type AppendedTuppleArguments<T extends any[], OO> = [
  ElementJudge<void, T[0], OO>,
  ElementJudge<T[0], T[1], OO>,
  ElementJudge<T[1], T[2], OO>,
  ElementJudge<T[2], T[3], OO>,
  ElementJudge<T[3], T[4], OO>,
  ElementJudge<T[4], T[5], OO>,
  ElementJudge<T[5], T[6], OO>
]
