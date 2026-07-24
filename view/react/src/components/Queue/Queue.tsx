import type QueueItemType from '@controller-classes/QueueItem';
import {ControllerAppContext} from '@components/App/AppContexts';
import {useContext, useState, useEffect} from 'react';
import QueueItem from '@components/QueueItem/QueueItem';
import {Reorder} from 'motion/react';
import './Queue.scss';

export default function Queue() {

	const {value: controllerApp} = useContext(ControllerAppContext);
	const [queueItems, setQueueItems] = useState<QueueItemType[]>(controllerApp.player.queue.items);
	const [activeReorderingItem, setActiveReorderingItem] = useState<QueueItemType | undefined>(undefined);

	useEffect(() => {
		controllerApp.player.queue.addEventListener('afterSetItems', updateQueueItems);
		controllerApp.player.queue.addEventListener('afterAddItem', controllerAfterAddRemoveItemHandler);
		controllerApp.player.queue.addEventListener('afterRemoveItem', controllerAfterAddRemoveItemHandler);
		controllerApp.player.queue.addEventListener('onMoveItem', updateQueueItems);
		controllerApp.player.queue.addEventListener('onShuffle', updateQueueItems);
		controllerApp.player.queue.addEventListener('onUnshuffle', updateQueueItems);
		return () => {
			controllerApp.player.queue.removeEventListener('afterSetItems', updateQueueItems);
			controllerApp.player.queue.removeEventListener('afterAddItem', controllerAfterAddRemoveItemHandler);
			controllerApp.player.queue.removeEventListener('afterRemoveItem', controllerAfterAddRemoveItemHandler);
			controllerApp.player.queue.removeEventListener('onMoveItem', updateQueueItems);
			controllerApp.player.queue.removeEventListener('onShuffle', updateQueueItems);
			controllerApp.player.queue.removeEventListener('onUnshuffle', updateQueueItems);
		}
	}, []);

	const controllerAfterAddRemoveItemHandler = () => {
		if (!controllerApp.player.queue.isSettingItems) {
			setQueueItems([...controllerApp.player.queue.items]);
		}
	};

	const updateQueueItems = () => {
		setQueueItems([...controllerApp.player.queue.items]);
	};

	const onReorderHandler = (items:QueueItemType[]) => {
		if (activeReorderingItem) {
			controllerApp.player.queue.moveItem(activeReorderingItem, items.indexOf(activeReorderingItem));
		}
	};

	return (
		<div className='queue'>
			<Reorder.Group className='queue__list' values={queueItems} as='ol' axis='y' onReorder={onReorderHandler}>
				{queueItems.map(item => (
					<QueueItem key={item.listId} queueItem={item} setActiveReorderingItem={setActiveReorderingItem} />
				))}
			</Reorder.Group>
		</div>
	);

};