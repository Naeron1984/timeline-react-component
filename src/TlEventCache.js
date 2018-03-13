import { List } from 'immutable';

export default class TlEventCache {
	constructor(){
		this.eventsByStartDate = List();
//		this.eventsByEndDate = List();
	}

	//merges everything but gives back only events in the interval
	merge(rawEvents,startDate,endDate) {
		this.eventsByStartDate = (rawEvents.concat(this.eventsByStartDate))
			.sortBy(item=>item.startDate.valueOf());

// (a,b)=>{
// 			if(a.startDate < b.startDate) { return -1; }
// 			if(a.startDate > b.startDate) { return 1; }
// 			if(a.startDate === b.startDate) { return 0; }
// 		}			

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