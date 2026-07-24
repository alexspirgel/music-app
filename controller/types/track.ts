export type TrackImageSize = '125' | '250' | '500' | '750' | '1000' | '1500' | '2000';
export type Track = {
	trackId:string;
	fileUrl:string;
	duration:number;
	lastPlayed:string | undefined;
	playCount:number;
	tags:{
		title:string;
		album?:string;
		artists?:string[];
		albumArtists?:string[];
		composers?:string[];
		date?:string;
		genres?:string[];
		trackNumber?:number;
		totalTracks?:number;
		discNumber?:number;
		totalDisks?:number;
		comment?:string;
		image?:{
			[key in TrackImageSize]:string;
		};
	};
};