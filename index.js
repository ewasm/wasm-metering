const toolkit = require('wasm-json-toolkit')
const text2json = toolkit.text2json
const SECTION_IDS = require('wasm-json-toolkit/json2wasm').SECTION_IDS
const defaultCostTable = require('./defaultCostTable.json')

// gets the cost of an operation for entry in a section from the cost table
function getCost (json, costTable = {}, defaultCost = 0) {
  let cost = 0
  // finds the default cost
  defaultCost = costTable['DEFAULT'] !== undefined ? costTable['DEFAULT'] : 0

  if (typeof costTable === 'function') {
    cost = costTable(json)
  } else if (Array.isArray(json)) {
    json.forEach(el => {
      cost += getCost(el, costTable)
    })
  } else if (typeof costTable === 'number') {
    cost = costTable
  } else if (typeof json === 'object') {
    for (const propName in json) {
      const propCost = costTable[propName]
      if (propCost) {
        cost += getCost(json[propName], propCost, defaultCost)
      }
    }
  } else if (costTable[json] === undefined) {
    cost = defaultCost
  } else {
    cost = costTable[json]
  }
  return cost
}

// meters a single code entrie
function meterCodeEntry (entry, costTable, meterFuncIndex, meterType, cost = 0) {
  function meteringStatement (cost, meteringImportIndex) {
    return text2json(`${meterType}.const ${cost} call ${meteringImportIndex}`)
  }
  function remapOp (op, funcIndex) {
    if (op.name === 'call' && op.immediates >= funcIndex) {
      op.immediates = (++op.immediates).toString()
    }
  }
  function meterTheMeteringStatement () {
    const code = meteringStatement(0, 0)
    // sum the operations cost
    return code.reduce(
      (sum, op) => sum + getCost(op.name, costTable.code)
      , 0)
  }

  // operations that can possible cause a branch
  const branchingOps = new Set(['end', 'br', 'br_table', 'br_if', 'if', 'else', 'return', 'loop'])
  const meteringOverHead = meterTheMeteringStatement()
  let code = entry.code.slice()
  let meteredCode = []

  cost += getCost(entry.locals, costTable.local)

  while (code.length) {
    let i = 0

    // meters a segment of wasm code
    while (true) {
      const op = code[i++]
      remapOp(op, meterFuncIndex)

      cost += getCost(op.name, costTable.code)
      if (branchingOps.has(op.name)) {
        break
      }
    }

    // add the metering statement
    if (cost !== 0) {
      // add the cost of metering
      cost += meteringOverHead
      meteredCode = meteredCode
        .concat(meteringStatement(cost, meterFuncIndex))
    }

    // start a new segment
    meteredCode = meteredCode
      .concat(code.slice(0, i))
    code = code.slice(i)
    cost = 0
  }

  entry.code = meteredCode
  return entry
}

/**
 * Injects metering into a JSON output of [wasm2json](https://github.com/ewasm/wasm-json-toolkit#wasm2json)
 * @param {Object} json the json tobe metered
 * @param {Object} opts
 * @param {Object} [opts.costTable=defaultTable] the cost table to meter with. See these notes about the default.
 * @param {String} [opts.moduleStr='metering'] the import string for the metering function
 * @param {String} [opts.fieldStr='usegas'] the field string for the metering function
 * @param {String} [opts.meterType='i64'] the regerster type that is used to meter. Can be `i64`, `i32`, `f64`, `f32`
 * @return {Object} This contains the fields `initailAmount`, the amount it
 * cost to start the module and `module`, the metered json.
 */
exports.meterJSON = (json, opts) => {
  function findSection (module, sectionName) {
    return module.find(section => section.name === sectionName)
  }

  function createSection (module, sectionName) {
    const newSectionId = SECTION_IDS[sectionName]
    for (let index in module) {
      const section = module[index]
      const sectionId = SECTION_IDS[section.name]
      if (sectionId) {
        if (newSectionId < sectionId) {
          // inject a new section
          module.splice(index, 0, {
            name: sectionName,
            entries: []
          })
          return
        }
      }
    }
  }

  let funcIndex = 0
  let initialCost = 0
  let functionModule, typeModule

  let {costTable, moduleStr, fieldStr, meterType} = opts

  // set defaults
  if (!costTable) costTable = defaultCostTable
  if (!moduleStr) moduleStr = 'metering'
  if (!fieldStr) fieldStr = 'usegas'
  if (!meterType) meterType = 'i64'

  // add nessicarry sections iff they don't exist
  if (!findSection(json, 'type')) createSection(json, 'type')
  if (!findSection(json, 'import')) createSection(json, 'import')

  const importJson = {
    'moduleStr': moduleStr,
    'fieldStr': fieldStr,
    'kind': 'function'
  }
  const importType = {
    'form': 'func',
    'params': [meterType]
  }

  json = json.slice(0)

  for (let section of json) {
    section = Object.assign(section)
    switch (section.name) {
      case 'type':
        // mark the import index
        importJson.type = section.entries.push(importType) - 1
        // save for use for the code section
        typeModule = section
        break
      case 'function':
        // save for use for the code section
        functionModule = section
        break
      case 'import':
        for (const entry of section.entries) {
          initialCost += getCost(entry, costTable.import)
          if (entry.kind === 'function') {
            funcIndex++
          }
        }
        // append the metering import
        section.entries.push(importJson)
        break
      case 'export':
        for (const entry of section.entries) {
          initialCost += getCost(entry, costTable.global)
          if (entry.kind === 'function' && entry.index >= funcIndex) {
            entry.index++
          }
        }
        break
      case 'element':
        for (const entry of section.entries) {
          initialCost += getCost(entry, costTable.element)
          // remap elements indices
          entry.elements = entry.elements.map(el => el >= funcIndex ? ++el : el)
        }
        break
      case 'start':
        initialCost += getCost(section, costTable.start)
        // remap start index
        if (section.index >= funcIndex) section.index++
        break
      case 'code':
        for (const i in section.entries) {
          const entry = section.entries[i]
          const typeIndex = functionModule.entries[i]
          const type = typeModule.entries[typeIndex]
          const cost = getCost(type, costTable.type)

          meterCodeEntry(entry, costTable.code, funcIndex, meterType, cost)
        }
        break
      default:
        if (section.entries) {
          for (const entry of section.entries) {
            initialCost += getCost(entry, costTable[section.name])
          }
        }
    }
  }
  return {
    initialCost: initialCost,
    module: json
  }
}

/**
 * Injects metering into a webassembly binary
 * @param {Object} json the json tobe metered
 * @param {Object} opts
 * @param {Object} [opts.costTable=defaultTable] the cost table to meter with. See these notes about the default.
 * @param {String} [opts.moduleStr='metering'] the import string for the metering function
 * @param {String} [opts.fieldStr='usegas'] the field string for the metering function
 * @param {String} [opts.meterType='i64'] the regerster type that is used to meter. Can be `i64`, `i32`, `f64`, `f32`
 * @return {Object} This contains the fields `initailAmount`, the amount it
 * cost to start the module and `module`, the metered json.
 */
exports.meterWASM = (wasm, opts = {}) => {
  let json = toolkit.wasm2json(wasm)
  json = exports.meterJSON(json, opts)
  return {
    initailCost: json.initailCost,
    module: toolkit.json2wasm(json.module)
  }
}
