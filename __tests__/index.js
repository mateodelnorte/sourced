import {
  Entity,
  Value,
  SourcedEntity,
  SourcedValue
} from '../src/index'

describe('index', () => {
  it('exports Entity, Value, SourcedEntity, SourcedValue', () => {
    expect(Entity).toBeDefined()
    expect(Value).toBeDefined()
    expect(SourcedEntity).toBeDefined()
    expect(SourcedValue).toBeDefined()
  })
})
