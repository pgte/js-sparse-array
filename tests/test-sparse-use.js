'use strict'

const test = require('tape')
const SparseArray = require('../')

let arr

test('allows to be constructed', (t) => {
  arr = new SparseArray()
  t.end()
})

test('get an index that is not set returns undefined', (t) => {
  t.equal(arr.get(9), undefined)
  t.end()
})

test('can set a 9th and 6th positions', (t) => {
  arr.set(9, 'v9')
  arr.set(6, 'v6')
  t.end()
})

test('can get those values', (t) => {
  t.equal(arr.get(9), 'v9')
  t.equal(arr.get(6), 'v6')
  t.end()
})
