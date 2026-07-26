import CombineContextProviders from '@components/CombineContextProviders/CombineContextProviders';
import {ControllerAppContextProvider, QueueSidebarOpenContextProvider, AuthenticationStatusProvider} from '@components/App/AppContexts';
import Authentication from '@components/Authentication/Authentication';
import Library from '@components/Library/Library';
import QueueSidebar from '@components/QueueSidebar/QueueSidebar';
import Player from '@components/Player/Player';
import './App.scss';

export default function App() {

	return (
		<CombineContextProviders contextProviders={[ControllerAppContextProvider, QueueSidebarOpenContextProvider, AuthenticationStatusProvider]}>
			<div className='app'>
				<Authentication />
				<main className='app__main'>
					<Library />
					<QueueSidebar />
				</main>
				<Player />
			</div>
		</CombineContextProviders>
	);

};