const fs = require('fs')
const tape = require('tape')
const metering = require('../').meter
const defaultCostTable = require('../defaultCostTable')
let initCosts = require('./expected-out/initCosts.json')

tape('basic metering tests', t => {
  let files = fs.readdirSync(`${__dirname}/in/json`)
  // files = ['zeroCostOps.wast.json']
  for (const file of files) {
    const json = JSON.parse(fs.readFileSync(`${__dirname}/in/json/${file}`).toString())
    let costTable

    try {
      costTable = require(`${__dirname}/in/costTables/${file}.js`)
    } catch (e) {
      costTable = defaultCostTable
    }

    let meteredJson = metering(json, costTable)
    let expectedJson = require(`${__dirname}/expected-out/json/${file}`)

    t.deepEquals(meteredJson.module[5], expectedJson[5], `${file} - should have the correct json`)
    t.equals(meteredJson.initialCost, initCosts[file])
  }
  t.end()
})
