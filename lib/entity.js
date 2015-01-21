/* jslint node: true */

var clone = require('lodash').cloneDeep,
    events = require('events'),
    log = require('debug')('sourced'),
    util = require('util');

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
      var value = clone(snapshot[property]);
      this.mergeProperty(property, value);
  }
  return this;
};

Entity.prototype.mergeProperty = function mergeProperty (name, value) {
  this[name] = value;
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
  var snap = clone(this, true);
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

module.exports = Entity;