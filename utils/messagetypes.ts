export interface userInterface {
    oauth_uid:string;
    first_name:string;
     last_name:string;
      user_name:string;
       avatar_pic:string
}
export interface RealTimeProfileMessages {
    currentUser:userInterface |null
}
export interface conversationInterface {
    id:string;
    user1_id:string;
    user2_id:string;
    created:string
}
