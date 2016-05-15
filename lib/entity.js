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

/**
 * Creates an event-sourced Entity.
 * @class
 * @param {Object} [snapshot] A previously saved snapshot of an entity.
 * @param {Array} [events] An array of events to apply on instantiation.
 */
function Entity (/*snapshot, evnts*/) {

  /**
   * Hold the events to be emitted.
   * @member {Array} eventsToEmit
   */
  this.eventsToEmit = [];

  /**
   * Description
   * @member {Array} newEvents
   */
  this.newEvents = [];

  /**
   * Description
   * @member {Boolean} replaying
   */
  this.replaying = false;

  /**
   * Description
   * @member {Number} snapshotVersion
   */
  this.snapshotVersion = 0;

  /**
   * Description
   * @member {Number} timestamp
   */
  this.timestamp = Date.now();

  /**
   * Description
   * @member {Number} version
   */
  this.version = 0;

  events.EventEmitter.call(this);
  var args = Array.prototype.slice.call(arguments);

  /**
   * If one argument is passed, asume it's a snapshot and merge it.
   *
   * @todo This should probably be changed. What if it's not a snapshot/object?
   */
  if (args[0]){
    var snapshot = args[0];
    this.merge(snapshot);
  }

  /**
   * If two arguments are passed, asume the second is an array of events and
   * replay them.
   *
   * @todo This should probably be changed. What if it's not an array?
   */
  if (args[1]){
    var evnts = args[1];
    this.replay(evnts);
  }
}

util.inherits(Entity, events.EventEmitter);

/**
 * Wrapper around the EventEmitter.emit method that adds a condition so events
 * are not fired during replay.
 */
Entity.prototype.emit = function emit () {
  if ( ! this.replaying) {
    events.EventEmitter.prototype.emit.apply(this, arguments);
  }
};

/**
 * Add events to the queue of events to emit. If called during replay, this
 * method does nothing.
 */
Entity.prototype.enqueue = function enqueue () {
  if ( ! this.replaying) {
    this.eventsToEmit.push(arguments);
  }
};

/**
 * Digest a command with given data. This is called whenever you want to record
 * a command into the events for the entity. If called during replay, this
 * method does nothing.
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
 * @see Entity.prototype.mergeProperty
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
 * Given a name and a value, mergeProperty checks first attempt to find the
 * property in the mergeProperties map using the constructor name as key. If it
 * is found and it is a function, the function is called. If it is NOT found
 * we check if the property is an object. If so, we merge. If not, we simply
 * assign the passed value to the instance.
 *
 * @param  {String} name   the name of the property being merged.
 * @param  {Object} value  the value of the property being merged.
 * @see mergeProperties
 * @see Entity.mergeProperty
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
 * If the method in the event being replayed exists in the instance, we call
 * the mathod with the data in the event and set the version of the instance to
 * the version of the event. If the method is not found, we attempt to parse the
 * constructor to give a more descriptive error.
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
 * @returns  {Object}
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
 * @see Entity.prototype.snapshot
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
 * Helper function to automatically create a method that calls digest on the
 * param provided. Use it to add methods that automatically call digest.
 *
 * @param  {Object} type  the entity class to which the method will be added.
 * @param  {Function} fn  the actual function to be added.
 * @example
 *
 *    Entity.digestMethod(Car, function clearSettings (param) {
 *
 *     const self = this;
 *
 *     this.settings.get(param.name).forEach((name, config) => {
 *
 *       config.sources.forEach((source) => {
 *
 *         source.remove();
 *
 *       });
 *
 *     });
 *
 *     return this.settings;
 *
 *    });
 *
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

/**
 * mergeProperties holds a map of entity types to properties.
 * @see Entity.mergeProperty
 * @see Entity.prototype.mergeProperty
 * @static
 */
var mergeProperties = new Map();

/**
 * Convenience function to store references to functions that should be run
 * when mergin a particular property.
 *
 * @param  {Object} type  the entity class to which the property->fn belongs to.
 * @param  {String} name  the name of the property that holds the fn.
 * @param  {Function} fn  the function to execute when merging the property.
 * @see mergeProperties
 * @example
 *  function Wheel (status) {
 *    this.status = status;
 *  }
 *
 *  Wheel.prototype.go = function () {
 *    this.status = 'going';
 *  }
 *
 *  function Car () {
 *    this.id = null;
 *    this.wheel = new Wheel(); // for instantiating our default wheel, when we first 'new' up a Car
 *
 *    Entity.apply(this, arguments);
 *  }
 *
 *  util.inherits(Car, Entity);
 *
 *  Entity.mergeProperty(Car, 'interests', function (obj) {
 *    this.wheel = new Wheel(); // for instantiating our wheel from saved values in a database
 *  });
 */
Entity.mergeProperty = function (type, name, fn) {
  if ( ! mergeProperties.has(type.name)) mergeProperties.set(type.name, new Map());
  mergeProperties.get(type.name).set(name, fn);
};

module.exports = Entity;
