/* Copyright 2018- Paul Brewer, Economic and Financial Technology Consulting LLC */
/* This file is open source software.  The MIT License applies to this software. */

/* jshint node:true,esnext:true,eqeqeq:true,undef:true,lastsemic:true,strict:true,unused:true */

"use strict";

const Compute = require('@google-cloud/compute');
const storage = require('@google-cloud/storage')();

function scanItemsAddEventsToDict({ dict, filter, init = (key)=>({ key, events:[] }), keymap, eventmap, eventz }){
    function sorter(a,b){
	return eventz(a)-eventz(b);
    }
    return function(items){
	if (Array.isArray(items)){
	    for(let i=0,l=items.length; i<l; ++i){
		const f = items[i];
		if (!filter || filter(f)){
		    const key = keymap(f);
		    if (key){
			const events = eventmap(f);
			if ((Array.isArray(events)) && (events.length)){
			    if (!dict[key])
				dict[key] = init(key, f);
			    [].push.apply(dict[key].events, eventmap(f));
			}
		    }
		}
	    }
	    if (eventz)
		Object.keys(dict).forEach((k)=>(dict[k].events.sort(sorter)));
	    return dict;
	} else {
	    throw new Error("opint.scanItemsAddEventsToDict expected array of items, got: "+typeof(items));
	}
    };
}

function fromOps({
    zones,
    filter,
    keymap = (op)=>(op.targetLink.split("/").pop()),
    eventmap = (op)=>([{ event: op.operationType, time: new Date(op.insertTime).toUTCString() }]),
    maxResults = 500,
    eventz,
    dict}){
    if (!dict) dict = {};
    const compute = new Compute();
    function opsByZone(z){
	return (compute
		.zone(z)
		.getOperations({ maxResults, orderBy: 'insertTime desc'})
		.then((resp)=>(resp[0]))
		.then((ops)=>(ops.map((o)=>(o && o.metadata))))
		.then((ops)=>(ops.filter((o)=>(o && (!filter || filter(o))))))
	       );
    }
    function init(key, op){
	const zone = (op && op.zone && op.zone.split("/").pop());
	return { key, zone, events:[] };
    }
    const scanItems = scanItemsAddEventsToDict({ dict, init, keymap, eventmap, eventz });
    // to merge array-of-arrays with [].concat.apply see Gumbo's answer at https://stackoverflow.com/a/10865042/103081
    return (
	Promise
	    .all(zones.map(opsByZone))
	    .then((allOps)=>([].concat.apply([], allOps)))
	    .then(scanItems)
    );
}

module.exports.fromOps = fromOps;

function fromStorage({bucket, prefix, maxResults=500, filter, keymap, eventmap, eventz, dict}){
    if (dict===undefined) dict = {};
    const scanItems = scanItemsAddEventsToDict({ dict, filter, keymap, eventmap, eventz});
    return (
	storage
	    .bucket(bucket)
	    .getFiles({maxResults, prefix})
	    .then((a)=>(a[0]))
	    .then(scanItems)
    );
}

module.exports.fromStorage = fromStorage;
