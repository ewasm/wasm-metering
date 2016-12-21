const tape = require('tape')
const metering = require('../').meter
const json = require('./memory.json')

tape('different cost tables', t => {
  let costTable = require('./generativeCostTable.js')
  let meteredJson = metering(json, costTable)
  // let expectedJson = require(`${__dirname}/
  t.deepEquals(meteredJson.initialCost, 20, 'should generat costs for memory')

  costTable.data = 5
  meteredJson = metering(json, costTable)

  t.deepEquals(meteredJson.initialCost, 30, 'should use interger for section type')

  costTable.data = {
    'offset': {
      'return_type': {
        'i32': 3
      }
    }
  }

  meteredJson = metering(json, costTable)
  t.deepEquals(meteredJson.initialCost, 26, 'should use nested keys for metering')
  t.end()
})

