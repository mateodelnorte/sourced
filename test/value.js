require('mocha'),
require('should');

var util = require('util');

var Value = require('../lib/value');

describe('value', function () {
    it('should be immutable', function () {

      var value = Value({
        property: 'value'
      });

      value.should.have.property('property', 'value');

      value.property = 'new value';

      value.should.have.property('property', 'value');

    });
});
