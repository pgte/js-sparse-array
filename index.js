'use strict'

// JS treats subjects of bitwise operators as SIGNED 32 bit numbers,
// which means the maximum amount of bits we can store inside each byte
// is 7..
const BITS_PER_BYTE = 7

module.exports = class SparseArray {
  constructor () {
    this._bitArrays = []
    this._data = []
    this._length = 0
    this._changedLength = false
    this._changedData = false
  }

  set (index, value) {
    let pos = this._internalPositionFor(index, false)
    if (value === undefined) {
      // unsetting
      if (pos !== -1) {
        // remove item from bit array and array itself
        this._unsetInternalPos(pos)
        this._unsetBit(index)
        this._changedLength = true
        this._changedData = true
      }
    } else {
      let needsSort = false
      if (pos === -1) {
        pos = this._data.length
        this._setBit(index)
        this._changedData = true
      } else {
        needsSort = true
      }
      this._setInternalPos(pos, index, value, needsSort)
      this._changedLength = true
    }
  }

  unset (index) {
    this.set(index, undefined)
  }

  get (index) {
    const pos = this._internalPositionFor(index, true)
    if (pos === -1) {
      return undefined
    }
    this._sortData()
    return this._data[pos][1]
  }

  push (value) {
    this.set(this.length, value)
    return this.length
  }

  get length () {
    this._sortData()
    if (this._changedLength) {
      const last = this._data[this._data.length - 1]
      this._length = last ? last[0] + 1 : 0
      this._changedLength = false
    }
    return this._length
  }

  forEach (iterator) {
    let i = 0
    while(i < this.length) {
      iterator(this.get(i), i, this)
      i++
    }
  }

  map (iterator) {
    let i = 0
    let mapped = new Array(this.length)
    while(i < this.length) {
      mapped[i] = iterator(this.get(i), i, this)
      i++
    }
    return mapped
  }

  reduce (reducer, initialValue) {
    let i = 0
    let acc = initialValue
    while(i < this.length) {
      const value = this.get(i)
      acc = reducer(acc, value, i)
      i++
    }
    return acc
  }

  find (finder) {
    let i = 0, found, last
    while ((i < this.length) && !found) {
      last = this.get(i)
      found = finder(last)
      i++
    }
    return found ? last : undefined
  }

  _internalPositionFor (index, noCreate) {
    const bytePos = this._bytePosFor(index, noCreate)
    if (bytePos >= this._bitArrays.length) {
      return -1
    }
    const byte = this._bitArrays[bytePos]
    const bitPos = index - bytePos * BITS_PER_BYTE
    const exists = (byte & (1 << bitPos)) > 0
    if (!exists) {
      return -1
    }
    const previousPopCount = this._bitArrays.slice(0, bytePos).reduce(popCountReduce, 0)

    const mask = ~(0xffffffff << (bitPos + 1))
    const bytePopCount = popCount(byte & mask)
    const arrayPos = previousPopCount + bytePopCount - 1
    return arrayPos
  }

  _bytePosFor (index, noCreate) {
    const bytePos = Math.floor(index / BITS_PER_BYTE)
    const targetLength = bytePos + 1
    while (!noCreate && this._bitArrays.length < targetLength) {
      this._bitArrays.push(0)
    }
    return bytePos
  }

  _setBit (index) {
    const bytePos = this._bytePosFor(index, false)
    this._bitArrays[bytePos] |= (1 << (index - (bytePos * BITS_PER_BYTE)))
  }

  _unsetBit(index) {
    const bytePos = this._bytePosFor(index, false)
    this._bitArrays[bytePos] &= ~(1 << (index - (bytePos * BITS_PER_BYTE)))
  }

  _setInternalPos(pos, index, value, needsSort) {
    const data =this._data
    const elem = [index, value]
    if (needsSort) {
      this._sortData()
      data[pos] = elem
    } else {
      // new element. just shove it into the array
      // but be nice about where we shove it
      // in order to make sorting it later easier
      if (data.length) {
        if (data[data.length - 1][0] >= index) {
          data.push(elem)
        } else if (data[0][0] <= index) {
          data.unshift(elem)
        } else {
          const randomIndex = Math.round(data.length / 2)
          this._data = data.slice(0, randomIndex).concat(elem).concat(data.slice(randomIndex))
        }
      } else {
        this._data.push(elem)
      }
      this._changedData = true
      this._changedLength = true
    }
  }

  _unsetInternalPos (pos) {
    this._data.splice(pos, 1)
  }

  _sortData () {
    if (this._changedData) {
      this._data.sort(sortInternal)
    }
  }
}

function popCountReduce (count, byte) {
  return count + popCount(byte)
}

function popCount(_v) {
  let v = _v
  v = v - ((v >> 1) & 0x55555555)                    // reuse input as temporary
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333)     // temp
  return ((v + (v >> 4) & 0xF0F0F0F) * 0x1010101) >> 24
}

function sortInternal (a, b) {
  return a[0] - b[0]
}
