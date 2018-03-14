import { Set } from 'immutable';
import { Map } from 'immutable';

export default class TlEventCache {		
	constructor(){
		this.eventMap = Map();
	}

	//merges everything but gives back only events in the interval
	merge(rawEvents,startDate,endDate) {

		let newMap = rawEvents.reduce((map,value)=>map.set(value.guid, value), Map());
		this.eventMap = this.eventMap.merge(newMap);

		let eventsVisible = this.eventMap.filter(event=>{
			return (event.startDate >= startDate && event.startDate <= endDate) ||
						 (event.endDate <= endDate && event.endDate >= startDate) ||
					   (event.endDate > endDate && event.startDate < startDate)
		}).toSet();

		console.log(eventsVisible);

		return eventsVisible;
	}

	tryPurge(startDate,endDate) {

	}
}