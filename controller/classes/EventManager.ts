import {shallowCompareObjects} from '@controller/utilities/utilities';

type EventListeners = {
	[key:string]:EventListener[];
};
type EventListenerOptions = {
	prepend?:boolean;
};
export type EventListener = {
	eventId:string;
	callbackFunction:Function;
	options?:EventListenerOptions;
	remove:Function;
};
export type EventBase = {
	eventId:string;
	eventSource:any;
};

export default class EventManager {

	/**
	 * Normalizes options by converting empty objects into undefined.
	 * @param options - The options to normalize.
	 * @returns The normalized options.
	 */
	static normalizeOptions(options?:EventListenerOptions):EventListenerOptions | undefined {
		if (options && Object.keys(options).length < 1) {
			return undefined;
		}
		return options;
	}
	
	#eventListeners:EventListeners = {};

	/**
	 * Adds an event listener.
	 * @param eventId - The id of the event to listen for.
	 * @param callbackFunction - The callback function when the event is dispatched.
	 * @param options - Optionally configure settings.
	 * @returns The added event listener.
	 */
	addEventListener(eventId:string, callbackFunction:Function, options?:EventListenerOptions):EventListener {
		options = (this.constructor as typeof EventManager).normalizeOptions(options);
		if (!Array.isArray(this.#eventListeners[eventId])) {
			this.#eventListeners[eventId] = [];
		}
		const eventListener:EventListener = {
			eventId: eventId,
			callbackFunction: callbackFunction,
			remove: () => {}, // placeholder
		};
		eventListener.remove = () => {
			this.removeEventListener(eventListener);
		};
		if (options) {
			eventListener.options = options
		}
		if (options && options.prepend) {
			this.#eventListeners[eventId].unshift(eventListener);
		}
		else {
			this.#eventListeners[eventId].push(eventListener);
		}
		return eventListener;
	}

	/**
	 * Removes an event listener.
	 * @param event - The event listener reference or id of the event listener to remove.
	 * @param callbackFunction - The callback function of the event listener to remove.
	 * @param options - The options of the event listener to remove.
	 * @returns The removed event listener or null if no event listener was removed.
	 */
	removeEventListener(event:EventListener | string, callbackFunction?:Function, options?:EventListenerOptions):EventListener | null {
		let foundEventId:string = '';
		let foundEventListenerIndex:number = -1;
		if (typeof event === 'object' && Object.hasOwn(event, 'eventId') && typeof event.eventId === 'string' && event.eventId) {
			const eventListener:EventListener = event;
			if (Array.isArray(this.#eventListeners[eventListener.eventId])) {
				const index:number = this.#eventListeners[eventListener.eventId].indexOf(eventListener);
				if (index >= 0) {
					foundEventId = eventListener.eventId;
					foundEventListenerIndex = index;
				}
			}
		}
		else if (typeof event === 'string') {
			const eventId:string = event;
			if (Array.isArray(this.#eventListeners[eventId])) {
				const index:number = this.#eventListeners[eventId].findIndex((item) => {
					if (item.eventId === eventId && item.callbackFunction === callbackFunction) {
						options = (this.constructor as typeof EventManager).normalizeOptions(options);
						if ((!item.options && !options) || (item.options && options && shallowCompareObjects(item.options, options))) {
							return true;
						}
					}
				});
				if (index >= 0) {
					foundEventId = eventId;
					foundEventListenerIndex = index;
				}
			}
		}
		if (foundEventId && foundEventListenerIndex >= 0) {
			const eventListener:EventListener = this.#eventListeners[foundEventId][foundEventListenerIndex];
			this.#eventListeners[foundEventId].splice(foundEventListenerIndex, 1);
			return eventListener;
		}
		return null;
	}

	/**
	 * Dispatch an event, triggering related callback functions.
	 * @param eventId - The event id to trigger.
	 * @param args - The arguments to pass into the callback function.
	 */
	dispatchEvent(eventId:string, args:[EventBase, ...any]):void {
		if (eventId !== args[0].eventId) {
			throw new TypeError(`'eventId' and 'args[0].eventId' must match.`);
		}
		if (Array.isArray(this.#eventListeners[eventId])) {
			for (const eventListener of this.#eventListeners[eventId]) {
				if (eventListener.callbackFunction) {
					eventListener.callbackFunction(...args);
				}
			}
		}
	}

};