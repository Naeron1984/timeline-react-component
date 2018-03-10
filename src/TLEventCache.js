export class TLEventCacheChangeSet {
	filterChangedData(startDate,endDate){

	}
}

export default class TLEventCache {
	constructor(){
		this.eventsByStartDate = [];
		this.eventsByEndDate = [];
	}

	//only merges between given dates, stuff outside will be unaffected (meaning ending before interval or staring after)
	merge(rawEvents,startDate,endDate) {
		let changeSet = new TLEventCacheChangeSet();

		//todo: remove items

		//todo: merge to start date
		let index = null;
		for(ev of rawEvents){
			let index = this.findIndex(this.eventsByStartDate,ev.evStartDT.millis,index);

			let isTheSame = this.compareEV(this.eventsByStartDate,index,ev);
			//if(isTheSame)
		}

		//todo: merge to end date

		return changeSet;
	}

	tryPurge(startDate,endDate) {

	}
}