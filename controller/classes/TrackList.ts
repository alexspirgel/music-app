import type * as EventManagerTypes from '@controller-classes/EventManager';
import type * as trackTypes from '@controller-types/track';
import EventManager from '@controller-classes/EventManager';
import TrackListItem from '@controller-classes/TrackListItem';

// Types

export type TrackThing = trackTypes.Track | TrackListItem;
type TrackListEvent = EventManagerTypes.EventBase & {
	eventSource:TrackList;
};
type SetItemsEvent<ItemType extends TrackListItem = TrackListItem> = TrackListEvent & {
	items:ItemType[];
};
export type BeforeSetItemsEvent = SetItemsEvent & {eventId:'beforeSetItems';};
export type AfterSetItemsEvent = SetItemsEvent & {eventId:'afterSetItems';};
type AddRemoveItemEvent<ItemType extends TrackListItem = TrackListItem> = TrackListEvent & {
	index:number;
	item:ItemType;
	items:ItemType[];
};
export type BeforeAddItemEvent = AddRemoveItemEvent & {eventId:'beforeAddItem';};
export type AfterAddItemEvent = AddRemoveItemEvent & {eventId:'afterAddItem';};
export type BeforeRemoveItemEvent = AddRemoveItemEvent & {eventId:'beforeRemoveItem';};
export type AfterRemoveItemEvent = AddRemoveItemEvent & {eventId:'afterRemoveItem';};
export type OnMoveItemEvent<ItemType extends TrackListItem = TrackListItem> = TrackListEvent & {
	eventId:'onMoveItem';
	fromIndex:number;
	index:number;
	item:ItemType;
};
type ItemClassConstructor = new (...args: any[]) => TrackListItem;

// Class

// The following code creates a generic type restricted to any class or subclass instance of TrackListItem with a default value of TrackListItem.
// <ItemType extends TrackListItem = TrackListItem>
export default class TrackList extends EventManager {

	isSettingItems:boolean = false;
	#items:TrackListItem[] = [];
	itemClass:ItemClassConstructor;

	/**
	 * Constructs a track list.
	 * @param trackThings - A track or track list item.
	 * @param ItemClass - The class of the items.
	 */
	constructor(trackThings:TrackThing[], ItemClass?:ItemClassConstructor) {
		super();
		this.itemClass = ItemClass ?? TrackListItem;
		this.items = trackThings;
	}

	/**
	 * Gets the list of items.
	 * @returns The list of items.
	 */
	get items():TrackListItem[] {
		return this.#items;
	}

	/**
	 * Sets the list of items.
	 * @param trackThings - A list of tracks or track list items.
	 */
	set items(trackThings:TrackThing[]) {
		this.isSettingItems = true;
		const beforeEvent:BeforeSetItemsEvent = {
			eventId: 'beforeSetItems',
			eventSource: this,
			items: this.items,
		};
		this.dispatchEvent('beforeSetItems', [beforeEvent]);
		// Remove all items from the list in reverse order.
		// Reverse order is important to prevent repeated updating of the first item in the list. 
		for (let i = this.items.length - 1; i >= 0; i--) {
			this.removeItem(this.items[i]);
		}
		for (const trackThing of trackThings) {
			this.addItem(trackThing);
		}
		this.isSettingItems = false;
		const afterEvent:AfterSetItemsEvent = {
			eventId: 'afterSetItems',
			eventSource: this,
			items: this.items,
		};
		this.dispatchEvent('afterSetItems', [afterEvent]);
	}

	/**
	 * Creates a track list item and adds it to the list.
	 * @param trackThing - A track or track list item.
	 * @param index - Optionally set the index to insert the track. Defaults to the end of the list.
	 * @returns The track list item that was added to the track list.
	 * @throws An error when the index is invalid.
	 */
	addItem(trackThing:TrackThing, index:number = this.items.length):TrackListItem {
		if (!Number.isInteger(index) || index < 0 || index > this.items.length) {
			throw new Error(`'index' must be a positive integer less than or equal to the items length.`);
		}
		const trackListItem:TrackListItem = new this.itemClass(trackThing, this);
		const beforeEvent:BeforeAddItemEvent = {
			eventId: 'beforeAddItem',
			eventSource: this,
			index: index,
			item: trackListItem,
			items: this.items,
		};
		this.dispatchEvent('beforeAddItem', [beforeEvent]);
		this.items.splice(index, 0, trackListItem);
		const afterEvent:AfterAddItemEvent = {
			eventId: 'afterAddItem',
			eventSource: this,
			index: index,
			item: trackListItem,
			items: this.items,
		};
		this.dispatchEvent('afterAddItem', [afterEvent]);
		return trackListItem;
	}

	/**
	 * Removes an item from the track list.
	 * @param item - The item to remove.
	 * @returns The item that was removed or null if the item was not found in the list.
	 */
	removeItem(item:TrackListItem):TrackListItem | null {
		const index:number = this.items.indexOf(item);
		if (index < 0) {
			return null;
		}
		else {
			const beforeEvent:BeforeRemoveItemEvent = {
				eventId: 'beforeRemoveItem',
				eventSource: this,
				index: index,
				item: item,
				items: this.items,
			};
			this.dispatchEvent('beforeRemoveItem', [beforeEvent]);
			this.items.splice(index, 1);
			const afterEvent:AfterRemoveItemEvent = {
				eventId: 'afterRemoveItem',
				eventSource: this,
				index: index,
				item: item,
				items: this.items,
			};
			this.dispatchEvent('afterRemoveItem', [afterEvent]);
			return item;
		}
	}

	/**
	 * Moves an item from one index to another.
	 * @param item - The item or item index to move.
	 * @param index - The index to move the item to.
	 * @returns The moved item or null if no item could be found.
	 */
	moveItem(item:TrackListItem | number, index:number):TrackListItem | null {
		let fromIndex;
		if (typeof item === 'number') {
			if (!Number.isInteger(item) || item < 0 || item > this.items.length) {
				throw new Error(`'item' number must be a positive integer less than or equal to the items length.`);
			}
			fromIndex = item;
			item = this.items[item];
		}
		else {
			fromIndex = this.items.indexOf(item);
		}
		if (fromIndex < 0) {
			return null;
		}
		if (!Number.isInteger(index) || index < 0 || index > this.items.length) {
			throw new Error(`'index' must be a positive integer less than or equal to the items length.`);
		}
		this.items.splice(fromIndex, 1);
		this.items.splice(index, 0, item);
		const onMoveEvent:OnMoveItemEvent = {
			eventId: 'onMoveItem',
			eventSource: this,
			fromIndex: fromIndex,
			index: index,
			item: item,
		};
		this.dispatchEvent('onMoveItem', [onMoveEvent]);
		return item;
	}

	/**
	 * Gets an item by list id.
	 * @param listId - The list id to search for.
	 * @returns The found list item or undefined if no matching item was found.
	 */
	getItemByListId(listId:string):TrackListItem | undefined {
		return this.items.find((item) => item?.listId == listId);
	};

	/**
	 * Generates a UUID while optionally avoiding collisions.
	 * @param getExisting - An optional function that returns a truthy value if a passed id is in use.
	 * @param _count - A parameter to hold the attempt count. For internal recursive use only.
	 * @returns An id.
	 * @throws An error when an improbable number of collisions occur.
	 */
	generateUUID(_count:number = 0):string {
		_count++;
		if (_count > 10) {
			throw new Error('Too many collisions when attempting to generate uuid.');
		}
		const uuid:string = crypto.randomUUID();
		if (this.getItemByListId(uuid)) {
			return this.generateUUID(_count);
		}
		else {
			return uuid;
		}
	}

};