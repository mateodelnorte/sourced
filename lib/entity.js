/* jslint node: true */

var events = require('events');
var log = require('debug')('sourced');
var util = require('util');
var _ = require('lodash');

function EntityError (msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'Entity Error';
}

util.inherits(EntityError, Error);

EntityError.prototype.name = 'EntityError';

function Entity (/*snapshot, evnts*/) {
  this.eventsToEmit = [];
  this.newEvents = [];
  this.replaying = false;
  this.snapshotVersion = 0;
  this.timestamp = Date.now();
  this.version = 0;
  events.EventEmitter.call(this);
  var args = Array.prototype.slice.call(arguments);
  if (args[0]){
    var snapshot = args[0];
    this.merge(snapshot);
  }
  if (args[1]){
    var evnts = args[1];
    this.replay(evnts);
  }
}

util.inherits(Entity, events.EventEmitter);

Entity.prototype.emit = function emit () {
  if ( ! this.replaying) {
    events.EventEmitter.prototype.emit.apply(this, arguments);
  }
};

Entity.prototype.enqueue = function enqueue () {
  if ( ! this.replaying) {
    this.eventsToEmit.push(arguments);
  }
};

Entity.prototype.digest = function digest (method, data) {
  if( ! this.replaying) {
    this.timestamp = Date.now();
    this.version = this.version + 1;
    log(util.format('digesting event \'%s\' w/ data %j', method, data));
    this.newEvents.push({
      method: method,
      data: data,
      timestamp: this.timestamp,
      version: this.version
    });
  }
};

Entity.prototype.merge = function merge (snapshot) {
  log(util.format('merging snapshot %j', snapshot));
  for (var property in snapshot) {
    if (snapshot.hasOwnProperty(property))
      var val = _.cloneDeep(snapshot[property]);
      this.mergeProperty(property, val);
  }
  return this;
};

Entity.prototype.mergeProperty = function mergeProperty (name, value) {
  if (mergeProperties.size &&
      mergeProperties.has(this.__proto__.constructor.name) &&
      mergeProperties.get(this.__proto__.constructor.name).has(name) &&
      typeof mergeProperties.get(this.__proto__.constructor.name).get(name) === 'function') {
    return mergeProperties.get(this.__proto__.constructor.name).get(name).call(this, value);
  }
  else if (typeof value === 'object' && typeof this[name] === 'object') _.merge(this[name], value);
  else this[name] = value;
};

Entity.prototype.replay = function replay (events) {
  var self = this;

  this.replaying = true;

  log(util.format('replaying events %j', events));

  events.forEach(function (event) {
    if (self[event.method]) {
      self[event.method](event.data);
      self.version = event.version;
    } else {
      var classNameRegex = /function (.{1,})\w?\(/,
          className = classNameRegex.exec(self.constructor.toString())[1],
          errorMessage = util.format('method \'%s\' does not exist on model \'%s\'', event.method, className);
      log(errorMessage);
      throw new EntityError(errorMessage);
    }
  });

  this.replaying = false;
};

Entity.prototype.snapshot = function snapshot () {
  this.snapshotVersion = this.version;
  var snap = _.cloneDeep(this, true);
  return this.trimSnapshot(snap);
};

Entity.prototype.trimSnapshot = function trimSnapshot (snapshot) {
  delete snapshot.eventsToEmit;
  delete snapshot.newEvents;
  delete snapshot.replaying;
  delete snapshot._events;
  delete snapshot._maxListeners;
  delete snapshot.domain;
  return snapshot;
};

Entity.digestMethod = function (type, fn) {
  if ( ! type) throw new EntityError('type is required for digest method definitions');
  if ( ! fn) throw new EntityError('a function is required for digest method definitions');
  if ( ! fn.name) throw new EntityError('Anonmyous functions are not allowed in digest method definitions. Please provide a function name');
  type.prototype[fn.name] = function () {
    var digestArgs = Array.prototype.slice.call(arguments);
    digestArgs.unshift(fn.name);
    Entity.prototype.digest.apply(this, digestArgs);

    var methodArgs = Array.prototype.slice.call(arguments);
    return fn.apply(this, methodArgs);
  };
};

var mergeProperties = new Map();

Entity.mergeProperty = function (type, name, fn) {
  if ( ! mergeProperties.has(type.name)) mergeProperties.set(type.name, new Map());
  mergeProperties.get(type.name).set(name, fn);
};

module.exports = Entity;
