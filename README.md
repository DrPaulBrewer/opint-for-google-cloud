# opint-for-google-cloud

merge and reformat vm operations or file bucket metadata into operational intelligence

## Foreword

This software was designed to solve a particular problem reorganizing Google Cloud Platform data. If you find this software useful for your problem,
great!  If not, you are mostly on your own.  If you have questions, try asking on stackoverflow.com or serverfault.com.

## Usage

const opint = require('opint-for-google-cloud');

### opint.fromOps

    opint.fromOps({
        zones,
        filter,
        keymap = (op)=>(op.targetLink.split("/").pop()),
        eventmap = (op)=>([{ event: op.operationType, time: new Date(op.insertTime).toUTCString() }]),
	maxResults = 500,
	eventz,
        dict}).then(...)
	
Required parameters:
* `zones` an array of Google Cloud Platform zones, in short format, such as `['us-east1-c','us-west1-a']`

Optional parameters:
* `filter` a `function(op){ ... }` where `op` is an GCP Operation metadata object, that returns true if the op should be included. The default is include all. 
* `keymap` a `function(op){ return key; }` where `op` is a GCP Operation metadata object, and the return `key:string` is used to group GCP Operations for reporting.  The default `keymap` extracts virtual machine name.
* `eventmap` a `function(op){ return arrayOfEvents; }` where `op` is a GCP Operation metadata object, and the return is an array of event objects for reporting.   The default `eventmap` extracts the Operation type (typically: insert, delete, compute.instances.guestTerminate, compute.instances.preempt)  and the current time 
* `eventz` a `function(event){ return numberForSorting; }` custom sorting function for events applied after each insert in an existing grouping of events.  The default is no sorting.
* `dict` an Object to merge new data into.  Default is to create an empty `{}`
* `maxResults` (default: 500) limit passed to `compute.zone(zones).getOperations()`.  The GCP API limit seems to be lower.

Returns a `Promise`

Promise resolution: 
The promise resolves to an object with keys defined by keymap and values that are objects containing
the grouping `key` returned by `keymap`, the Google Cloud `zone` and an array of events.  
	
example `{ myvmname: { key: myvnmname, zone: 'us-east4-a', events: [ event1, event2, ... ] }, ... }`

### opint.fromStorage

```opint.fromStorage({bucket, prefix, filter, keymap, eventmap, eventz, dict, maxResults=500}).then(...)```

Required parameters:
* `bucket` The name of a bucket in Google Cloud Storage to which you have read and list access.

Optional parameters:
* `prefix` a `string` Only files with names that begin with the prefix are returned. 
* `filter` a `function(f){ ... }` where `f` is an Google Cloud Storage file object, that returns true if the file should be included. The default is to include all. 
* `keymap` a `function(f){ return key; }` where `f` is a Google Cloud Storage file object, and the return `key:string` is used to group events for reporting.  
* `eventmap` a `function(f){ return arrayOfEvents; }` where `f` is a Google Cloud Storage file object, and the return is an array of event objects for reporting.   
* `eventz` a `function(event){ return numberForSorting; }` custom sorting function for events applied after each insert in an existing grouping of events.  The default is no sorting.
* `dict` an Object to merge new data into.  Default is to create an empty `{}`
* `maxResults` (default: 500) limit passed to `compute.zone(zones).getOperations()`.  The GCP API limit seems to be lower.

Returns a `Promise`

Promise resolution: 
The promise resolves to an object with keys defined by keymap and values that are objects containing
the grouping key, the zone and an array of events.  

returns Promise, by resolves to `{ yourkey: { key: yourkey, events: [event1, event2, ...] }, ... }

## Full example

To do when I have some time.

## Copyright

Copyright 2018 Paul Brewer, Economic and Financial Technology Consulting LLC <drpaulbrewer@eaftc.com>

## License

The MIT License

## No relationship to Google, Inc.

This software is not a product of Google, Inc.

Google Cloud Platform[tm], Google Storage[tm], and Google Compute Engine[tm] are trademarks of Google, Inc.


