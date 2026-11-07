import type AppType from '@controller-classes/App';
import type * as EventManagerTypes from '@controller-classes/EventManager';
import type * as QueueItemTypes from '@controller-classes/QueueItem';
import type * as TrackListTypes from '@controller-classes/TrackList';
// import type * as QueueTypes from '@controller-classes/Queue';
import {extendOptions, hasMediaSessionSupport} from '@controller/utilities/utilities';
import Queue from '@controller-classes/Queue';
import QueueItem from '@controller-classes/QueueItem';
import EventManager from '@controller-classes/EventManager';
import {Howler} from 'howler';

// Types

type PlayerEvent = EventManagerTypes.EventBase & {
	eventSource:Player;
};
export type OnSetActiveTrackEvent = PlayerEvent & {
	eventId:'onSetActiveTrack';
	oldValue:QueueItem | undefined;
	newValue:QueueItem | undefined;
};
export type OnPlayingChangeEvent = PlayerEvent & {
	eventId:'onPlayingChange';
	playing:boolean;
}
export type OnPlayEvent = PlayerEvent & {
	eventId:'onPlay';
	activeTrack:QueueItem;
};
export type OnVolumeChangeEvent = PlayerEvent & {
	eventId:'onVolumeChange';
	previousValue:number;
	value:number;
};
type SkipOptions = {
	forcePlay?:boolean;
};
export type RepeatState = 'off' | 'all' | 'one';
export type OnRepeatStateChangeEvent = PlayerEvent & {
	eventId:'onRepeatChange';
	previousValue:RepeatState;
	value:RepeatState;
};
export type OnShuffleChangeEvent = PlayerEvent & {
	eventId:'onShuffleChange';
	value:boolean;
};

// Class

export default class Player extends EventManager {

	static #skipOptionsDefault:SkipOptions = {
		forcePlay: false,
	};

	#playing:boolean = false;
	app:AppType;
	#queue?:Queue;
	#activeTrack:QueueItem | undefined;
	premutedVolume:number | undefined;
	#repeat:RepeatState = 'off';
	#shuffled:boolean = false;

	/**
	 * Constructs a player.
	 * @param app - A reference to the parent app.
	 */
	constructor(app:AppType) {
		super();
		this.app = app;
		this.queue = new Queue([], this);
		if (hasMediaSessionSupport('play')) {
			window.navigator.mediaSession.setActionHandler('play', this.play);
		}
		if (hasMediaSessionSupport('pause')) {
			window.navigator.mediaSession.setActionHandler('pause', this.pause);
		}
		if (hasMediaSessionSupport('stop')) {
			window.navigator.mediaSession.setActionHandler('stop', this.stop);
		}
		if (hasMediaSessionSupport('previoustrack')) {
			window.navigator.mediaSession.setActionHandler('previoustrack', () => {
				this.skip('previous');
			});
		}
		if (hasMediaSessionSupport('nexttrack')) {
			window.navigator.mediaSession.setActionHandler('nexttrack', () => {
				this.skip('next');
			});
		}
	}

	/**
	 * Gets the queue.
	 * @returns The queue.
	 */
	get queue():Queue {
		return this.#queue as Queue;
	}

	/**
	 * Sets the queue.
	 * @param queue - The queue to set.
	 */
	set queue(queue:Queue) {
		this.#queue = queue;
		this.queue.addEventListener('beforeRemoveItem', (event:TrackListTypes.BeforeRemoveItemEvent) => {
			// If the active track would be removed from the queue.
			if (this.activeTrack && event.item === this.activeTrack) {
				this.skip('next');
			}
		});
		this.queue.addEventListener('onShuffle', (/*event:QueueTypes.OnShuffleEvent*/) => {
			this.shuffled = this.queue.shuffled;
		});
		this.queue.addEventListener('onUnshuffle', (/*event:QueueTypes.OnUnshuffleEvent*/) => {
			this.shuffled = this.queue.shuffled;
		});
		this.queue.addEventListener('afterSetItems', (/*event:TrackListTypes.AfterSetItemsEvent*/) => {
			this.preloadQueueItems();
		});
		this.queue.addEventListener('afterAddItem', (/*event:TrackListTypes.AfterAddItemEvent*/) => {
			if (!this.queue.isSettingItems) {
				this.preloadQueueItems();
			}
		});
		this.queue.addEventListener('afterRemoveItem', (/*event:TrackListTypes.AfterRemoveItemEvent*/) => {
			if (!this.queue.isSettingItems) {
				this.preloadQueueItems();
			}
		});
		this.queue.addEventListener('onMoveItem', (/*event:TrackListTypes.OnMoveItemEvent*/) => {
			this.preloadQueueItems();
		});
		this.shuffled = this.queue.shuffled;
	}

	/**
	 * Gets the active track.
	 * @returns The active track.
	 */
	get activeTrack():QueueItem | undefined {
		return this.#activeTrack;
	}

	/**
	 * Sets the active track.
	 * @param newActiveTrack - The track list item or undefined to set as the active track.
	 */
	set activeTrack(newActiveTrack:QueueItem | undefined) {

		const oldActiveTrack:QueueItem | undefined = this.#activeTrack;
	
		if (newActiveTrack) {
			newActiveTrack.initializeSound();
			newActiveTrack.stop();
			newActiveTrack.addEventListener('onEnd', this.activeTrackOnEndHandler, {prepend: true});
		}
		Howler.stop();
		this.#activeTrack = newActiveTrack;
		if (oldActiveTrack) {
			oldActiveTrack.removeEventListener('onEnd', this.activeTrackOnEndHandler, {prepend: true});
		}
		for (const item of this.queue.items) {
			if (item !== newActiveTrack) {
				item.stop();
			}
		}
		if (!newActiveTrack) {
			this.playing = false;
			if (hasMediaSessionSupport('playbackState')) {
				navigator.mediaSession.playbackState = 'none';
			}
		}
		this.preloadQueueItems();

		if (hasMediaSessionSupport('metadata')) {
			if (newActiveTrack) {
				const mediaMetadata = new MediaMetadata({});
				if (hasMediaSessionSupport('title') && newActiveTrack.track.tags.title) {
					mediaMetadata.title = newActiveTrack.track.tags.title;
				}
				if (hasMediaSessionSupport('artist') && newActiveTrack.track.tags.artists && newActiveTrack.track.tags.artists.length > 0) {
					mediaMetadata.artist = newActiveTrack.track.tags.artists?.join(', ');
				}
				if (hasMediaSessionSupport('album') && newActiveTrack.track.tags.album) {
					mediaMetadata.album = newActiveTrack.track.tags.album;
				}
				if (hasMediaSessionSupport('artwork') && newActiveTrack.track.tags.image && newActiveTrack.track.tags.image['500']) {
					mediaMetadata.artwork = [{src:newActiveTrack.track.tags.image['500']}];
				}
				navigator.mediaSession.metadata = mediaMetadata;
			}
			else {
				navigator.mediaSession.metadata = null;
			}
		}
		const onSetActiveTrackEvent:OnSetActiveTrackEvent = {
			eventId: 'onSetActiveTrack',
			eventSource: this,
			oldValue: oldActiveTrack,
			newValue: newActiveTrack,
		};
		this.dispatchEvent('onSetActiveTrack', [onSetActiveTrackEvent]);

	}

	/**
	 * Handles active track on end events.
	 * @param event - The onEnd event.
	 */
	activeTrackOnEndHandler = (event:QueueItemTypes.OnEndEvent):void => {
		if (event.eventSource === this.activeTrack) {
			if (this.activeTrack && this.repeat === 'one') {
				this.activeTrack.stop();
				this.activeTrack.play();
			}
			else if (this.activeTrack === this.queue.items.at(-1) && this.repeat === 'all') {
				if (this.shuffled) {
					this.queue.shuffleItems();
				}
				this.skipTo(0);
			}
			else {
				this.skip('next', {forcePlay: true});
			}
		}
	};
	
	/**
	 * Gets the current player playing status.
	 * @returns True or false based on the playing status.
	 */
	get playing():boolean {
		return this.#playing;
	}

	/**
	 * Sets the current player playing status.
	 */
	set playing(value:boolean) {
		if (value !== this.#playing) {
			this.#playing = value;
			if (hasMediaSessionSupport('playbackState')) {
				navigator.mediaSession.playbackState = value ? 'playing' : 'paused';
			}
			const onPlayingChangeEvent:OnPlayingChangeEvent = {
				eventId: 'onPlayingChange',
				eventSource: this,
				playing: value,
			};
			this.dispatchEvent('onPlayingChange', [onPlayingChangeEvent]);
		}
	}

	/**
	 * Preload and unload queue items.
	 * @returns An array of items that have been set to preload.
	 */
	preloadQueueItems():QueueItem[] {
		const activeTrackQueueIndex:number = this.queue.items.indexOf(this.activeTrack as any);
		const preloadQueueIndexes:number[] = [
			activeTrackQueueIndex - 1, // preload the previous track relative to the active track
			activeTrackQueueIndex, // preload the active track
			activeTrackQueueIndex + 1, // preload the next item relative to the active track
			0, // always preload the first item in the queue, regardless of active track position
		];
		const preloadedQueueItems:QueueItem[] = [];
		for (let i = 0; i < this.queue.items.length; i++) {
			const item:QueueItem = this.queue.items[i];
			if (item && preloadQueueIndexes.includes(i)) {
				item.initializeSound();
				preloadedQueueItems.push(item);
			}
			else {
				item.destroySound();
			}
		}
		// console.log('preloadedQueueItems', preloadedQueueItems);
		return preloadedQueueItems;
	}

	/**
	 * Plays the active track. If the active track is undefined, sets the first queue item as the active track.
	 */
	play = ():void => {
		if (!this.activeTrack && this.queue.items.length > 0) {
			this.activeTrack = this.queue.items[0];
		}
		if (this.activeTrack && !this.activeTrack.playing) {
			this.activeTrack.play();
		}
		if (!this.playing && this.activeTrack) {
			this.playing = true;
			const onPlayEvent:OnPlayEvent = {
				eventId: 'onPlay',
				eventSource: this,
				activeTrack: this.activeTrack,
			};
			this.dispatchEvent('onPlay', [onPlayEvent]);
		}
	};

	/**
	 * Pauses the active track.
	 */
	pause = ():void => {
		this.activeTrack?.pause();
		this.playing = false;
	};

	/**
	 * Toggles between play and pause.
	 */
	playPauseToggle = ():void => {
		if (this.playing) {
			this.pause();
		}
		else {
			this.play();
		}
	};

	/**
	 * Stops the active track and empties the queue.
	 */
	stop = ():void => {
		this.activeTrack?.stop();
		this.queue.items = [];
		this.playing = false;
	}

	/**
	 * Skips the active track forwards or backwards in the queue by one index.
	 * @param direction - The direction to skip.
	 * @param options - Optional settings.
	 */
	skip(direction:'previous' | 'next' = 'next', options:SkipOptions = {}):void {
		let activeTrackQueueIndex:number | null = null;
		if (this.activeTrack) {
			activeTrackQueueIndex = this.queue.items.indexOf(this.activeTrack);
		}
		if (typeof activeTrackQueueIndex === 'number'
		&& activeTrackQueueIndex >= 0
		&& activeTrackQueueIndex < this.queue.items.length) {
			let newIndex:number = -1;
			if (direction == 'previous') {
				newIndex = activeTrackQueueIndex - 1;
			}
			else { // direction == 'next'
				newIndex = activeTrackQueueIndex + 1;
			}
			if (direction === 'previous' && this.repeat === 'all' && newIndex < 0) {
				newIndex = this.queue.items.length - 1;
			}
			if (direction === 'next' && this.repeat === 'all' && newIndex >= this.queue.items.length) {
				if (this.shuffled) {
					this.queue.shuffleItems();
				}
				newIndex = 0;
			}
			this.skipTo(newIndex, options);
		}
	}

	/**
	 * Skips the active track to a specific queue item or index.
	 * @param targetQueueItem - A direct reference or index of a track list item.
	 * @param options - Optional settings.
	 */
	skipTo(targetQueueItem:QueueItem | number, options:SkipOptions = {}):void {
		options = extendOptions({}, (this.constructor as typeof Player).#skipOptionsDefault, options);
		if (typeof targetQueueItem === 'number') {
			targetQueueItem = this.queue.items[targetQueueItem];
		}
		const wasPlaying:boolean = this.playing;
		this.activeTrack = targetQueueItem;
		if (targetQueueItem && (wasPlaying || options.forcePlay)) {
			this.play();
		}
	}

	/**
	 * Gets the volume value.
	 * @returns The volume value represented as a number between and including 0 and 1.
	 */
	get volume():number {
		return Howler.volume();
	}

	/**
	 * Sets the volume.
	 * @param value - The value to set the volume to represented as a number between and including 0 and 1.
	 */
	set volume(value:number) {
		if (value < 0 || value > 1) {
			throw new RangeError(`'volume' value of ${value} falls outside required range of 0 to 1`);
		}
		const previousValue:number = this.volume;
		if (value !== previousValue) {
			Howler.volume(value);
			if (value > 0) {
				this.premutedVolume = undefined;
			}
			const onVolumeChangeEvent:OnVolumeChangeEvent = {
				eventId: 'onVolumeChange',
				eventSource: this,
				previousValue: previousValue,
				value: value,
			};
			this.dispatchEvent('onVolumeChange', [onVolumeChangeEvent]);
		}
	}

	/**
	 * Checks if the player is muted.
	 * @returns True or false based on the current volume level.
	 */
	get isMuted():boolean {
		if (this.volume > 0) {
			return false;
		}
		return true;
	}

	/**
	 * Set the player volume to zero. Save the premuted volume level.
	 */
	mute():void {
		if (!this.isMuted) {
			this.premutedVolume = this.volume;
			this.volume = 0;
		}
	}

	/**
	 * Sets the player volume to the custom or premuted value. If no custom or premuted value are found, use a default value of 0.5.
	 * @param value - Optionally override the saved premuted value.
	 */
	unmute(value?:number):void {
		if (this.isMuted) {
			this.volume = value ?? this.premutedVolume ?? 0.5;
		}
	}

	/**
	 * Toggle the player between muted and unmuted.
	 */
	toggleMute():void {
		if (this.isMuted) {
			this.unmute();
		}
		else {
			this.mute();
		}
	}

	/**
	 * Gets the shuffled status.
	 * @returns The shuffled status.
	 */
	get shuffled():boolean {
		return this.#shuffled;
	}

	/**
	 * Sets the shuffled status.
	 * @param value - The shuffled value.
	 */
	set shuffled(value:boolean) {
		if (value !== this.shuffled) {
			this.#shuffled = value;
			const onShuffleChangeEvent:OnShuffleChangeEvent = {
				eventId: 'onShuffleChange',
				eventSource: this,
				value: value,
			};
			this.dispatchEvent('onShuffleChange', [onShuffleChangeEvent]);
		}
	}

	/**
	 * Toggle between shuffled and unshuffled.
	 */
	toggleShuffle = ():void => {
		if (this.shuffled) {
			this.queue.shuffled = false;
		}
		else {
			this.queue.shuffled = true;
		}
	}

	/**
	 * Gets the repeat value.
	 * @returns The current repeat value.
	 */
	get repeat():RepeatState {
		return this.#repeat;
	}

	/**
	 * Sets the repeat value.
	 * @param value - The value to set.
	 */
	set repeat(value:RepeatState) {
		if (value !== this.#repeat) {
			const previousValue = this.#repeat;
			this.#repeat = value;
			const onRepeatStateChangeEvent:OnRepeatStateChangeEvent = {
				eventId: 'onRepeatChange',
				eventSource: this,
				previousValue: previousValue,
				value: value,
			};
			this.dispatchEvent('onRepeatChange', [onRepeatStateChangeEvent]);
		}
	}

	/**
	 * Toggle the repeat value.
	 */
	repeatToggle = ():void => {
		if (this.repeat === 'off') {
			this.repeat = 'all';
		}
		else if (this.repeat === 'all') {
			this.repeat = 'one';
		}
		else {
			this.repeat = 'off';
		}
	};

};