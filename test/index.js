const fs = require('fs')
const tape = require('tape')
const metering = require('../')
const defaultCostTable = require('./defaultCostTable')
const toolkit = require('wasm-json-toolkit')
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

    let meteredJson = metering.meterJSON(json, costTable)
    let expectedJson = require(`${__dirname}/expected-out/json/${file}`)

    t.deepEquals(meteredJson.module, expectedJson, `${file} - should have the correct json`)
    t.equals(meteredJson.initialCost, initCosts[file])
  }
  t.end()
})

tape('wasm test', t => {
  const json = require('./in/json/basic.wast.json')
  const expectedJSON = require('./expected-out/json/basic.wast.json')
  const wasm = toolkit.json2wasm(json)
  const metered = metering.meterWASM(wasm, defaultCostTable)
  const meteredJSON = toolkit.wasm2json(metered.module)

  t.deepEquals(meteredJSON, expectedJSON)
  t.end()
})
