import { Subject } from 'rxjs/Subject';
import Chance from 'chance';
import {Repeat} from 'immutable';
import { DateTime } from 'luxon';
import { Duration } from 'luxon';
import { Interval } from 'luxon';

export default class EventSocket {
	constructor() {
		this.eventSubject = new Subject();
	}

	askForIntervalPastDuplex(minEndDate, maxEndDate) {

	}

	askForIntervalFutureDuplex(minStartDate, maxStartDate) {
		var _this = this;
		var chance = new Chance();
		setTimeout(()=>{

			let testData = Repeat({}, chance.integer({min: 5, max: 20}))
				.map(_ => {
					let evStartDate = randomDate(minStartDate, maxStartDate);
					let eventLength = randomDuration(Duration.fromObject({milliseconds: 3600000}),Duration.fromObject({milliseconds: 432000000}));
					let evEndDate = evStartDate.plus(eventLength);

					return {
						text: 'test',
						type: 'interval',
						startDate: evStartDate,
						endDate: evEndDate,
						row: chance.integer({min: 1, max: 10})
					};
				});

			_this.eventSubject.next(testData.toList());
		},300);
	}
}

function randomDate(startDate,endDate){
	let durationMillis = Interval.fromDateTimes(startDate,endDate).toDuration().milliseconds;
	let randomLengthMillis = Math.floor(Math.random() * durationMillis);
	return startDate.plus(Duration.fromMillis(randomLengthMillis));
}

function randomDuration(minLength,maxLength){
	return Duration.fromMillis(Math.floor(Math.random() * (maxLength.milliseconds - minLength.milliseconds))+minLength.milliseconds);	
}