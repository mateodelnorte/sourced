import Entity from './entity'
import debug from 'debug'

const log = debug('sourced')

const proxyConstructor = {
  apply : ( target, thisArg, args ) => {
    log( `Initializing ${ target.name } with:`, args );
    let entity = new target();
    Object.assign(thisArg, entity)
    thisArg.rehydrate(...args)
  }
};

const EntityProxy = new Proxy(Entity, proxyConstructor);

export default EntityProxy
