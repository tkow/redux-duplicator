import duplicateRedux, {reuseActionCreators} from '../src/redux-duplicator'
import {
  createAction,
  createReducer,
} from '@reduxjs/toolkit'

type TestState = {
  id: string
  name: string
}
const initialState = (): TestState => ({
  id: '',
  name: 'none'
})

const setId = createAction<string,'setId'>('setId')
const setName = createAction('setName', (n: number) => {
  return {
    payload: [
      'tkow',
      'tony',
      'my'
    ][n] as string
  }
})

const _actionCreators = {
  setId,
  setName
}

const z = reuseActionCreators(_actionCreators, 'test')
const d = z.setId('id').payload

type TestActionCreators = typeof _actionCreators

const testReducer = createReducer<TestState, TestActionCreators>(initialState(), {
  [_actionCreators.setId.type]: (state, action) => {
    const id: string = action.payload
    return {
      ...state,
      id,
    }
  },
  [_actionCreators.setName.type]: (state, action) => {
    const name: string = action.payload
    return {
      ...state,
      name,
    }
  },
})

const nameSpace = 'TEST/'

const { reducer, actionCreators } = duplicateRedux(nameSpace, {
  reducer: testReducer,
  actionCreators: _actionCreators
})

const testSetIdType: string = actionCreators.setId.type
const testSetNameType: string = actionCreators.setName.type

describe('Reducer Test', () => {
  it('rewrite reducer match', () => {
    const result = reducer({id: '', name: ''}, { type: 'TEST/setId', payload: 'fuga' })
    expect(result.id).toEqual('fuga')
    const miss = reducer({id: '', name: ''}, { type: 'setId', payload: 'fuga' })
    expect(miss.id).toEqual('')
  })
})

describe('actionCreators Test', () => {
  it('rewrite actionCreators type', () => {
    const result = actionCreators.setId('test')
    const type = actionCreators.setId('test').type
    expect(type).toEqual('TEST/setId')
  })
  it('rewrite actionCreators type', () => {
    const result = actionCreators.setName(0)
    const type = actionCreators.setName(0).type
    expect(type).toEqual('TEST/setName')
  })
})
