import Queue from '@components/Queue/Queue';
import {QueueSidebarOpenContext} from '@components/App/AppContexts';
import {useContext} from 'react';
import './QueueSidebar.scss';

export default function QueueSidebar() {

	const {value: queueSidebarOpen} = useContext(QueueSidebarOpenContext);

	return (
		<div className='queue-sidebar' data-open={queueSidebarOpen ? '' : null}>
			<Queue />
		</div>
	);

};