# TOC
   - [entity](#entity)
     - [#digest](#entity-digest)
     - [#merge](#entity-merge)
     - [#replay](#entity-replay)
     - [#snapshot](#entity-snapshot)
   - [value](#value)
<a name=""></a>
 
<a name="entity"></a>
# entity
<a name="entity-digest"></a>
## #digest
should wrap param object with method matching calling method name and add to array of newEvents.

```js
var param = {
          data: 'data'
        };

      var test = new TestEntity(),
          data = { test: 'data' };

      test.method(data);

      test.newEvents.length.should.equal(1);
      test.newEvents[0].method.should.equal('method');
      test.newEvents[0].data.should.equal(data);
```

<a name="entity-merge"></a>
## #merge
should marge a snapshot into the current object, overwriting any common properties.

```js
var snapshot = {
          property: true,
          property2: true
        };

      var test = new TestEntity();

      test.merge(snapshot);

      test.property.should.equal(true);
      test.property2.should.equal(true);
```

<a name="entity-replay"></a>
## #replay
should throw an entity error with name of model when attempting to replay a method an entity does not implement.

```js
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
```

<a name="entity-snapshot"></a>
## #snapshot
should return object with current state of the entity.

```js
;
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
```

<a name="value"></a>
# value
should be immutable.

```js
var value = Value({
        property: 'value'
      });

      value.should.have.property('property', 'value');

      value.property = 'new value';

      value.should.have.property('property', 'value');
```

