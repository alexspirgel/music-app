import type TrackListItem from '@controller-classes/TrackListItem';
import type QueueItem from '@controller-classes/QueueItem';
import {useContext} from 'react';
import {ControllerAppContext} from '@components/App/AppContexts';
import './Library.scss';

export default function Library() {

	const {value: controllerApp} = useContext(ControllerAppContext);

	const getItemListIdFromEvent = (event:any):string => {
		return event.target.closest('li').getAttribute('data-list-id');
	};

	const getItemFromEvent = (event:any):TrackListItem | undefined => {
		const listId = getItemListIdFromEvent(event);
		if (listId) {
			return controllerApp.library.trackList.getItemByListId(listId);
		}
	}; 

	const libraryItemPlayClickHandler = (event:any) => {
		const originListId:string = getItemListIdFromEvent(event);
		controllerApp.player.queue.items = controllerApp.library.trackList.items;
		const item:QueueItem | undefined = controllerApp.player.queue.getItemByOriginListId(originListId);
		if (item) {
			if (controllerApp.player.queue.shuffled) {
				controllerApp.player.queue.moveItem(item, 0);
			}
			controllerApp.player.activeTrack = item;
		}
		controllerApp.player.play();
	};

	const libraryItemPlayNextClickHandler = (event:any) => {
		const libraryItem = getItemFromEvent(event);
		if (libraryItem) {
			controllerApp.player.queue.addItemAfterItem(libraryItem, controllerApp.player.activeTrack);
		}
	};

	const addToQueueClickHandler = (event:any) => {
		const libraryItem = getItemFromEvent(event);
		if (libraryItem) {
			controllerApp.player.queue.addItem(libraryItem);
		}
	};

	const libraryItems = controllerApp.library.trackList.items.map((libraryItem:TrackListItem) => {
		return <li key={libraryItem.listId} data-list-id={libraryItem.listId}>
			<button onClick={libraryItemPlayClickHandler}>▶</button>
			<span>{libraryItem.track.tags.title}</span>
			<button onClick={libraryItemPlayNextClickHandler}>play next</button>
			<button onClick={addToQueueClickHandler}>add to queue</button>
		</li>
	});

	return (
		<div className='library'>
			<ul className='library__items'>{libraryItems}</ul>
		</div>
	);

};