import type TrackListItem from '@controller-classes/TrackListItem';
import type QueueItem from '@controller-classes/QueueItem';
import {useContext} from 'react';
import {ControllerAppContext, AuthenticationStatusContext} from '@components/App/AppContexts';
import TrackImage from '@components/TrackImage/TrackImage';
import './Library.scss';

const trackImageSources = [{width: 64}];

export default function Library() {

	const {value: controllerApp} = useContext(ControllerAppContext);
	const {value: authenticationStatus} = useContext(AuthenticationStatusContext);

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
		return <li className='library__item' key={libraryItem.listId} data-list-id={libraryItem.listId}>
			<div className='library__item-image-area'>
				<TrackImage
					pictureClass='library__item-image'
					track={libraryItem.track}
					alt={libraryItem.track.tags.title}
					sources={trackImageSources}
				/>
				<button className='library__item-play' onClick={libraryItemPlayClickHandler}><span>▶</span></button>
			</div>
			<span className='library__item-title'>{libraryItem.track.tags.title}</span>
			<div className='library__item-additional-actions'>
				<button className='library__item-play-next' onClick={libraryItemPlayNextClickHandler}>play next</button>
				<button className='library__item-add-to-queue' onClick={addToQueueClickHandler}>add to queue</button>
			</div>
		</li>
	});

	return (
		<div className='library'>
			{authenticationStatus ? <ul className='library__items'>{libraryItems}</ul> : null}
		</div>
	);

};