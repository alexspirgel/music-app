import type * as EventManagerTypes from '@controller-classes/EventManager';
import type * as TrackListTypes from '@controller-classes/TrackList';
import type TrackListType from '@controller-classes/TrackList';
import TrackListItem from '@controller-classes/TrackListItem';
import {Howl} from 'howler';

// Types

type QueueItemEvent = EventManagerTypes.EventBase & {
	eventSource:QueueItem;
};
export type OnPlayingChangeEvent = QueueItemEvent & {
	eventId:'onPlayingChange';
	playing:boolean;
}
type QueueItemSoundEvent = QueueItemEvent & {
	sound?:Howl;
};
export type OnEndEvent = QueueItemSoundEvent & {eventId:'onEnd';};

// Class

export default class QueueItem extends TrackListItem {

	soundHTML5?:Howl;
	selectedSound?:Howl;
	#playing:boolean = false;
	#originListId?:string;

	/**
	 * Constructs a queue item.
	 * @param trackThing - A track or track list item.
	 * @param parentList - A reference to the parent list.
	 */
	constructor(trackThing:TrackListTypes.TrackThing, parentList:TrackListType) {
		super(trackThing, parentList);
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
		return this.selectSound();
	}

	/**
	 * Select a sound based on load state. Prefer web audio.
	 * @returns A Howl sound if one is available.
	 */
	selectSound():Howl | undefined {
		if (!this.selectedSound) {
			if (this.soundHTML5) {
				this.selectedSound = this.soundHTML5;
			}
			else {
				this.selectedSound = undefined;
			}
		}
		return this.selectedSound;
	}

	/**
	 * Initializes web audio and HTML5 sounds.
	 */
	initializeSound():void {
		if (!this.soundHTML5) {
			this.soundHTML5 = new Howl({
				src: [this.track.fileUrl],
				html5: true,
				preload: 'metadata',
				onend: () => this.soundOnEndHandler(this.soundHTML5),
				onloaderror: (_unusedId, error) => {
					console.error('onloaderror', this.soundHTML5, error);
				},
				onplayerror : (_unusedId, error) => {
					console.error('onplayerror', this.soundHTML5, error);
				},
			});
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
		if (this.selectedSound) {
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
		if (this.selectedSound) {
			const currentDurationMilliseconds:number = this.selectedSound.seek() * 1000;
			if (typeof duration === 'number') {
				const durationSeconds = duration / 1000;
				this.selectedSound.seek(durationSeconds);
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
		if (this.selectedSound) {
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
		if (this.sound) {
			this.sound.play();
			this.playing = true;
		}
	};

	/**
	 * Pauses the sound.
	 */
	pause = () => {
		this.selectedSound?.pause();
		this.playing = false;
	};

	/**
	 * Stops both sounds.
	 */
	stop = () => {
		this.soundHTML5?.stop();
		this.playing = false;
		this.selectedSound = undefined;
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