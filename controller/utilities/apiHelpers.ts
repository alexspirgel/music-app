import type * as trackTypes from '@controller-types/track';

type APIResponse = {
	url:string;
	expires_in:number;
};

let validUsername:string | undefined;
let validPassword:string | undefined;

export const apiRequest = async (username:string, password:string, path:string):Promise<APIResponse> => {
	const authentication = btoa(`${username}:${password}`);
	const response = await fetch(
		`https://0ew9m2x42a.execute-api.us-east-1.amazonaws.com/presigned-url?key=${encodeURIComponent(path)}`,
		{
			headers: {
				Authorization: `Basic ${authentication}`,
			},
		}
	);
	if (!response.ok) {
		throw new Error(`HTTP Error: Status ${response.status}`);
	}
	const json = await response.json();
	return json;
}

export const verifyCredentials = async (username:string, password:string):Promise<boolean> => {
	try {
		await apiRequest(username, password, '9966/Start/9966 - Start - 01 WXP1.mp3');
		validUsername = username;
		validPassword = password;
		return true;
	}
	catch (error) {
		return false;
	}
};

export const getTrackAPIData = async (track:trackTypes.Track):Promise<APIResponse> => {
	if (validUsername && validPassword) {
		return await apiRequest(validUsername, validPassword, track.fileUrl);
	}
	throw new Error('Missing cached username and password');
};