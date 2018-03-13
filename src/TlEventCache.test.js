import TlEventCache from './TlEventCache.js';
import { List } from 'immutable';
import { DateTime } from 'luxon';

let startDate = DateTime.fromISO('2018-03-13T08:00');
let endDate = DateTime.fromISO('2018-03-16T08:00');

let events = List([{//starts and ends before
	text: 'test',
	type: 'interval',
	startDate: DateTime.fromISO('2018-02-25T08:00'),
	endDate: DateTime.fromISO('2018-03-01T08:00'),
	row: 1,
	guid: '843147fe-6600-49de-8f80-eb641dc21157'
},{//starts before and ends within
	text: 'test',
	type: 'interval',
	startDate: DateTime.fromISO('2018-03-10T08:00'),
	endDate: DateTime.fromISO('2018-03-14T08:00'),
	row: 2,
	guid: 'bc9c92d6-00ee-45b3-95aa-c9cc1c9fee59'
},{//starts before and ends after
	text: 'test',
	type: 'interval',
	startDate: DateTime.fromISO('2018-03-11T08:00'),
	endDate: DateTime.fromISO('2018-04-25T08:00'),
	row: 3,
	guid: '99ecd83f-9da0-4887-aa89-bcad17dfa5d5'
},{//starts within and ends within
	text: 'test',
	type: 'interval',
	startDate: DateTime.fromISO('2018-03-13T11:00'),
	endDate: DateTime.fromISO('2018-03-15T23:00'),
	row: 4,
	guid: '0bc16b2e-4cc2-4bec-b1b9-4ff92f0ae7cb'
},{//starts within and ends after
	text: 'test',
	type: 'interval',
	startDate: DateTime.fromISO('2018-03-14T08:00'),
	endDate: DateTime.fromISO('2018-05-25T08:00'),
	row: 5,
	guid: '3c8774b7-36d5-4dd7-b67f-629e25169dc0'
},{//starts after and ends after
	text: 'test',
	type: 'interval',
	startDate: DateTime.fromISO('2018-03-17T08:00'),
	endDate: DateTime.fromISO('2018-04-15T08:00'),
	row: 6,
	guid: '2ee6c74e-67c9-403d-843c-96bd66cd63b2'
}]);

test('Merge empty', () => {
	let visibleEvents = List([events.get(1),events.get(2),events.get(3),events.get(4)]);

	let tlEventCache = new TlEventCache();
	expect(tlEventCache.merge(events,startDate,endDate)).toEqual(visibleEvents);
	expect(tlEventCache.merge(List(),startDate,endDate)).toEqual(visibleEvents);
})

test('Add new', () => {
	let tlEventCache = new TlEventCache();
	tlEventCache.merge(events,startDate,endDate);
	let newEvent = {
		text: '_____NEW_ITEM____',
		type: 'interval',
		startDate: DateTime.fromISO('2018-03-16T07:00'),
		endDate: DateTime.fromISO('2018-05-14T18:00'),
		row: 22,
		guid: '243bb168-6248-4ccd-a5f9-e41b228b60f3'
	}

	let visibleEvents = List([events.get(1),events.get(2),events.get(3),events.get(4),newEvent]);

	expect(tlEventCache.merge(List([newEvent]),startDate,endDate)).toEqual(visibleEvents);
})