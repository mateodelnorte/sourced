/* jslint node: true */

var log = require('debug')('sourced'),
    util = require('util');

function EntityError (msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || 'Entity Error';
}

util.inherits(EntityError, Error);

EntityError.prototype.name = 'EntityError';

var Entity = function Entity () {
  this.replaying = false;
  this.version = 0;
  this.snapshotVersion = 0;
  this.newEvents = [];
};

Entity.prototype.apply = function apply (method, data) {
  if( ! this.replaying) {
    this.version = this.version + 1;
    log(util.format('applying event %s w/ data %j to %j', method, data, this));
    this.newEvents.push({
      method: method,
      data: data
    });
  }
};

Entity.prototype.merge = function merge (snapshot) {
  log(util.format('merging snapshot %j w/ %j', snapshot, this));
  for (var property in snapshot) {
    this[property] = snapshot[property];
  }
  return this;
};

Entity.prototype.replay = function replay (events) {
  var self = this;

  this.replaying = true;

    log(util.format('replaying events %j to %j', events, this));

  events.forEach(function (event) {
    if (self.hasOwnProperty(event.method)) {
      self[event.method](event.data);
    } else {
      var classNameRegex = /function (.{1,})\w?\(/,
          className = classNameRegex.exec(self.constructor.toString())[1],
          errorMessage = util.format('method \'%s\' does not exist on model \'%s\'', event.method, className);
      log(errorMessage);
      throw new EntityError(errorMessage);
    }
  });

  replaying = false;
};

Entity.prototype.snapshot = function snapshot () {
  // TODO: replace with object cloning
  delete this.replaying;
  delete this.newEvents;
  this.snapshotVersion++;
  var snap = Object.create(this);
  log(util.format('creating snapshot %j', snap));
  return snap;
};

module.exports = Entity;
