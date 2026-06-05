export interface Photo {
	src: string;
	alt?: string;
	caption?: string;
}

export interface AlbumGroup {
	id: string;
	title: string;
	description?: string;
	cover: string;
	photos: Photo[];
	tags?: string[];
}
