require('mocha'),
require('should');

var util = require('util');

var Entity = require('../lib/entity');

function TestEntity () {
  this.property = false;
  this.property2 = {
    subProperty: false,
    subProperty2: true
  }
  Entity.call(this);
}

util.inherits(TestEntity, Entity);

function TestNullPropertyEntity () {
  this.property = null;
  this.arrayProperty = [];
  Entity.call(this);
}

util.inherits(TestNullPropertyEntity, Entity);

TestEntity.prototype.method = function (param) {
  this.property2 = param.data;
  this.digest('method', param);
  this.emit('method-ed');
};

describe('entity', function () {
  describe('#digest', function () {
    it('should wrap param object with method matching calling method name and add to array of newEvents', function () {

      var param = {
          data: 'data'
        };

      var test = new TestEntity(),
          data = { test: 'data' };

      test.method(data);

      test.newEvents.length.should.equal(1);
      test.newEvents[0].method.should.equal('method');
      test.newEvents[0].data.should.equal(data);

    });
    it('should have versions 1 and 2 for two consecutively digested events', function () {

      var param = {
          data: 'data'
        };

      var test = new TestEntity(),
          data = { test: 'data' },
          data2 = { test: 'data2'};

      test.method(data);
      test.method(data2);

      test.newEvents.length.should.equal(2);
      test.newEvents[0].method.should.equal('method');
      test.newEvents[0].data.should.equal(data);
      test.newEvents[1].method.should.equal('method');
      test.newEvents[1].data.should.equal(data2);
      test.version.should.eql(2);

    });
  });
  describe('#enqueue', function () {
    it('should enqueue EventEmitter style events by adding them to array of events to emit', function () {

      var test = new TestEntity();

      test.enqueue('something.happened', { data: 'data' }, { data2: 'data2' });

      test.should.have.property('eventsToEmit');

      (Array.prototype.slice.call(test.eventsToEmit[0], 0, 1)[0]).should.eql('something.happened');
      (Array.prototype.slice.call(test.eventsToEmit[0], 1))[0].should.have.property('data', 'data');
      (Array.prototype.slice.call(test.eventsToEmit[0], 1))[1].should.have.property('data2', 'data2');

    });
  });
  describe('#merge', function () {
    it('should merge a snapshot into the current snapshot, overwriting any common properties', function () {

      var snapshot = {
          property: true,
          property2: true
        };

      var test = new TestEntity();

      test.merge(snapshot);

      test.property.should.equal(true);
      test.property2.should.equal(true);

    });
    it('should merge a complex snapshot (missing newly added fields) while maintaining defaulted sub-object values', function () {

      var snapshot = {
          property: true,
        };

      var test = new TestEntity();

      test.merge(snapshot);

      test.property.should.equal(true);
      test.property2.should.have.property('subProperty', false);
      test.property2.should.have.property('subProperty2', true);

    });

    it('should merge a complex snapshot when entity is initialized with null properties', function () {

      var snapshot = {
        property: { subProperty: true },
      };

      var test = new TestNullPropertyEntity();

      test.merge(snapshot);

      test.should.have.property('property');
      test.property.should.have.property('subProperty', true);

    });

    it('should merge a compley snapshot when entity is initialized with empty array properties', function () {

      var snapshot = {
        arrayProperty : ['123']
      };

      var test = new TestNullPropertyEntity();

      test.merge(snapshot);

      test.should.have.property('arrayProperty');
      test.arrayProperty[0].should.equal('123');

    });


    it('should merge a complex snapshot while maintaining defaulted sub-object values', function () {

      var snapshot = {
          property: true,
          property2: {
            subProperty: true,
            subProperty2: false
          }
        };

      var test = new TestEntity();

      test.merge(snapshot);

      test.property.should.equal(true);
      test.property2.should.have.property('subProperty', true);
      test.property2.should.have.property('subProperty2', false);

    });
  });
  describe('#replay', function () {
    it('should throw an entity error with name of model when attempting to replay a method an entity does not implement', function () {

      var events = [
        {
          method: 'someMethod',
          data: { some: 'param' }
        }
      ];

      var test = new TestEntity();

      (function () {
        test.replay(events);
      }).should.throw('method \'someMethod\' does not exist on model \'TestEntity\'');

    });
    it('should not emit events during replay', function () {

      var events = [
        {
          method: 'method',
          data: { some: 'param' }
        }
      ];

      var test = new TestEntity();

      test.on('method-ed', function () {
        throw new Error('should not emit during replay');
      });

      test.replay(events);

    });
  });
  describe('#snapshot', function () {
    it('should return object with current state of the entity', function () {

      var param = {
        data: 'data'
      };

      var test = new TestEntity(),
          data = { data: 'data' };

      test.method(data);

      var snapshot = test.snapshot();

      snapshot.property2.should.equal(data.data);
      snapshot.snapshotVersion.should.equal(1);
      snapshot.version.should.equal(1);

    });
  });
});
