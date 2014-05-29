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
  this.replaying = false;
  this.version = 0;
  this.snapshotVersion = 0;
  this.newEvents = [];
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

Entity.prototype.digest = function digest (method, data) {
  if( ! this.replaying) {
    this.version = this.version + 1;
    log(util.format('digesting event \'%s\' w/ data %j', method, data));
    this.newEvents.push({
      method: method,
      data: data
    });
  }
};

Entity.prototype.merge = function merge (snapshot) {
  log(util.format('merging snapshot %j w/ %j', snapshot, this));
  for (var property in snapshot) {
    if (snapshot.hasOwnProperty(property))
      this[property] = clone(snapshot[property]);
  }
  return this;
};

Entity.prototype.replay = function replay (events) {
  var self = this;

  this.replaying = true;

  log(util.format('replaying events %j to %j', events, this));

  events.forEach(function (event) {
    if (self[event.method]) {
      self[event.method](event.data);
      self.version = self.version + 1;
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
  this.version = this.version + 1;
  this.snapshotVersion = this.version;
  var snap = clone(this, true);
  delete snap.newEvents;
  delete snap.replaying;
  delete snap._events;
  delete snap._maxListeners;
  delete snap.domain;
  return snap;
};

module.exports = Entity;
