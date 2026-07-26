import {AuthenticationStatusContext} from '@components/App/AppContexts';
import {useContext, useState} from 'react';
import * as apiHelpers from '@controller/utilities/apiHelpers';
import './Authentication.scss';

export default function Authentication() {

	const {value: authenticationStatus, setter: setAuthenticationStatus} = useContext(AuthenticationStatusContext);

	// const {value: controllerApp} = useContext(ControllerAppContext);
	const [username, setUsername] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [waiting, setWaiting] = useState<boolean>(false);
	const [message, setMessage] = useState<string>('');
	const [messageType, setMessageType] = useState<string>('');

	const submitHandler = async (event:any) => {
		event.preventDefault();
		setWaiting(true);
		setMessageType('');
		setMessage('');
		const startTime = Date.now();
		const verificationResult:boolean = await apiHelpers.verifyCredentials(username, password);
		if (verificationResult) {
			setMessageType('success');
			setMessage('Authentication successful.');
			setTimeout(() => {
				setAuthenticationStatus(true);
			}, 1000);
		}
		else {
			const currentTime = Date.now();
			const waitTimeTarget = 2000; // 2 seconds
			let waitTime = 0;
			if (currentTime - startTime < waitTimeTarget) {
				waitTime = waitTimeTarget - (currentTime - startTime);
			}
			setTimeout(() => {
				setMessageType('error');
				setMessage('Authentication failed.');
				setWaiting(false);
			}, waitTime);
		}
	};

	if (authenticationStatus) {
		return null;
	}
	return (
		<form className='authentication' onSubmit={submitHandler} data-waiting={waiting}>
			<div className='authentication__input-row'>
				<label className='authentication__username-label' htmlFor="authentication__username-input">Username</label>
				<input
					id="authentication__username-input"
					className='authentication__username-input'
					name="username"
					autoComplete="username"
					type="text"
					placeholder="Enter username"
					value={username}
					required
					disabled={waiting}
					onChange={(event) => setUsername(event.target.value)}
				/>
			</div>
			<div className='authentication__input-row'>
			<label className='authentication__password-label' htmlFor="authentication__password-input">Password</label>
			<input
				id="authentication__password-input"
				className='authentication__password-input'
				name="password"
				type="password"
				placeholder="Enter password"
				value={password}
				required
				disabled={waiting}
				onChange={(event) => setPassword(event.target.value)}
			/>
			</div>
			<button type="submit" disabled={waiting}>{waiting ? 'Authenticating' : 'Authenticate'}</button>
			<div className='authentication__message' data-type={messageType}>{message}</div>
		</form>
	);

};