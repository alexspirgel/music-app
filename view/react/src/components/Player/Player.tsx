import type QueueItemType from '@controller-classes/QueueItem';
import type * as QueueItemTypes from '@controller-classes/QueueItem';
import type * as ControllerPlayerTypes from '@controller-classes/Player';
import type * as ControllerTrackListTypes from '@controller-classes/TrackList';
import {useContext, useState, useEffect, useRef} from 'react';
import {ControllerAppContext, QueueSidebarOpenContext} from '@components/App/AppContexts';
import TrackImage from '@components/TrackImage/TrackImage';
import ProgressBar from '@components/ProgressBar/ProgressBar';
import './Player.scss';

const trackImageSources = [{width: 64}];
let howlerLastAction = 0;

const howlerThrottle = (actionCoolDown = 1000) => {
	if (Date.now() - howlerLastAction < actionCoolDown) {
		return true;
	}
	howlerLastAction = Date.now();
	return false;
};

export default function Player() {

	const {value: controllerApp} = useContext(ControllerAppContext);
	const {value: queueSidebarOpen, setter: setQueueSidebarOpen} = useContext(QueueSidebarOpenContext);

	const [activeTrack, setActiveTrack] = useState<QueueItemType | undefined>(controllerApp.player.activeTrack);
	const [activeTrackLoading, setActiveTrackLoading] = useState<boolean>(false);
	const [playing, setPlaying] = useState<boolean>(controllerApp.player.playing);
	const [volume, setVolume] = useState<number>(controllerApp.player.volume);
	const [shuffled, setShuffled] = useState<boolean>(controllerApp.player.queue.shuffled);
	const [isMuted, setIsMuted] = useState<boolean>(controllerApp.player.isMuted);
	const [repeatState, setRepeatState] = useState<ControllerPlayerTypes.RepeatState>(controllerApp.player.repeat);
	const [queueLength, setQueueLength] = useState<number>(0);

	const volumeInputElementRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		controllerApp.player.addEventListener('onSetActiveTrack', controllerOnSetActiveTrackHandler);
		controllerApp.player.addEventListener('onVolumeChange', controllerOnVolumeChangeHandler);
		controllerApp.player.addEventListener('onShuffleChange', controllerOnShuffleChangeHandler);
		controllerApp.player.addEventListener('onPlayingChange', controllerOnPlayingChangeHandler);
		controllerApp.player.addEventListener('onRepeatChange', controllerOnRepeatChangeHandler);
		controllerApp.player.queue.addEventListener('afterSetItems', updateQueueLength);
		controllerApp.player.queue.addEventListener('afterAddItem', updateQueueLength);
		controllerApp.player.queue.addEventListener('afterRemoveItem', updateQueueLength);
		return () => {
			controllerApp.player.removeEventListener('onSetActiveTrack', controllerOnSetActiveTrackHandler);
			controllerApp.player.removeEventListener('onVolumeChange', controllerOnVolumeChangeHandler);
			controllerApp.player.removeEventListener('onShuffleChange', controllerOnShuffleChangeHandler);
			controllerApp.player.removeEventListener('onPlayingChange', controllerOnPlayingChangeHandler);
			controllerApp.player.removeEventListener('onRepeatChange', controllerOnRepeatChangeHandler);
			controllerApp.player.queue.removeEventListener('afterSetItems', updateQueueLength);
			controllerApp.player.queue.removeEventListener('afterAddItem', updateQueueLength);
			controllerApp.player.queue.removeEventListener('afterRemoveItem', updateQueueLength);
		}
	}, []);

	useEffect(() => {
		volumeSliderUpdateBackground();
	}, [volume]);

	useEffect(() => {
		const appElement = document.querySelector('.app');
		if (appElement) {
			appElement.setAttribute('data-playing', String(playing));
		}
	}, [playing]);

	const volumeSliderUpdateBackground = () => {
		const volumeSliderElement = volumeInputElementRef.current;
		if (volumeSliderElement) {
			const percent:number = Number(volumeSliderElement.value) * 100;
			volumeSliderElement.style.background = `linear-gradient(to right, var(--color-accent-a) ${percent}%, var(--track-color) ${percent}%)`;
		}
	};

	const volumeSliderChangeHandler = (event:any) => {
		controllerApp.player.volume = event.target.value;
	};

	const controllerOnSetActiveTrackHandler = (event:ControllerPlayerTypes.OnSetActiveTrackEvent) => {
		activeTrack?.removeEventListener('onLoadingChange', controllerOnLoadingChangeHandler);
		setActiveTrack(event.newValue);
		activeTrack?.addEventListener('onLoadingChange', controllerOnLoadingChangeHandler);
	};

	const controllerOnLoadingChangeHandler = (event:QueueItemTypes.OnLoadingChangeEvent) => {
		if (event.eventSource === activeTrack) {
			setActiveTrackLoading(event.loading);
		}
	}

	const controllerOnVolumeChangeHandler = (event:ControllerPlayerTypes.OnVolumeChangeEvent) => {
		setVolume(event.value);
		setIsMuted(controllerApp.player.isMuted);
	};

	const controllerOnShuffleChangeHandler = () => {
		setShuffled(controllerApp.player.shuffled);
	};

	const controllerOnPlayingChangeHandler = () => {
		setPlaying(controllerApp.player.playing);
	};

	const controllerOnRepeatChangeHandler = () => {
		setRepeatState(controllerApp.player.repeat);
	};

	const toggleQueueSidebar = () => {
		if (queueSidebarOpen) {
			setQueueSidebarOpen(false);
		}
		else {
			setQueueSidebarOpen(true);
		}
	};

	const updateQueueLength = (event:ControllerTrackListTypes.AfterAddItemEvent | ControllerTrackListTypes.AfterRemoveItemEvent | ControllerTrackListTypes.AfterSetItemsEvent) => {
		if ((event.eventId === 'afterAddItem' || event.eventId === 'afterRemoveItem')
		&& controllerApp.player.queue.isSettingItems) {
			return;
		}
		setQueueLength(controllerApp.player.queue.items.length);
	};

	const skipPreviousButtonHandler = () => {
		if (howlerThrottle()) {
			return;
		}
		controllerApp.player.skip('previous');
	};

	const skipNextButtonHandler = () => {
		if (howlerThrottle()) {
			return;
		}
		controllerApp.player.skip('next');
	};

	return (
		<>
			<div className='player'>
				<div className='player__detail-area'>
					<TrackImage
						pictureClass='player__track-image'
						track={activeTrack?.track}
						alt={activeTrack?.track.tags.title}
						sources={trackImageSources}
					/>
					<div className='player__text'>
						<div className='player__title'>{activeTrack?.track.tags.title}</div>
						<div className='player__artist'>{activeTrack?.track.tags.albumArtists?.join(', ')}</div>
					</div>
				</div>
				<div className='player__control-area'>
					<div className='player__control-buttons'>
						<button className='player__button-repeat' onClick={controllerApp.player.repeatToggle} aria-label={`repeat ${repeatState}`}>
							<svg className='player__button-repeat-icon' version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" width="18" height="18">
								<path className="player__button-repeat-icon-1" d="m9 12h1v-6l-2 1v1l1 1z"/>
								<path d="m13 15h-10v-4h2v2h8z"/>
								<path fillRule="evenodd" d="m13 9.76l4.24 4.24-4.24 4.24"/>
								<path d="m5 3h10v4h-2v-2h-8z"/>
								<path fillRule="evenodd" d="m5 8.24l-4.24-4.24 4.24-4.24"/>
							</svg>
						</button>
						<button className='player__button-skip-previous' onClick={skipPreviousButtonHandler} aria-label="skip previous" disabled={!activeTrack}>
							<svg className='player__button-skip-previous-icon' version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
								<path fillRule="evenodd" d="m3 8l12-6.93v13.86z"/>
								<path fillRule="evenodd" d="m1 1h1v14h-1z"/>
							</svg>
						</button>
						<button className='player__button-play-pause' onClick={() => controllerApp.player.playPauseToggle()} disabled={queueLength < 1} aria-label={playing ? 'pause' : 'play'}>
							<svg className='player__button-play-icon' version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
								<path fillRule="evenodd" d="m16 8.08l-14 8.09v-16.17z"/>
							</svg>
							<svg className='player__button-pause-icon' version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
								<path fillRule="evenodd" d="m13 1v14h-3v-14z"/>
								<path fillRule="evenodd" d="m6 1v14h-3v-14z"/>
							</svg>
						</button>
						<button className='player__button-skip-next' onClick={skipNextButtonHandler} aria-label="skip next" disabled={!activeTrack}>
							<svg className='player__button-skip-next-icon' version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
								<path fillRule="evenodd" d="m3 8l12-6.93v13.86z"/>
								<path fillRule="evenodd" d="m1 1h1v14h-1z"/>
							</svg>
						</button>
						<button className='player__button-shuffle' onClick={controllerApp.player.toggleShuffle} aria-label={shuffled ? 'shuffled' : 'unshuffled'}>
							<svg className='player__button-shuffle-icon' version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
								<path fillRule="evenodd" d="m14.14 12.73l-1.41 1.41-3.73-3.73 1.41-1.41z"/>
								<path fillRule="evenodd" d="m7 5.59l-1.41 1.41-4.59-4.59 1.41-1.41z"/>
								<path fillRule="evenodd" d="m15 9v6h-6"/>
								<path fillRule="evenodd" d="m12.36 2.22l1.42 1.42-11.37 11.36-1.41-1.41z"/>
								<path fillRule="evenodd" d="m9 1h6v6"/>
							</svg>
						</button>
					</div>
					<ProgressBar className='player__progress-bar' loading={activeTrackLoading} />
				</div>
				<div className='player__utility-area'>
					<button className='player__button-volume-toggle' onClick={() => controllerApp.player.toggleMute()} aria-label={isMuted ? 'unmute' : 'mute'}>
						<svg className='player__button-volume-toggle-icon' version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
							<path className='player__button-volume-toggle-icon-x' d="m10.46 11.61l-1.23-1.27 2.16-2.23-2.16-2.22 1.23-1.27 2.16 2.22 2.15-2.22 1.23 1.27-2.15 2.22 2.15 2.23-1.23 1.27-2.15-2.23z"/>
							<path className='player__button-volume-toggle-icon-sound-wave' d="m15.66 8.11c0 3.86-2.6 7.07-6.09 7.89v-1.86c2.52-0.77 4.35-3.17 4.35-6.03 0-2.85-1.83-5.26-4.35-6.03v-1.86c3.49 0.82 6.09 4.04 6.09 7.89z"/>
							<path className='player__button-volume-toggle-icon-sound-wave' d="m12.18 8.11c0 1.85-1.07 3.43-2.61 4.12v-2.11c0.54-0.49 0.87-1.21 0.87-2.01 0-0.8-0.33-1.52-0.87-2.01v-2.11c1.54 0.69 2.61 2.28 2.61 4.12z"/>
							<path d="m0 5h3l5-4v14l-5-4h-3z"/>
						</svg>
					</button>
					<input ref={volumeInputElementRef} className='player__volume-input-range' type="range" min="0" max="1.0" step="0.05" value={volume} onChange={volumeSliderChangeHandler} />
					<button className='player__button-queue' onClick={toggleQueueSidebar} aria-label={`${queueSidebarOpen ? 'close' : 'open'} queue sidebar`}>
						<svg className='player__button-queue-icon' version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
							<path fillRule="evenodd" d="m6 12v2h-5v-2z"/>
							<path fillRule="evenodd" d="m10 7v2h-9v-2z"/>
							<path fillRule="evenodd" d="m10 2v2h-9v-2z"/>
							<path fillRule="evenodd" d="m11.65 15.91c-1.61 0.43-3.19-0.3-3.55-1.63-0.36-1.34 0.65-2.77 2.25-3.19 1.61-0.43 3.19 0.3 3.55 1.63 0.36 1.34-0.65 2.77-2.25 3.19z"/>
							<path fillRule="evenodd" d="m14 2v10h-2v-10z"/>
							<path fillRule="evenodd" d="m16 0v2h-4v-2z"/>
						</svg>
					</button>
				</div>
			</div>
			<div className='player__spacer'></div>
		</>
	);

};