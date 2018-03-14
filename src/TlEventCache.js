import { Set } from 'immutable';
import { Map } from 'immutable';

export default class TlEventCache {		
	constructor(){
		this.eventMap = Map();
	}

	merge(rawEvents) {
		let newMap = rawEvents.reduce((map,value)=>map.set(value.guid, value), Map());
		this.eventMap = this.eventMap.merge(newMap);		
	}

	getEvents(startDate,endDate) {
		let eventsVisible = this.eventMap.filter(event=>{
			return (event.startDate >= startDate && event.startDate <= endDate) ||
						 (event.endDate <= endDate && event.endDate >= startDate) ||
					   (event.endDate > endDate && event.startDate < startDate)
		}).toSet();

		return eventsVisible;
	}
}