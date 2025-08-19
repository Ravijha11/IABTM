import { User } from "./PostType";

export interface CommentData {
    _id: string;
    content: string;
    commentor: User;
    createdAt: string;
}