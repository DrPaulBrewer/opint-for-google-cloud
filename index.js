/* Copyright 2018- Paul Brewer, Economic and Financial Technology Consulting LLC */
/* This file is open source software.  The MIT License applies to this software. */

/* jshint node:true,esnext:true,eqeqeq:true,undef:true,lastsemic:true,strict:true,unused:true */

"use strict";

const Compute = require('@google-cloud/compute');
const storage = require('@google-cloud/storage')();

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
		.then((ops)=>{ if (filter) return ops.filter(filter); return ops; })
	       );
    }
    return (Promise.all(zones.map(opsByZone))
     .then((allOps)=>{
	 // to merge array-of-arrays see Gumbo's answer at https://stackoverflow.com/a/10865042/103081
	 const merged = [].concat.apply([], allOps);
	 merged.sort((a,b)=>((+new Date(b.insertTime || 0))-(+new Date(a.insertTime || 0))));
	 for(var i=0,l=merged.length; i<l; ++i){
	     const op = merged[i];
	     const key = keymap(op);
	     if (key){
		 const zone = op.zone.split("/").pop();
		 if (!dict[key])
		     dict[key] = { key, zone, events:[]};
		 [].push.apply(dict[key].events, eventmap(op));
		 if (eventz)
		     dict[key].events.sort((a,b)=>(eventz(a)-eventz(b)));
	     }
	 }
	 return dict;
     })
	   );
}

module.exports.fromOps = fromOps;

function fromStorage({bucket, prefix, maxResults=500, filter, keymap, eventmap, eventz, dict}){
    if (dict===undefined) dict = {};
    return (
	storage
	    .bucket(bucket)
	    .getFiles({maxResults, prefix})
	    .then((a)=>(a[0]))
	    .then((files)=>{
		if (Array.isArray(files)){
		    for(let i=0,l=files.length; i<l; ++i){
			let f = files[i];
			if (!filter || filter(f)){
			    let key = keymap(f);
			    if (key){
				if (!dict[key])
				    dict[key] = { key, events: [] };
				[].push.apply(dict[key].events, eventmap(f));
				if (eventz)
				    dict[key].events.sort((a,b)=>(eventz(a)-eventz(b)));
			    }
			}
		    }
		    return dict;
		}
		throw new Error("storageint expected array of Google Cloud Storage files, got: "+typeof(files));
	    })
    );
}

module.exports.fromStorage = fromStorage;
