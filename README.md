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
        eventmap = (op)=>([{ event: op.operationType, time: new Date(op.insertTime).toUTCString(), status: op.statusMessage, errors: (op.error && op.errors) }]),
        maxResults = 500,
        eventz,
        dict
     }).then(...)
	
Required parameters:
* `zones` an array of Google Cloud Platform zones, in short format, such as `['us-east1-c','us-west1-a']`

The properties of `op` may be documented in [Google Compute Engine[tm] REST zoneOperation](https://cloud.google.com/compute/docs/reference/rest/v1/zoneOperations)

Optional parameters:
* `filter` a `function(op){ ... }` where `op` is an GCP Operation metadata object, that returns true if the op should be included. The default is include all. 
* `keymap` a `function(op){ return key; }` where `op` is a GCP Operation metadata object, and the return `key:string` is used to group GCP Operations for reporting.  The default `keymap` extracts virtual machine name.
* `eventmap` a `function(op){ return arrayOfEvents; }` where `op` is a GCP Operation metadata object, and the return is an array of event objects for reporting.   The default `eventmap` extracts the Operation type (typically: insert, delete, compute.instances.guestTerminate, compute.instances.preempt), any status message, any errors, and the operation initiation time 
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

## Full example

### Example Goal

The goal of the example is to create a basic bare bones report of a system that processes customer jobs on Google Cloud VMs. This is based on an actual system.  Some details about the system have been changed for this example.

#### Example System

We have a SaaS web site running on Google Cloud that does some extensive computing on demand. We use one VM per customer 
computing job. Each job is given a `jobid`.  Customer calculations are run by Google Compute Engine VMs 
that are named `ourjobs-${jobid}` and when these VMs finish the calculation is saved in a similarly named named
`/path/to/customer/${customer}/${jobid}.zip` cloud storage file in bucket 'ourbucket'. 

When the customer has received the file, we create a datestamp in a metadata key called delivered. 

To keep costs down, we sometimes use preemptible instances.  These are VMs that cost ~80% less, but are part of 
excess supply at Google and can be reassigned at any time.

#### Desired Output

We want the Google Cloud Storage files to generate 'saved' and 'delivered' events.

We want the operations log to generate VM events like 'insert', 'guestTerminate', 'preempted', 'delete'.

We would like the output to look like this: 

```json
[                                                                                                                                                                                       
    {                                                                                                                                                                                           
        "key": "ourjobs-20180214t092541",                                                                                                                                                       
        "zone": "us-east4-b",                                                                                                                                                                   
        "events": [                                                                                                                                                                             
            {                                                                                                                                                                                   
                "event": "delete",                                                                                                                                                              
                "time": "Wed, 14 Feb 2018 10:28:55 GMT"                                                                                                                                         
            },                                                                                                                                                                                  
            {                                                                                                                                                                                   
                "event": "compute.instances.guestTerminate",                                                                                                                                    
                "time": "Wed, 14 Feb 2018 09:46:24 GMT"                                                                                                                                         
            },                                                                                                                                                                                  
            {                                                                                                                                                                                   
                "event": "delivered",                                                                                                                                                           
                "time": "Wed, 14 Feb 2018 09:46:22 GMT"                                                                                                                                         
            },                                                                                                                                                                                  
            {                                                                                                                                                                                   
                "event": "saved",                                                                                                                                                               
                "time": "Wed, 14 Feb 2018 09:45:59 GMT"                                                                                                                                         
            },                                                                                                                                                                                  
            {                                                                                                                                                                                   
                "event": "insert",                                                                                                                                                              
                "time": "Wed, 14 Feb 2018 09:26:02 GMT"                                                                                                                                         
            }                                                                                                                                                                                   
        ]                                                                                                                                                                                       
    },                                                                                                                                                                                          
    {                                                                                                                                                                                           
        "key": "ourjobs-20180213t071125",                                                                                                                                                       
        "zone": "us-east4-b",                                                                                                                                                                   
        "events": [                                                                                                                                                                             
            {                                                                                                                                                                                   
                "event": "delete",                                                                                                                                                              
                "time": "Tue, 13 Feb 2018 08:13:13 GMT"                                                                                                                                         
            },                                                                                                                                                                                  
            {                                                                                                                                                                                   
                "event": "delivered",                                                                                                                                                           
                "time": "Tue, 13 Feb 2018 07:22:47 GMT"                                                                                                                                         
            },                                                                                                                                                                                  
            {                                                                                                                                                                                   
                "event": "compute.instances.guestTerminate",                                                                                                                                    
                "time": "Tue, 13 Feb 2018 07:22:10 GMT"                                                                                                                                         
            },                                                                                                                                                                                  
            {                                                                                                                                                                                   
                "event": "saved",                                                                                                                                                               
                "time": "Tue, 13 Feb 2018 07:21:45 GMT"                                                                                                                                         
            },                                                                                                                                                                                  
            {                                                                                                                                                                                   
                "event": "insert",                                                                                                                                                              
                "time": "Tue, 13 Feb 2018 07:11:41 GMT"                                                                                                                                         
            }                                                                                                                                                                                   
        ]                                                                                                                                                                                       
    },                    
...
]
```

### Example Solution

We track all of this with the following report generator, based on `opint-for-google-cloud`

```javascript
   function generateTheReport(reply, sanitize){
    const zones = ['us-west1-b','us-east4-b'];
    const bucket = 'our-bucket';
    function opsFilter(o){
      return (o && o.targetLink && o.targetLink.includes("/instances/ourjobs-"));
    }
    function bucketFilter(f){
        // our bucket files always have 4 /'s like path/to/customer/fred/12318312793.zip
	// and the jobid is the last element
         const levels = (f && f.name && f.name.split("/").length);
         return ((levels===5) && (f.name.endsWith(".zip")));
    }
    function bucketKeymap(f){
       return ('ourjobs-'+(f.name.split("/").pop().toLowerCase().replace(".zip","")));
    }
    function bucketEvents(f){
        const events = [];
        if (f && f.metadata && f.metadata.timeCreated)
           events.unshift({ event: 'saved', time: new Date(f.metadata.timeCreated).toUTCString() });
        if (f && f.metadata && f.metadata.metadata && f.metadata.metadata.delivered)
           events.unshift({ event: 'delivered', time: new Date(f.metadata.metadata.delivered).toUTCString() });
        return events;
    }
    function eventz(event){
        if (!event.time) return 0;
        return -(new Date(event.time)); // reverse chronological order
    }
    (opint
      .fromOps({
                 zones,
                 filter: opsFilter,
                 eventz
                })
       .then((instances)=>(opint.fromStorage({bucket, filter: bucketFilter, keymap: bucketKeymap, eventmap: bucketEvents, eventz, dict: instances })))
       .then((instances)=>(Object.keys(instances).sort().reverse().map((i)=>(instances[i]))))
       .then((report)=>(reply(sanitize(report))))
     );
    }
```    

## Copyright

Copyright 2018 Paul Brewer, Economic and Financial Technology Consulting LLC <drpaulbrewer@eaftc.com>

## License

The MIT License

This software Copyright (c) 2018 Paul Brewer, Economic & Financial Technology Consulting LLC <drpaulbrewer@eaftc.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


## No relationship to Google, Inc.

This software is not a product of Google, Inc.

Google Cloud Platform[tm], Google Storage[tm], and Google Compute Engine[tm] are trademarks of Google, Inc.


