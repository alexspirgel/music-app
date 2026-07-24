import type * as trackTypes from '@controller-types/track';
import type * as TrackListTypes from '@controller-classes/TrackList';
import type TrackListType from '@controller-classes/TrackList';
import EventManager from '@controller-classes/EventManager';

export default class TrackListItem extends EventManager {

	#track:trackTypes.Track;
	#listId:string;

	/**
	 * Constructs a track list item.
	 * @param trackThing - A track or track list item.
	 * @param parentList - A reference to the parent list.
	 */
	constructor(trackThing:TrackListTypes.TrackThing, parentList:TrackListType) {
		super();
		this.#track = (trackThing instanceof TrackListItem) ? trackThing.track : trackThing;
		this.#listId = parentList.generateUUID();
	}

	/**
	 * Gets the track.
	 * @returns The track.
	 */
	get track():trackTypes.Track {
		return this.#track;
	}

	/**
	 * Gets the list id.
	 * @returns The list id.
	 */
	get listId():string {
		return this.#listId;
	}

};