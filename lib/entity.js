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

/**
 * Digest a command with given data. This is called whenever you want to record
 * a command into the events for the entity.
 *
 * @param  {String} method  the name of the method/command you want to digest.
 * @param  {Object} data    the data that should be passed to the replay.
 */
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

/**
 * Merge a snapshot onto the entity.
 *
 * For every property passed in the snapshot, the value is deep-cloned and then
 * merged into the instance through mergeProperty. See mergeProperty for details.
 *
 * @param  {Object} snapshot  snapshot object.
 */
Entity.prototype.merge = function merge (snapshot) {
  log(util.format('merging snapshot %j', snapshot));
  for (var property in snapshot) {
    if (snapshot.hasOwnProperty(property))
      var val = _.cloneDeep(snapshot[property]);
      this.mergeProperty(property, val);
  }
  return this;
};

/**
 * Merge a property onto the instance.
 *
 * Given a name and a value, mergeProperty checks if the name corresponds to a
 * function or an object.
 * - If not either, the value is simply applied to the
 * instance.
 * - If value is an object and the name corresponds to a value that is
 * also an object in the instance, it is merged.
 * [CONFIRM] - If the name corresponds to a function, the funcition is executed with
 * value passed as the parameter.
 *
 * @param  {String} name   the name of the property being merged.
 * @param  {Object} value  the value of the property being merged.
 */
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

/**
 * Replay an array of events onto the instance.
 *
 * The goal here is to allow application of events without emitting, enqueueing
 * nor digesting the replayed events. This is done by setting this.replaying to
 * true which emit, enqueue and digest check for.
 *
 * - If the method in the event being replayed exists in the instance, we call
 * the mathod with the data in the event and set the version of the instance to
 * the version of the event.
 * [CONFIRM] - What's happening in the else block where classNameRegex is used?
 *
 * @param  {Array} events  an array of events to be replayed.
 */
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


/**
 * Create a snapshot of the current state of the entity instance.
 *
 * Here the instance's snapshotVersion property is set to the current version,
 * then the instance is deep-cloned and the clone is trimmed of the internal
 * sourced attributes using trimSnapshot and returned.
 *
 * [CONFIRM] - Looking at https://lodash.com/docs#cloneDeep, I couldn't see what
 * the second parameter to _.cloneDeep was for (true in this case). Then looked
 * at https://github.com/lodash/lodash/blob/2.4.1/lodash.js (the version
 * required in this package) and believe it's meant to make clone to clone
 * deeply.
 */
Entity.prototype.snapshot = function snapshot () {
  this.snapshotVersion = this.version;
  var snap = _.cloneDeep(this, true);
  return this.trimSnapshot(snap);
};

/**
 * Remove the internal sourced properties from the passed snapshot.
 *
 * Snapshots are to contain only entity data properties. This trims all other
 * properties from the snapshot.
 *
 * @param  {Object} snapshot  the snapshot to be trimmed.
 */
Entity.prototype.trimSnapshot = function trimSnapshot (snapshot) {
  delete snapshot.eventsToEmit;
  delete snapshot.newEvents;
  delete snapshot.replaying;
  delete snapshot._events;
  delete snapshot._maxListeners;
  delete snapshot.domain;
  return snapshot;
};

/**
 * Remove the internal sourced properties from the passed snapshot.
 *
 * [CONFIRM] based on https://github.com/mateodelnorte/sourced/search?utf8=%E2%9C%93&q=digestMethod
 * this method does not seem to be used anywhere. Can you confirm?
 */
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
