import type * as EventManagerTypes from '@controller-classes/EventManager';
import type * as TrackListTypes from '@controller-classes/TrackList';
import type PlayerType from '@controller-classes/Player';
import {generateRandomInteger} from '@controller/utilities/utilities';
import TrackList from '@controller-classes/TrackList';
import QueueItem from '@controller-classes/QueueItem';
import TrackListItem from './TrackListItem';

// Types

type QueueEvent = EventManagerTypes.EventBase & {
	eventSource:Queue;
};
// Triggers every shuffle of the items.
export type OnShuffleEvent = QueueEvent & {eventId:'onShuffle';};
export type OnUnshuffleEvent = QueueEvent & {eventId:'onUnshuffle';};

// Class

export default class Queue extends TrackList {

	player:PlayerType;
	_shuffled:boolean = false;
	unshuffledItems:QueueItem[] = [];

	/**
	 * Constructs a queue.
	 * @param trackThings - A track or track list item.
	 * @param player - A reference to the parent player.
	 */
	constructor(trackThings:TrackListTypes.TrackThing[], player:PlayerType) {
		super(trackThings, QueueItem);
		this.player = player;
	}

	/**
	 * Types items as queue items.
	 * @inheritdoc
	 */
	get items():QueueItem[] {
		return super.items as QueueItem[];
	}

	/**
	 * Handles shuffle functionality.
	 * @inheritdoc
	 */
	set items(trackThings:TrackListTypes.TrackThing[]) {
		super.items = trackThings;
		this.unshuffledItems = [];
		if (this.shuffled) {
			this.unshuffledItems = [...this.items];
			this.shuffleItems(this.player.activeTrack);
		}
	}

	/**
	 * Gets an item by origin list id.
	 * @param originListId - The origin list id to search for.
	 * @returns The found list item or undefined if no matching item was found.
	 */
	getItemByOriginListId(originListId:string):QueueItem | undefined {
		return this.items.find((item) => item?.originListId == originListId);
	};

	/**
	 * Types the added item as a queue item.
	 * Adds the origin list id when one exists.
	 * Handles shuffle functionality.
	 * While shuffled, added items are placed at the end of the unshuffled items list regardless of specified index.
	 * @inheritdoc
	 */
	addItem(trackThing:TrackListTypes.TrackThing, index?:number):QueueItem {
		if (typeof index === 'undefined') {
			if (this.shuffled && !this.isSettingItems) {
				const activeTrackIndex:number = this.items.indexOf(this.player.activeTrack as QueueItem);
				index = generateRandomInteger((activeTrackIndex + 1), (this.items.length));
			}
			else {
				index = this.items.length;
			}
		}
		const newItem:QueueItem = super.addItem(trackThing, index) as QueueItem;
		if (trackThing instanceof TrackListItem) {
			newItem.originListId = trackThing.listId;
		}
		if (this.shuffled && !this.isSettingItems) {
			this.unshuffledItems.push(newItem);
		}
		return newItem;
	}

	/**
	 * Adds an item to the list after another item in the list.
	 * While shuffled, the unshuffled list will also add the item after the specified item.
	 * If the target item is not found, uses `addItem` method as a fallback.
	 * @param trackThings - A track or track list item.
	 * @param targetItem - The item to add the new item after. Optional.
	 * @returns The added item.
	 */
	addItemAfterItem(trackThing:TrackListTypes.TrackThing, targetItem?:QueueItem):QueueItem {
		const targetItemIndex:number = this.items.indexOf(targetItem as QueueItem);
		if (targetItemIndex < 0) {
			return this.addItem(trackThing);
		}
		const addedItem:QueueItem = super.addItem(trackThing, targetItemIndex + 1) as QueueItem;
		if (addedItem && this.shuffled) {
			let targetItemUnshuffledIndex:number = this.unshuffledItems.indexOf(targetItem as QueueItem);
			if (targetItemIndex < 0) {
				targetItemUnshuffledIndex = this.unshuffledItems.length - 1;
			}
			this.unshuffledItems.splice((targetItemUnshuffledIndex + 1), 0, addedItem);
		}
		return addedItem;
	}

	/**
	 * Types the removed item as a queue item.
	 * Handles shuffle functionality.
	 * @inheritdoc 
	 */
	removeItem(item:QueueItem):QueueItem | null {
		const removedItem = super.removeItem(item) as QueueItem | null;
		if (removedItem) {
			const removedItemUnshuffledIndex:number = this.unshuffledItems.indexOf(removedItem);
			if (removedItemUnshuffledIndex >= 0) {
				this.unshuffledItems.splice(removedItemUnshuffledIndex, 1);
			}
		}
		return removedItem;
	}

	/**
	 * Gets the shuffled status.
	 * @returns The shuffled status.
	 */
	get shuffled():boolean {
		return this._shuffled;
	}

	/**
	 * Sets the shuffled status.
	 * @param value - The shuffled value.
	 */
	set shuffled(value:boolean) {
		if (value === this.shuffled) {
			return;
		}
		else if (value === true) {
			this.unshuffledItems = [...this.items];
			this.shuffleItems(this.player.activeTrack);
		}
		else {
			const unshuffledMap = Object.fromEntries(this.unshuffledItems.map((item, index) => [item.listId, index]));
			this.items.sort((a, b) => {
				return (unshuffledMap[a.listId] ?? this.items.length) - (unshuffledMap[b.listId] ?? this.items.length)
			});
			this.unshuffledItems = [];
			this._shuffled = false;
			const onUnshuffleEvent:OnUnshuffleEvent = {
				eventId: 'onUnshuffle',
				eventSource: this,
			};
			this.dispatchEvent('onUnshuffle', [onUnshuffleEvent]);
		}
	}

	/**
	 * Randomize the order of items in place using the Fisher–Yates algorithm.
	 * @param startAfterItem - Optionally set the item or index to start the shuffle after. This item will not be included in the shuffle, only following items. Defaults to -1, which would shuffle the entire list.
	 */
	shuffleItems(startAfterItem:QueueItem | number = -1):void {
		if (startAfterItem && startAfterItem instanceof QueueItem) {
			startAfterItem = this.items.indexOf(startAfterItem);
		}
		for (let index = 0; index < this.items.length; index++) {
			const item:QueueItem = this.items[index];
			if (index > startAfterItem) {
				const minimumRemainingIndex:number = index;
				const maximumRemainingIndex:number = this.items.length - 1;
				const randomRemainingIndex:number = generateRandomInteger(minimumRemainingIndex, maximumRemainingIndex);
				const randomRemainingItem:QueueItem = this.items[randomRemainingIndex];
				this.items[index] = randomRemainingItem;
				this.items[randomRemainingIndex] = item;
			}
		}
		this._shuffled = true;
		const onShuffleEvent:OnShuffleEvent = {
			eventId: 'onShuffle',
			eventSource: this,
		};
		this.dispatchEvent('onShuffle', [onShuffleEvent]);
	}

};