import Entity from '../src/entity'

class TestEntity extends Entity {
  constructor (snapshot, events) {
    super()
    this.property = false
    this.property2 = {
      subProperty: false,
      subProperty2: true
    }
    this.rehydrate(snapshot, events)
  }
  method (param) {
    this.property2 = param.data
    this.digest('method', param)
    this.emit('method-ed')
  }
}

describe('entity', function () {
  describe('#constructor', function () {
    it('should accept variations of snapshots and events to use for rehydrating', () => {
      const snapshot = {
        property: true
      }
      let data = { hello: 'sourced' }
      const entity1 = new TestEntity(snapshot)
      expect(entity1.property).toBe(true)
      entity1.method({ data })

      expect(entity1.property2).toEqual(data)

      // console.warn(entity1)

      const entity2 = new TestEntity(snapshot, entity1.newEvents)
      expect(entity2.property).toEqual(entity1.property)
      expect(entity2.property2).toEqual(entity1.property2)

      const entity3 = new TestEntity(null, entity1.newEvents)
      expect(entity3.property).toBe(false)
      expect(entity3.property2).toEqual(entity1.property2)
    })
  })
  describe('#digest', function () {
    it('should wrap param object with method matching calling method name and add to array of newEvents', function () {
      const test = new TestEntity()
      const data = { test: 'data' }

      test.method(data)

      expect(test.newEvents.length).toEqual(1)
      expect(test.newEvents[0].method).toEqual('method')
      expect(test.newEvents[0].data).toEqual(data)
    })
    it('should have versions 1 and 2 for two consecutively digested events', function () {
      const test = new TestEntity()
      const data = { test: 'data' }
      const data2 = { test: 'data2' }

      test.method(data)
      test.method(data2)

      expect(test.newEvents.length).toEqual(2)
      expect(test.newEvents[0].method).toEqual('method')
      expect(test.newEvents[0].data).toEqual(data)
      expect(test.newEvents[1].method).toEqual('method')
      expect(test.newEvents[1].data).toEqual(data2)
      expect(test.version).toEqual(2)
    })
  })
  describe('#enqueue', function () {
    it('should enqueue EventEmitter style events by adding them to array of events to emit', function () {
      var test = new TestEntity()

      test.enqueue('something.happened', { data: 'data' }, { data2: 'data2' })

      expect(test.eventsToEmit).toBeDefined()

      expect(Array.prototype.slice.call(test.eventsToEmit[0], 0, 1)[0]).toEqual('something.happened')
      expect(Array.prototype.slice.call(test.eventsToEmit[0], 1)[0].data).toBeDefined()
      expect(Array.prototype.slice.call(test.eventsToEmit[0], 1)[0].data).toEqual('data')
      expect(Array.prototype.slice.call(test.eventsToEmit[0], 1)[1].data2).toBeDefined()
      expect(Array.prototype.slice.call(test.eventsToEmit[0], 1)[1].data2).toEqual('data2')
    })
  })
  describe('#merge', function () {
    it('should merge a snapshot into the current snapshot, overwriting any common properties', function () {
      var snapshot = {
        property: true,
        property2: true
      }

      var test = new TestEntity()

      test.merge(snapshot)

      expect(test.property).toEqual(true)
      expect(test.property2).toEqual(true)
    })
    it('should merge a complex snapshot (missing newly added fields) while maintaining defaulted sub-object values', function () {
      var snapshot = {
        property: true
      }

      var test = new TestEntity()

      test.merge(snapshot)

      expect(test.property).toEqual(true)
      expect(test.property2.subProperty).toBeDefined()
      expect(test.property2.subProperty).toEqual(false)
      expect(test.property2.subProperty2).toBeDefined()
      expect(test.property2.subProperty2).toEqual(true)
    })
    it('should merge a complex snapshot while maintaining defaulted sub-object values', function () {
      var snapshot = {
        property: true,
        property2: {
          subProperty: true,
          subProperty2: false
        }
      }

      var test = new TestEntity()

      test.merge(snapshot)

      expect(test.property).toEqual(true)
      expect(test.property2.subProperty).toBeDefined()
      expect(test.property2.subProperty).toEqual(true)
      expect(test.property2.subProperty2).toBeDefined()
      expect(test.property2.subProperty2).toEqual(false)
    })
  })
  describe('#replay', function () {
    it('should throw an entity error with name of model when attempting to replay a method an entity does not implement', function () {
      var events = [
        {
          method: 'someMethod',
          data: { some: 'param' }
        }
      ]

      var test = new TestEntity()

      expect(function () {
        test.replay(events)
      }).toThrow('method \'someMethod\' does not exist on model \'TestEntity\'')
    })
    it('should not emit events during replay', function () {
      var events = [
        {
          method: 'method',
          data: { some: 'param' }
        }
      ]

      var test = new TestEntity()

      test.on('method-ed', function () {
        throw new Error('should not emit during replay')
      })

      test.replay(events)
    })
  })
  describe('#snapshot', function () {
    it('should return object with current state of the entity', function () {
      const test = new TestEntity()
      const data = { data: 'data' }

      test.method(data)

      var snapshot = test.snapshot()

      expect(snapshot.property2).toEqual(data.data)
      expect(snapshot.snapshotVersion).toEqual(1)
      expect(snapshot.version).toEqual(1)
    })
  })
})
