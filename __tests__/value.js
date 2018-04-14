import Value from '../src/value'

describe('value', function () {
  it('should be immutable', function () {
    const value = Value({
      property: 'value'
    })

    expect(value.property).toBeDefined()
    expect(value.property).toEqual('value')

    try {
      value.property = 'new value'
    } catch (err) {
      expect(err.toString()).toContain('Cannot assign to read only property \'property\' of object')
    }

    expect(value.property).toBeDefined()
    expect(value.property).toEqual('value')
  })
})
