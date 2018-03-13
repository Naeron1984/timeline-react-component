import { List } from 'immutable';

export default class TlEventCache {
	constructor(){
		this.eventsByStartDate = List();
		this.eventsByEndDate = List();
	}

	//merges everything but gives back only events in the interval
	merge(rawEvents,startDate,endDate) {

		this.eventsByStartDate = rawEvents.sort((a,b)=>{
			if(a.startDate < a.startDate) { return -1; }
			if(a.startDate > a.startDate) { return 1; }
			if(a.startDate === a.startDate) { return 0; }
		}).concat(this.eventsByStartDate);

		let datesVisible = this.eventsByStartDate.filter((event)=>{
			return (event.startDate >= startDate && event.startDate <= endDate) ||
						 (event.endDate <= endDate && event.endDate >= startDate) ||
					   (event.endDate > endDate && event.startDate < startDate)
		});

		return datesVisible;
	}

	tryPurge(startDate,endDate) {

	}
}