export interface MediaAtrributes {
    currentSelf: string[],
    imagineSelf: string[] 
}

export interface MediaItem {
    _id: string;
    type: string;
    title: string;
    description: string;
    thumbnail: string;
    videoLink?: string;
    isViewed?: boolean;
    attributes?: MediaAtrributes;
}

export interface EditModalProps {
    media: MediaItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (media: MediaItem) => void;
}