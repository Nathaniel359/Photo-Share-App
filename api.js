import axios from 'axios';

// TopBar, UserComments, UserDetail, userPhotos
export const fetchUserName = async (userId) => {
    const res = await axios.get(`http://localhost:3001/user/${userId}`);
    return res.data;
};

// UserComments
export const fetchComments = async (userId) => {
    const res = await axios.get(`http://localhost:3001/comments/${userId}`);
    return res.data;
}

// UserComments, userPhotos
export const fetchPhotosOfUser = async (userId) => {
    const res = await axios.get(`http://localhost:3001/photosOfUser/${userId}`);
    return res.data;
}

// UserList
export const fetchUserList = async () => {
    const res = await axios.get('http://localhost:3001/user/list');
    return res.data;
}

// UserList
export const fetchUserListCounts = async () => {
    const res = await axios.get('http://localhost:3001/user/list/counts');
    return res.data;
}