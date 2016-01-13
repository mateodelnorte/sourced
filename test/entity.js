require('mocha'),
require('should');

var util = require('util');

var Entity = require('../lib/entity');

function TestEntity () {
  this.property = false;
  Entity.call(this);
}

util.inherits(TestEntity, Entity);

TestEntity.prototype.method = function (param) {
  this.property2 = param.data;
  this.digest('method', param);
  this.emit('method-ed');
};

Entity.digestMethod(TestEntity, function method2 (param1, param2) {
  this.param1 = param1;
  this.param2 = param2;
});

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
      test.version.should.eql(1);

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
    it('should marge a snapshot into the current object, overwriting any common properties', function () {

      var snapshot = {
          property: true,
          property2: true
        };

      var test = new TestEntity();

      test.merge(snapshot);

      test.property.should.equal(true);
      test.property2.should.equal(true);

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
    it('should correctly replay methods with multiple paramers', function () {

      var events = [
        {
          method: 'method2',
          data: [ { one: 1 }, { two: 2 } ],
          timestamp: 1452706711253,
          version: 1
        }
      ];

      var test = new TestEntity();

      test.replay(events);

      console.log(test)

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

  describe('#digestMethod', function () {

    it('should create an entity prototype method that functions the same as a naked function definition', function () {

      function DigestEntity () {
        this.property = false;
        Entity.call(this);
      }

      util.inherits(DigestEntity, Entity);

      Entity.digestMethod(DigestEntity, function method (param) {
        this.property2 = param.data;
        this.emit('method-ed');
      });

      var test = new DigestEntity();

      var data = { 'test': 'data' };

      test.method(data);

      test.newEvents.length.should.equal(1);
      test.newEvents[0].method.should.equal('method');
      test.newEvents[0].data.should.equal(data);
      test.version.should.eql(1);

    });

  });

});