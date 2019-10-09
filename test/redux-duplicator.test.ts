import duplicateRedux, { duplicateWithMetaRedux } from '../src/redux-duplicator'
import { createAction, handleActions } from 'redux-actions'

const initialState = {
  id: ''
}

const _actionBundle = {
  SET_ID: `SET_ID`,
  FUGA_ID: `FUGA_ID`,
  default: {
    fuga: () => {
      return ''
    }
  }
}

const { default: a, ..._actionTypes } = _actionBundle

const setId = createAction(_actionTypes.SET_ID, (payload: string) => payload)

const _actionCreators = {
  setId
}

const id = handleActions(
  {
    [_actionTypes.SET_ID]: (state, { payload }: ReturnType<typeof _actionCreators['setId']>) =>
      payload!
  },
  initialState.id
)

const nameSpace = 'TEST/'

const { reducer, actionTypes, actionCreators } = duplicateRedux(nameSpace, {
  reducer: id,
  actionTypes: _actionTypes,
  actionCreators: _actionCreators
})

const { reducer: _, actionTypes: __, actionCreators: actionMetaCreators } = duplicateWithMetaRedux(
  nameSpace,
  {
    reducer: id,
    actionTypes: _actionTypes,
    actionCreators: _actionCreators
  },
  (str: string) => ({
    id: str
  })
)

const z = actionMetaCreators.setId('t', 'd')

console.log(z.meta.id)

describe('actionTypes Test', () => {
  it('rewrite action types', () => {
    expect(actionTypes.SET_ID === 'TEST/SET_ID').toBeTruthy()
  })
})

describe('Reducer Test', () => {
  it('rewrite reducer match', () => {
    const result = reducer('', { type: 'TEST/SET_ID', payload: 'fuga' })
    expect(result).toEqual('fuga')
    const miss = reducer('initital', { type: 'SET_ID', payload: 'fuga' })
    expect(miss).toEqual('initital')
  })
})

describe('actionCreators Test', () => {
  it('rewrite actionCreators type', () => {
    const type = actionCreators.setId('test').type
    expect(type).toEqual('TEST/SET_ID')
  })
})
