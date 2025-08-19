export interface FilmMedia {
    _id: string;
    title: string;
    videoLink: string;
    description: string;
    thumbnail: string;
    attributes: {
        currentSelf: string[];
        imagineSelf: string[];
    };
    isViewed?: boolean;
    type?: string;
}

export interface CuratedMedia {
    _id: string;
    artMedia: any[];
    musicMedia: any[];
    filmMedia: FilmMedia[];
}

export interface CuratedPath {
    _id: string;
    currentImagine: string;
    selfImagine: string;
    betterThrough: string;
    numberOfContent: number;
    contentFinished: number;
    curatedMedia: CuratedMedia;
}

export interface User {
    _id: string;
    name: string;
    profileName: string;
    profilePicture: string;
    email: string;
    isOnboarded: boolean | null;
    emailVerified: boolean;
    phoneVerified: boolean;
    phoneNumber: string;
    twoFA: boolean;
    password: string;
    attributes: {
        currentSelf: string[];
        imagineSelf: string[];
        learningStyle: string[];
        mediaPreferences: string[];
    };
    role: string;
    pathDay: number;
    curatedPaths: CuratedPath[];
    createdAt: string;
    updatedAt: string;
    __v: number;
}