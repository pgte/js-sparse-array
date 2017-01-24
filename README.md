# sparse-array

Sparse array implementation in JS with no dependencies

## Install

```bash
$ npm install sparse-array --save
```

## Use

```
const SparseArray = require('sparse-array')
const arr = new SparseArray()

const index = 0
arr.set(index, 'value')
arr.get(index) // 'value'
arr.unset(index)
arr.get(index) // undefined
```


## License

ISC