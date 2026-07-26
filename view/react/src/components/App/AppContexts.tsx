import type {ReactNode} from 'react';
import {createContext, useState} from 'react';
import ControllerApp from '@controller-classes/App';

type ControllerAppContextType = {
	value:ControllerApp;
};
const controllerApp = new ControllerApp();
export const ControllerAppContext = createContext<ControllerAppContextType>({value: controllerApp});
export const ControllerAppContextProvider = ({children}:{children:ReactNode}) => {
	return (
		<ControllerAppContext value={{
			value: controllerApp,
		}}>
			{children}
		</ControllerAppContext>
	);
};

type QueueSidebarOpenContextType = {
	value:boolean;
	setter:(value:boolean) => void;
};
export const QueueSidebarOpenContext = createContext<QueueSidebarOpenContextType>({value: false, setter: () => {}});
export const QueueSidebarOpenContextProvider = ({children}:{children:ReactNode}) => {
	const [queueSidebarOpen, setQueueSidebarOpen] = useState<boolean>(false);
	return (
		<QueueSidebarOpenContext value={{
			value: queueSidebarOpen,
			setter: setQueueSidebarOpen,
		}}>
			{children}
		</QueueSidebarOpenContext>
	);
};

type AuthenticationStatusContextType = {
	value:boolean;
	setter:(value:boolean) => void;
};
export const AuthenticationStatusContext = createContext<AuthenticationStatusContextType>({value: false, setter: () => {}});
export const AuthenticationStatusProvider = ({children}:{children:ReactNode}) => {
	const [authenticationStatus, setAuthenticationStatus] = useState<boolean>(false);
	return (
		<AuthenticationStatusContext value={{
			value: authenticationStatus,
			setter: setAuthenticationStatus,
		}}>
			{children}
		</AuthenticationStatusContext>
	);
};