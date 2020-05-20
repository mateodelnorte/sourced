import SourcedEntity from './entity'
import debug from 'debug'

const log = debug('sourced')

let hasWarned = false

const proxyConstructor = {
  apply: (Target, thisArg, args) => {
    if (!hasWarned) warnUser()
    log(`Initializing ${Target.name} with:`, args)
    const entity = new Target()
    Object.assign(thisArg, entity)
    thisArg.rehydrate(...args)
  }
}

const warnUser = () => {
  console.warn(`DEPRECATION WARNING:
Thanks for using sourced! We've recently upgraded our internal APIs to make use of ECMAScript (ES6+) style classes.

You are currently using a proxied version of the new "SourcedEntity" class.

We made this so you don't have to do anything right now, however, in a future version, the current "Entity" 
which is a Proxy, that you are using now, will be renamed to EntityProxy in order to free up the "Entity" class name.

At that point you will have to change your require statement to 

    var Entity = require('sourced').EntityProxy;

in order to continue using the classic prototypical inheritance approach, or refactor to use classes.

An example of using Sourced with Classes is available here:

https://github.com/patrickleet/sourced-repo-mongo/blob/cb8c40084d0fcf6f8aa8524ef5d6c03518eb9d47/index.test.js#L10

The key difference is calling "rehydrate" at the end of your constructor.
    `)
  hasWarned = true
}

const Entity = new Proxy(SourcedEntity, proxyConstructor)

export default Entity
