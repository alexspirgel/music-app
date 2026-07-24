import CombineContextProviders from '@components/CombineContextProviders/CombineContextProviders';
import {ControllerAppContextProvider, QueueSidebarOpenContextProvider} from '@components/App/AppContexts';
import Library from '@components/Library/Library';
import QueueSidebar from '@components/QueueSidebar/QueueSidebar';
import Player from '@components/Player/Player';
import './App.scss';

export default function App() {
	return (
		<CombineContextProviders contextProviders={[ControllerAppContextProvider, QueueSidebarOpenContextProvider]}>
			<div className='app'>
				<main className='app__main'>
					<Library />
					<QueueSidebar />
				</main>
				<Player />
			</div>
		</CombineContextProviders>
	);
};