import type QueueItemType from '@controller-classes/QueueItem';
import {ControllerAppContext} from '@components/App/AppContexts';
import {useContext, useState, useEffect} from 'react';
import {Reorder} from "motion/react"
import TrackImage from '@components/TrackImage/TrackImage';
import './QueueItem.scss';

type QueueItemProperties = {
	queueItem:QueueItemType;
	setActiveReorderingItem:Function;
};

const queueItemTrackImageSources = [{width: 40}, {width: 400}];

export default function QueueItem({queueItem, setActiveReorderingItem}:QueueItemProperties) {

	// const controllerApp = useContext(controllerAppContext);
	const {value: controllerApp} = useContext(ControllerAppContext);
	const [isActiveTrack, setIsActiveTrack] = useState<boolean>(false);

	useEffect(() => {
		updateActiveTrackStatus();
		controllerApp.player.addEventListener('onSetActiveTrack', updateActiveTrackStatus);
		return () => {
			controllerApp.player.removeEventListener('onSetActiveTrack', updateActiveTrackStatus);
		}
	}, []);

	const queueItemRemoveClickHandler = () => {
		controllerApp.player.queue.removeItem(queueItem);
	};

	const queueItemPlayClickHandler = () => {
		controllerApp.player.activeTrack = queueItem;
		controllerApp.player.play();
	};

	const updateActiveTrackStatus = () => {
		if (controllerApp.player.activeTrack === queueItem) {
			setIsActiveTrack(true);
		}
		else {
			setIsActiveTrack(false);
		}
	};

	return (
		<Reorder.Item
			data-list-id={queueItem.listId}
			value={queueItem}
			as='li'
			className='queue-item'
			data-active={isActiveTrack}
			onDragStart={(event:PointerEvent) => {
				if (event.target instanceof HTMLElement) {
					event.target.setAttribute('data-is-dragging', '');
				}
				setActiveReorderingItem(queueItem);
			}}
			onDragEnd={(event) => {
				if (event.target instanceof HTMLElement) {
					event.target.removeAttribute('data-is-dragging');
				}
				setActiveReorderingItem(undefined);
			}}
		>
			<div className="queue-item__image">
				<div className='queue-item__playing-icon'>
					<div className='queue-item__playing-icon-bar-1'></div>
					<div className='queue-item__playing-icon-bar-2'></div>
					<div className='queue-item__playing-icon-bar-3'></div>
					<div className='queue-item__playing-icon-bar-4'></div>
				</div>
				<TrackImage
					pictureClass='queue-item__track-image'
					track={queueItem.track}
					alt={queueItem.track.tags.title}
					sources={queueItemTrackImageSources}
				/>
			</div>
			<span className='queue-item__track-title'>{queueItem.track.tags.title}</span>
			<div className='queue-item__actions'>
				<button className='queue-item__play-button' onClick={queueItemPlayClickHandler}>▶</button>
				<button className='queue-item__remove-button' onClick={queueItemRemoveClickHandler}>🞫</button>
			</div>
		</Reorder.Item>
	);

};