import type * as EventManagerTypes from '@controller-classes/EventManager';
import type * as TrackListTypes from '@controller-classes/TrackList';
import type TrackListType from '@controller-classes/TrackList';
import * as apiHelpers from '@controller/utilities/apiHelpers';
import TrackListItem from '@controller-classes/TrackListItem';
import {Howl} from 'howler';

// Types

type QueueItemEvent = EventManagerTypes.EventBase & {
	eventSource:QueueItem;
};
export type OnPlayingChangeEvent = QueueItemEvent & {
	eventId:'onPlayingChange';
	playing:boolean;
};
export type OnLoadingChangeEvent = QueueItemEvent & {
	eventId:'onLoadingChange';
	loading:boolean;
};
type QueueItemSoundEvent = QueueItemEvent & {
	sound?:Howl;
};
export type OnEndEvent = QueueItemSoundEvent & {eventId:'onEnd';};

// Class

export default class QueueItem extends TrackListItem {

	soundHTML5?:Howl;
	soundInitializing:boolean
	#playing:boolean = false;
	#originListId?:string;
	updateSoundTimeout?:number;
	#loading:boolean = false;

	/**
	 * Constructs a queue item.
	 * @param trackThing - A track or track list item.
	 * @param parentList - A reference to the parent list.
	 */
	constructor(trackThing:TrackListTypes.TrackThing, parentList:TrackListType) {
		super(trackThing, parentList);
		this.soundInitializing = false;
	}

	/**
	 * Gets the origin list id if one exists.
	 * @returns The origin list id.
	 */
	get originListId():string | undefined {
		return this.#originListId;
	}

	/**
	 * Sets the origin list id. Cannot be changed once set.
	 * @param value - The value to set.
	 */
	set originListId(value:string) {
		if (typeof this.#originListId === 'undefined') {
			this.#originListId = value;
		}
	}

	/**
	 * Gets the selected sound. Select a sound if there is no existing selected sound.
	 * @returns A selected sound if one is available.
	 */
	get sound():Howl | undefined {
		return this.soundHTML5;
	}

	createSound = async () => {
		this.loading = true;
		const apiData = await apiHelpers.getTrackAPIData(this.track);
		// console.log(apiData);
		const createdSound = new Howl({
			src: [apiData.url],
			html5: true,
			preload: true,
		});
		// console.log(createdSound);
		createdSound.on('end', () => {
			this.soundOnEndHandler(createdSound);
		});
		createdSound.on('load', () => {
			this.loading = false;
			// console.log('sound loaded');
			// console.log('is playing', this.playing);
			if (this.sound === createdSound && this.playing) {
				createdSound.play();
			}
		});
		createdSound.on('loaderror', (_unusedId, error) => {
			console.error('loaderror', createdSound, error);
			this.updateSound();
		});
		createdSound.on('playerror', (_unusedId, error) => {
			console.error('playerror', createdSound, error);
			this.updateSound();
		});
		return {
			sound: createdSound,
			expiresIn: apiData.expires_in * 1000,
		};
	};

	/**
	 * Initializes web audio and HTML5 sounds.
	 */
	initializeSound = async ():Promise<void> => {
		if (!this.soundHTML5 && !this.soundInitializing) {
			this.soundInitializing = true;
			const createdSound = await this.createSound();
			this.soundHTML5 = createdSound.sound;
			clearTimeout(this.updateSoundTimeout);
			this.updateSoundTimeout = setTimeout(this.updateSound, createdSound.expiresIn);
			this.soundInitializing = false;
		}
	}

	updateSound = async ():Promise<void> => {
		const oldSound = this.soundHTML5;
		const oldSeek = oldSound?.seek() || 0;
		const createdSound = await this.createSound();
		createdSound.sound.seek(oldSeek);
		this.soundHTML5 = createdSound.sound;
		clearTimeout(this.updateSoundTimeout);
		this.updateSoundTimeout = setTimeout(this.updateSound, createdSound.expiresIn);
		oldSound?.stop();
		oldSound?.unload();
	}

	get loading():boolean {
		return this.#loading;
	}

	set loading (value:boolean) {
		if (value !== this.loading) {
			this.#loading = value;
			const onLoadingChangeEvent:OnLoadingChangeEvent = {
				eventId: 'onLoadingChange',
				eventSource: this,
				loading: value,
			};
			this.dispatchEvent('onLoadingChange', [onLoadingChangeEvent]);
		}
	}

	/**
	 * Destroys web audio and HTML5 sounds.
	 */
	destroySound():void {
		this.stop();
		this.soundHTML5?.unload();
		this.soundHTML5 = undefined;
	}

	/**
	 * Gets the duration in milliseconds from a given percent.
	 * Doesn't rely on a selected sound because the duration is available without selecting a sound.
	 * @param percent - A percent represented as a decimal between and including 0 and 1.
	 * @returns The duration in milliseconds that equals the input percent.
	 */
	getDurationFromPercent(percent:number):number {
		percent = Math.min(Math.max(percent, 0), 1);
		return Math.round(this.track.duration * percent);
	}

	/**
	 * Gets the selected sound current seek percentage.
	 * Relies on a selected sound.
	 * @returns The current seek percent (represented as a decimal between and including 0 and 1) or undefined if there is no selected sound.
	 */
	getSeekPercent():number | undefined {
		if (this.soundHTML5) {
			const seekMilliseconds:number = this.seek() || 0;
			const percent:number = seekMilliseconds / this.track.duration;
			return Math.min(Math.max(percent, 0), 1);
		}
	}

	/**
	 * Gets or sets the seek if a duration is passed.
	 * @param duration - Optionally set the seek duration in milliseconds.
	 * @returns The current seek in milliseconds or undefined if no sound is selected.
	 */
	seek(duration?:number):number | undefined {
		if (this.soundHTML5) {
			const currentDurationMilliseconds:number = this.soundHTML5.seek() * 1000;
			if (typeof duration === 'number') {
				const durationSeconds = duration / 1000;
				this.soundHTML5.seek(durationSeconds);
			}
			return currentDurationMilliseconds;
		}
	}

	/**
	 * Sets the selected sound seek by percent.
	 * Relies on a selected sound.
	 * @param percent - A percent represented as a decimal between and including 0 and 1.
	 * @returns The duration in milliseconds the seek was set to or undefined if there is no selected sound.
	 */
	setSeekPercent(percent:number):number | undefined {
		if (this.soundHTML5) {
			percent = Math.min(Math.max(percent, 0), 1);
			const durationMilliseconds:number = this.getDurationFromPercent(percent);
			this.seek(durationMilliseconds);
			return durationMilliseconds;
		}
	}

	/**
	 * Gets the playing status.
	 * Because the `sound.playing()` method is asynchronous, this independent property is separately managed and synchronously represents the attempt to play as playing.
	 * @returns The playing status.
	 */
	get playing():boolean {
		return this.#playing;
	}

	/**
	 * Sets the playing status.
	 */
	set playing(value:boolean) {
		if (value !== this.#playing) {
			this.#playing = value;
			const onPlayingChangeEvent:OnPlayingChangeEvent = {
				eventId: 'onPlayingChange',
				eventSource: this,
				playing: value,
			};
			this.dispatchEvent('onPlayingChange', [onPlayingChangeEvent]);
		}
	}

	/**
	 * Plays the sound.
	 */
	play = () => {
		this.playing = true;
		if (this.sound) {
			this.sound.play();
		}
	};

	/**
	 * Pauses the sound.
	 */
	pause = () => {
		this.playing = false;
		this.soundHTML5?.pause();
	};

	/**
	 * Stops both sounds.
	 */
	stop = () => {
		this.soundHTML5?.stop();
		this.playing = false;
	};

	/**
	 * Handles on end events from sounds.
	 * @param sound - The sound that triggered the handler.
	 */
	soundOnEndHandler = (sound?:Howl):void => {
		if (sound === this.sound) {
			this.stop();
			const onEndEvent:OnEndEvent = {
				eventId: 'onEnd',
				eventSource: this,
				sound: sound,
			};
			this.dispatchEvent('onEnd', [onEndEvent]);
		}
	};

};