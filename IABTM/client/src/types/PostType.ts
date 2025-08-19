export interface User {
    _id: string;
    name: string;
    role?: string;
    profilePicture?: string;
    profileName?: string;
}

export enum post_type {
    post = 'post',
    masterclass = 'masterclass',
    article = 'article'
}

export interface Comment {
    _id: string;
    content: string;
    commentor: User;
    post_type: post_type;
    createdAt: string;
}

export interface Post {
    _id: string;
    content: string;
    postedBy: User;
    pictures: string[];
    createdAt: string;
    likes: {
        count: number;
        likedBy: User[];
        isLikedByUser: boolean;
    };
    comments: Comment[];
    applauds?: string[];
}

