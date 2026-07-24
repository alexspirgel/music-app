/*
- user uploaded
- when original image is uploaded the transcoded images will be generated, if the transcoded images are not ready when an image is requested, no image will be returned until the requested size exists. So you can expect a request to be null or have all the sizes = or < the original
- not forced to be square, but will be cropped as displayed as square in most places
- min required upload dimensions: 500x500
- generated sizes:
	- 125x125
	- 250x250
	- 500x500
		- 750 (1.5)
	- 1000x1000
		- 1500 (1.5)
	- 2000x2000
- only sizes smaller than the uploaded size are generated

example use:

const sources = [
	{
		width: 500,
		media: '(width: <= 500)',
	},
	{
		width: 750,
		media: '(width: <= 750)',
	},
	{
		width: 1000,
		media: '(width: <= 1000)',
	},
];

<TrackImage track={track} sources={} />
*/

import type * as trackTypes from '@controller-types/track';
import React from 'react';

type Source = {
	width:number;
	media?:string;
};
type Properties = {
	track?:trackTypes.Track;
	sources:Source[];
	alt?:string;
	loading?:'eager' | 'lazy';
	pictureClass?:string;
	imgClass?:string;
};

const arePropsEqual = (oldProps:Properties, newProps:Properties) => {
	return (JSON.stringify(oldProps.track) === JSON.stringify(newProps.track)
	&& JSON.stringify(oldProps.sources) === JSON.stringify(newProps.sources)
	&& oldProps.alt === newProps.alt
	&& oldProps.loading === newProps.loading
	&& oldProps.pictureClass === newProps.pictureClass
	&& oldProps.imgClass === newProps.imgClass)
};

const TrackImage = ({track, sources, alt, loading = 'eager', pictureClass, imgClass}:Properties) => {

	let largestSelectedSize:trackTypes.TrackImageSize | undefined;

	/**
	 * Gets the available sizes.
	 * @returns An array of available size strings sorted in ascending order.
	 */
	const getAvailableSizes = ():trackTypes.TrackImageSize[] => {
		if (track?.tags?.image && Object.keys(track.tags.image).length > 0) {
			return Object.keys(track.tags.image).sort((a, b) => parseInt(a) - parseInt(b)) as trackTypes.TrackImageSize[];
		}
		return [];
	};

	/**
	 * Generates a source element
	 * @param source - An object defining a desired image source.
	 * @returns A source element or null if one could not be generated.
	 */
	const generateSourceElement = (source:Source):React.JSX.Element | null => {
		const availableSizes:trackTypes.TrackImageSize[] = getAvailableSizes();
		if (availableSizes.length > 0) {
			// Select the smallest available size greater than or equal to the source target width.
			let selectedAvailableSize:trackTypes.TrackImageSize | undefined = availableSizes.find(size => parseInt(size) >= source.width);
			if (!selectedAvailableSize) {
				// Select the largest available size.
				selectedAvailableSize = availableSizes.at(-1);
			}
			if (selectedAvailableSize && track?.tags?.image) {
				if (typeof largestSelectedSize === 'undefined' || parseInt(selectedAvailableSize) > parseInt(largestSelectedSize)) {
					// Update the largest selected size (does not include high density selections).
					largestSelectedSize = selectedAvailableSize;
				}
				let srcset:string = `${track.tags.image[selectedAvailableSize]} 1x`;
				let srcsetHighDensityFactor:number = 2;
				let selectedHighDensity:trackTypes.TrackImageSize | undefined = availableSizes.find(availableSize => parseInt(selectedAvailableSize) * srcsetHighDensityFactor === parseInt(availableSize));
				if (!selectedHighDensity) {
					srcsetHighDensityFactor = 1.5;
					selectedHighDensity = availableSizes.find(availableSize => parseInt(selectedAvailableSize) * srcsetHighDensityFactor === parseInt(availableSize));
				}
				if (selectedHighDensity) {
					srcset = `${srcset}, ${track.tags.image[selectedHighDensity]} ${srcsetHighDensityFactor}x`;
				}
				return <source media={source.media} srcSet={srcset} type="image/jpeg" />;
			}
		}
		return null;
	};

	const generateSourceElements = ():React.JSX.Element[] | [] => {
		const sourceElements:React.JSX.Element[] = [];
		for (let i = 0; i < sources.length; i++) {
			const source = sources[i];
			const sourceElement:React.JSX.Element | null = generateSourceElement(source);
			if (sourceElement) {
				sourceElements.push(React.cloneElement(sourceElement, {key: i}));
			}
		}
		return sourceElements;
	};

	const getFallbackSRC = () => {
		if (track?.tags?.image) {
			if (largestSelectedSize) {
				return track.tags.image[largestSelectedSize];
			}
			else {
				const largestAvailableSize1kOrUnder:trackTypes.TrackImageSize | undefined = getAvailableSizes().reverse().find(size => parseInt(size) <= 1000);
				if (largestAvailableSize1kOrUnder) {
					return track.tags.image[largestAvailableSize1kOrUnder];
				}
			}
		}
		return '/missing-album-art.svg';
	};

	return (
		<picture className={pictureClass}>
			{generateSourceElements()}
			<img className={imgClass} src={getFallbackSRC()} alt={alt} loading={loading} />
		</picture>
	);

};
export default React.memo(TrackImage, arePropsEqual);