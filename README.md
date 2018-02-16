# opint-for-google-cloud

merge and reformat vm operations or file bucket metadata into operational intelligence

## Foreword

This software was designed to solve a particular problem reorganizing Google Cloud Platform data. If you find this software useful for your problem,
great!  If not, you are mostly on your own.  If you have questions, try asking on stackoverflow.com or serverfault.com.

## Usage

const opint = require('opint-for-google-cloud');

What follows below is pretty rough, and you may be better informed by reading the source code.

```opint.fromOps({
    zones,
    filter,
    keymap = (op)=>(op.targetLink.split("/").pop()),
    eventmap = (op)=>([{ event: op.operationType, time: new Date(op.insertTime).toUTCString() }]),
    dict}).then(...)```
	
returns Promise, by default resolves to `{ vmname: { zone: 'us-east4-a', events: [ event1, event2, ... ] }, ... }`

```opint.fromStorage({bucket, prefix, filter, keymap, eventmap, dict}).then(...)```

returns Promise, by resolves to `{ key: { events: [event1, event2, ...] }, ... }

## Full example

To do when I have some time.

## Copyright

Copyright 2018 Paul Brewer, Economic and Financial Technology Consulting LLC <drpaulbrewer@eaftc.com>

## License

The MIT License

## No relationship to Google, Inc.

This software is not a product of Google, Inc.

Google Cloud Platform[tm], Google Storage[tm], and Google Compute Engine[tm] are trademarks of Google, Inc.


