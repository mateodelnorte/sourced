'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Value = exports.Entity = exports.SourcedValue = exports.SourcedEntity = undefined;

var _entity = require('./entity');

var _entity2 = _interopRequireDefault(_entity);

var _entityProxy = require('./entityProxy');

var _entityProxy2 = _interopRequireDefault(_entityProxy);

var _value = require('./value');

var _value2 = _interopRequireDefault(_value);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const SourcedValue = _value2.default;

exports.SourcedEntity = _entity2.default;
exports.SourcedValue = SourcedValue;
exports.Entity = _entityProxy2.default;
exports.Value = _value2.default;