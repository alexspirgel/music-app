/**
 * Checks if a value is an object or not. Null is not an object.
 * @param value - The value to check.
 * @returns True if the value is an object.
 */
export const isObject = (value:unknown):boolean => {
	return (typeof value === 'object' && value !== null);
};

/**
 * Checks if an object is plain or not.
 * @param object - The object to check.
 * @returns True if the object is plain, otherwise false.
 */
export const isPlainObject = (object:unknown):boolean => {
	let constructor, prototype;
	if (!isObject(object)) {
		return false;
	}
	constructor = Object(object).constructor;
	if (constructor === undefined) {
		return true;
	}
	prototype = constructor.prototype;
	if (!isObject(prototype)) {
		return false;
	}
	if (!prototype.hasOwnProperty('isPrototypeOf')) {
		return false;
	}
	return true;
};

/**
 * Merge one or more values into another value.
 * - Arrays are not merged, they are replaced without referencing the original.
 * - Non-plain objects are passed by reference.
 * - Undefined values are not merged into the target.
 * @param target - The value to merge into.
 * @param sources - An array of values to merge into the target.
 * @returns The merged value.
 */
export const extendOptions = (target:any, ...sources:any[]):any => {
	for (const source of sources) {
		if (source === target) {
			continue;
		}
		else if (Array.isArray(source)) {
			target = [];
			for (const index of source.keys()) {
				target[index] = extendOptions(target[index], source[index]);
			}
		}
		else if (isPlainObject(source)) {
			if (!isPlainObject(target)) {
				target = {};
			}
			for (const property in source) {
				target[property] = extendOptions(target[property], source[property]);
			}
		}
		else if (source !== undefined) {
			target = source;
		}
	}
	return target;
};

/**
 * Shallow compare two objects.
 * @param objectA - An object to compare.
 * @param objectB - An object to compare.
 * @returns True if the objects are shallowly equal, otherwise false.
 */
export const shallowCompareObjects = (objectA:Record<string, unknown>, objectB:Record<string, unknown>) => {
	if (isObject(objectA) && isObject(objectB)) {
		if (objectA === objectB) {
			return true;
		}
		const keysA = Object.keys(objectA);
		const keysB = Object.keys(objectB);
		if (keysA.length === keysB.length) {
			return keysA.every((key) => {
				return objectB.hasOwnProperty(key) && objectA[key] === objectB[key];
			});
		}
	}
	return false;
};

/**
 * Generates a random integer between and including the minimum and maximum.
 * @param minimum - The minimum boundary of the random number, rounded up to the nearest integer.
 * @param maximum - The maximum boundary of the random number, rounded down to the nearest integer.
 * @returns A random integer within the minimum and maximum.
 */
export const generateRandomInteger = (minimum:number, maximum:number):number => {
	minimum = Math.ceil(minimum);
	maximum = Math.floor(maximum);
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
};

type MediaSessionSupportType = 'mediaSession' | 'metadata' | 'album' | 'artist' | 'artwork' | 'title' | 'setActionHandler' | 'nexttrack' | 'pause' | 'play' | 'previoustrack' | 'seekbackward' | 'seekforward' | 'seekto' | 'stop' | 'playbackState' | 'setPositionState';
/**
 * Checks if media session functionality is supported or not.
 * @param functionality - Optionally check for specific functionality, otherwise only check for broad media session support.
 * @returns True if the functionality is supported, otherwise false.
 */
export const hasMediaSessionSupport = (functionality?:MediaSessionSupportType):boolean => {
	if (isObject(window.navigator) && 'mediaSession' in window.navigator) {
		if (functionality === 'mediaSession' || typeof functionality === 'undefined') {
			return true;
		}
		else if (['metadata', 'album', 'artist', 'artwork', 'title'].includes(functionality)
		&& typeof window.MediaMetadata === 'function') {
			if (functionality === 'metadata') {
				return true;
			}
			else if (functionality in window.MediaMetadata.prototype) {
				return true;
			}
		}
		else if (['setActionHandler', 'nexttrack', 'pause', 'play', 'previoustrack', 'seekbackward', 'seekforward', 'seekto', 'stop'].includes(functionality)
		&& 'setActionHandler' in window.navigator.mediaSession) {
			if (functionality === 'setActionHandler') {
				return true;
			}
			else {
				try {
					// Because only one setActionHandler of a given type can be set at a time, this has the side effect of removing the setActionHandler type that is being evaluated. This is currently the only way to test for a specific type of setActionHandler support.
					window.navigator.mediaSession.setActionHandler(functionality as any, null);
					return true;
				}
				catch(error) {/* suppress error */}
			}
		}
		else if (['playbackState', 'setPositionState',].includes(functionality)
		&& functionality in window.navigator.mediaSession) {
			return true;
		}
	}
	return false;
};

/**
 * Gets an object property value via an array of path parts.
 * @param object - The object to ge the property value from.
 * @param pathParts - A set of property strings to apply to the object to get the value.
 * @param defaultValue - Optionally set a default value to be returned when the property does not exist.
 * @returns The value found using the path parts or a default value or undefined.
 */
export const getPropertyValueByPath = (object:object, pathParts:string[], defaultValue?:any):any => {
	let value:any = object;
	for (const pathPart of pathParts) {
		if (isObject(value) && pathPart in value) {
			value = value[pathPart];
		}
		else {
			value = defaultValue;
			break;
		}
	}
	return value;
};