import type * as trackTypes from '@controller-types/track';
import type AppType from '@controller-classes/App';
import TrackList from '@controller-classes/TrackList';
import EventManager from '@controller-classes/EventManager';
import {getPropertyValueByPath} from '@controller/utilities/utilities';

type GroupedTracks = {
	[key:string]: trackTypes.Track[];
};

export default class Library extends EventManager {

	app:AppType;
	trackList:TrackList;

	constructor(app:AppType) {
		super();
		this.app = app;
		this.trackList = new TrackList(this.app.trackData);
	}

	groupTracksBy(groupPath:string[], tracks:trackTypes.Track[] = this.app.trackData):GroupedTracks {
		const groupedTracks:GroupedTracks = {};
		for (const track of tracks) {
			let groupIds = getPropertyValueByPath(track, groupPath);
			if (typeof groupIds === 'string' || typeof groupIds === 'number') {
				groupIds = [groupIds];
			}
			if (Array.isArray(groupIds)) {
				for (const groupId of groupIds) {
					if (typeof groupId === 'string' || typeof groupId === 'number') {
						if (!(groupId in groupedTracks)) {
							groupedTracks[groupId] = [];
						}
						groupedTracks[groupId].push(track);
					}
				}
			}
		}
		return groupedTracks;
	}

};

/*
Tracks
Artists
Albums
Genres
Playlists
*/