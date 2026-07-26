import type QueueItemType from '@controller-classes/QueueItem';
import type * as ControllerPlayerTypes from '@controller-classes/Player';
import {useContext, useEffect, useRef, useState} from 'react';
import ControllerDuration from '@controller-classes/Duration';
import Duration from '@components/Duration/Duration';
import {ControllerAppContext} from '@components/App/AppContexts';
import './ProgressBar.scss';

const durationFormattingOptions = {
	hours: {
		minimumIntegerDigits: 0,
		minimumDecimalDigits: 0,
		maximumDecimalDigits: 0,
		suffix: '',
		displayThousandsDelimiter: true,
	},
	minutes: {
		minimumIntegerDigits: 1,
		minimumDecimalDigits: 0,
		maximumDecimalDigits: 0,
		suffix: '',
		displayThousandsDelimiter: false,
	},
	seconds: {
		minimumIntegerDigits: 2,
		minimumDecimalDigits: 0,
		maximumDecimalDigits: 0,
		suffix: '',
		displayThousandsDelimiter: false,
	},
	separators: {
		hours: {
			minutes: ':',
		},
		minutes: {
			seconds: ':',
		},
	},
};
const durationUnitSelection = {
	hours: true,
	minutes: true,
	seconds: true,
};
let updatingPlaybackProgressId:number | undefined;

type Properties = {
	className?:string;
	loading?:boolean;
};

export default function ProgressBar({className, loading}:Properties) {
	if (className) {
		className = className + ' progress-bar';
	}
	else {
		className = 'progress-bar';
	}
	// context
	const {value: controllerApp} = useContext(ControllerAppContext);
	// state
	const [activeTrack, setActiveTrack] = useState<QueueItemType | undefined>(controllerApp.player.activeTrack);
	const [activeTrackTotalDuration, setActiveTrackTotalDuration] = useState<ControllerDuration>(new ControllerDuration());
	const [activeTrackCurrentDuration, setActiveTrackCurrentDuration] = useState<ControllerDuration>(new ControllerDuration());
	const [isDraggingSeek, setIsDraggingSeek] = useState<boolean>(false);
	// ref
	const componentElementRef = useRef<HTMLDivElement>(null);
	const barAreaElementRef = useRef<HTMLDivElement>(null);
	const isDraggingSeekRef = useRef<boolean>(isDraggingSeek);
	// effect
	useEffect(() => {
		controllerApp.player.addEventListener('onSetActiveTrack', controllerPlayerOnSetActiveTrackHandler);
		controllerApp.player.addEventListener('onPlay', controllerPlayerOnPlayHandler);
		return () => {
			controllerApp.player.removeEventListener('onSetActiveTrack', controllerPlayerOnSetActiveTrackHandler);
			controllerApp.player.removeEventListener('onPlay', controllerPlayerOnPlayHandler);
		}
	}, []);
	useEffect(() => {
		if (activeTrack) {
			document.body.setAttribute('data-active-track', '');
			setActiveTrackTotalDuration(new ControllerDuration({milliseconds: activeTrack.track.duration}));
		}
		else {
			document.body.removeAttribute('data-active-track');
			setActiveTrackTotalDuration(new ControllerDuration());
		}
		updatePlaybackProgress();
		endProgressBarSeekKnobDragging();
	}, [activeTrack]);
	useEffect(() => {
		isDraggingSeekRef.current = isDraggingSeek;
		if (isDraggingSeek) {
			window.addEventListener('mousemove', progressBarMouseMoveHandler);
			window.addEventListener('mouseup', progressBarMouseUpHandler);
			window.addEventListener('mouseleave', progressBarMouseLeaveHandler);
		}
		return () => {
			window.removeEventListener('mousemove', progressBarMouseMoveHandler);
			window.removeEventListener('mouseup', progressBarMouseUpHandler);
			window.removeEventListener('mouseleave', progressBarMouseLeaveHandler);
		};
	}, [isDraggingSeek]);
	// functions
	const controllerPlayerOnSetActiveTrackHandler = (event:ControllerPlayerTypes.OnSetActiveTrackEvent) => {
		setActiveTrack(event.newValue);
	};
	const roundTo = (number:number, decimals:number):number => {
		const factor:number = Math.pow(10, decimals);
		return Math.round((number + Number.EPSILON) * factor) / factor;
	};
	const getProgressBarPercent = (clientX:number):number | undefined => {
		const barAreaElement = barAreaElementRef.current;
		if (barAreaElement) {
			const boundingClientRect = barAreaElement.getBoundingClientRect();
			const x:number = clientX - boundingClientRect.left;
			const percent:number = Math.min(Math.max((x / boundingClientRect.width), 0), 1);
			return percent;
		}
	};
	const endProgressBarSeekKnobDragging = (event?:any) => {
		const x:number = event?.clientX ?? 0;
		if (controllerApp.player.activeTrack && isDraggingSeek) {
			setIsDraggingSeek(false);
			const componentElement = componentElementRef.current;
			const barAreaElement = barAreaElementRef.current;
			if (componentElement && barAreaElement) {
				const progressPercent = getProgressBarPercent(x);
				if (typeof progressPercent === 'number') {
					barAreaElement.setAttribute('data-instant-progress-bar-transition', '');
					controllerApp.player.activeTrack.setSeekPercent(progressPercent);
					updatePlaybackProgress();
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							barAreaElement.removeAttribute('data-instant-progress-bar-transition');
						});
					});
				}
				componentElement.style.removeProperty('--seek-knob-percent');
			}
		}
	};
	/**
	 * Updates playback progress. This includes updating the current duration and progress bar.
	 * @returns A boolean indicating whether playback progress should continually update or not. By itself this does nothing. It is used to inform calls of `updatePlaybackProgressContinually` if it should stop or continue.
	 */
	const updatePlaybackProgress = ():boolean => {
		let continuallyUpdate = false;
		const componentElement = componentElementRef.current;
		if (componentElement) {
			let currentTimePercentString:string = '0%';
			let totalDurationMilliseconds:number = 0;
			let currentTimeMilliseconds:number = 0;
			if (controllerApp.player.activeTrack) {
				continuallyUpdate = true;
				totalDurationMilliseconds = controllerApp.player.activeTrack.track.duration || 0;
				currentTimeMilliseconds = controllerApp.player.activeTrack.seek() || 0;
				if (totalDurationMilliseconds > 0) {
					currentTimePercentString = `${roundTo((Math.min(Math.max((currentTimeMilliseconds / totalDurationMilliseconds), 0), 1) * 100), 1)}%`;
				}
			}
			if (!isDraggingSeekRef.current) {
				setActiveTrackCurrentDuration(new ControllerDuration({milliseconds: Math.round(currentTimeMilliseconds)}));
			}
			componentElement.style.setProperty('--progress-percent', currentTimePercentString);
		}
		return continuallyUpdate;
	};
	/**
	 * Continually updates playback progress until playback stops.
	 * @param _id - An internal id to prevent continually updating calls. 
	 * @returns A promise due to be asynchronous.
	 */
	const updatePlaybackProgressContinually = async (_id:number = Date.now()):Promise<void> => {
		if (typeof updatingPlaybackProgressId === 'number' && _id !== updatingPlaybackProgressId) {
			return;
		}
		if (controllerApp.player.playing && updatePlaybackProgress()) {
			updatingPlaybackProgressId = _id
			requestAnimationFrame(() => updatePlaybackProgressContinually(_id));
		}
		else {
			updatingPlaybackProgressId = undefined;
		}
	};
	const progressBarMouseMoveHandler = (event:any) => {
		const componentElement = componentElementRef.current;
		if (controllerApp.player.activeTrack && componentElement) {
			const progressPercent = getProgressBarPercent(event.clientX);
			if (typeof progressPercent === 'number') {
				const progressDuration = controllerApp.player.activeTrack.getDurationFromPercent(progressPercent);
				setActiveTrackCurrentDuration(new ControllerDuration({milliseconds: progressDuration}));
				componentElement.style.setProperty('--seek-knob-percent', `${roundTo((progressPercent * 100), 1)}%`);
			}
		}
	};
	const progressBarMouseUpHandler = (event:any) => {
		endProgressBarSeekKnobDragging(event);
	};
	const progressBarMouseLeaveHandler = (event:any) => {
		endProgressBarSeekKnobDragging(event);
	};
	const barMouseDownHandler = (event:any) => {
		event.preventDefault();
		if (controllerApp.player.activeTrack) {
			setIsDraggingSeek(true);
		}
	};
	const barKeyDownHandler = (event:any) => {
		const barAreaElement = barAreaElementRef.current;
		if (barAreaElement && controllerApp.player.activeTrack && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
			event.preventDefault();
			const currentSeekMilliseconds = controllerApp.player.activeTrack.seek() || 0;
			let newSeek = currentSeekMilliseconds;
			if (event.key === 'ArrowLeft') {
				newSeek = Math.max((currentSeekMilliseconds - 5000), 0);
			}
			if (event.key === 'ArrowRight') {
				newSeek = currentSeekMilliseconds + 5000;
			}
			barAreaElement.setAttribute('data-instant-progress-bar-transition', '');
			controllerApp.player.activeTrack.seek(newSeek);
			updatePlaybackProgress();
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					barAreaElement.removeAttribute('data-instant-progress-bar-transition');
				});
			});
		}
	};
	const controllerPlayerOnPlayHandler = () => {
		updatePlaybackProgressContinually();
	};

	return (
		<div className={className} ref={componentElementRef} data-loading={loading ? '' : null}>
			<Duration className='progress-bar__current-duration' controllerDuration={activeTrackCurrentDuration} unitSelection={durationUnitSelection} formattingOptionsOverrides={durationFormattingOptions} />
			<div className="progress-bar__bar-area" ref={barAreaElementRef} onMouseDown={barMouseDownHandler} onKeyDown={barKeyDownHandler} tabIndex={activeTrack ? 0 : -1}>
				<div className="progress-bar__bar">
					<div className="progress-bar__seek-knob"></div>
					<div className="progress-bar__seek-difference"></div>
					<div className="progress-bar__current-progress"></div>
				</div>
			</div>
			<Duration className='progress-bar__total-duration' controllerDuration={activeTrackTotalDuration} unitSelection={durationUnitSelection} formattingOptionsOverrides={durationFormattingOptions} />
		</div>
	);

};