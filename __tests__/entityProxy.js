import Entity from '../src/entityProxy'
import util from 'util'

function User () {
  this.apps = {}
  this.username = ''
  this.password = this.pass = ''

  Entity.apply(this, arguments)
}

util.inherits(User, Entity)

User.prototype.grant = function (param) {
  this.apps[param.appId] = param
  this.digest('grant', param)
  this.emit('granted', param, this)
}

function Inventory () {
  this.products = []

  Entity.apply(this, arguments)
}

util.inherits(Inventory, Entity)

describe('entityProxy', () => {
  it('allows users to use prototypical inheritance with new ES6 class', () => {
    const user = new User()
    const inventory = new Inventory()

    expect(user.apps).toEqual({})
    expect(user.username).toEqual('')
    expect(user.pass).toEqual('')
    expect(user.on).toBeDefined()
    expect(user.digest).toBeDefined()
    expect(user.grant).toBeDefined()

    expect(inventory.on).toBeDefined()
  })
})
