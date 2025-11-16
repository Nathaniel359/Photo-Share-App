import axios from 'axios';

// Configure axios to send credentials (cookies) with requests
axios.defaults.withCredentials = true;

// TopBar, UserComments, UserDetail, userPhotos
export const fetchUserName = async (userId) => {
    const res = await axios.get(`http://localhost:3001/user/${userId}`);
    return res.data;
};

// UserComments
export const fetchComments = async (userId) => {
    const res = await axios.get(`http://localhost:3001/comments/${userId}`);
    return res.data;
};

// UserComments, userPhotos
export const fetchPhotosOfUser = async (userId) => {
    const res = await axios.get(`http://localhost:3001/photosOfUser/${userId}`);
    return res.data;
};

// UserList
export const fetchUserList = async () => {
    const res = await axios.get('http://localhost:3001/user/list');
    return res.data;
};

// UserList
export const fetchUserListCounts = async () => {
    const res = await axios.get('http://localhost:3001/user/list/counts');
    return res.data;
};

// Authentication
export const loginUser = async (login_name, password) => {
    const res = await axios.post('http://localhost:3001/admin/login', { login_name, password });
    return res.data;
};

export const logoutUser = async () => {
    const res = await axios.post('http://localhost:3001/admin/logout');
    return res.data;
};

export const registerUser = async (userData) => {
    const res = await axios.post('http://localhost:3001/user', userData);
    return res.data;
};

// Comments
export const addComment = async (photoId, comment) => {
    const res = await axios.post(`http://localhost:3001/commentsOfPhoto/${photoId}`, { comment });
    return res.data;
};

// Photos
export const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await axios.post('http://localhost:3001/photos/new', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return res.data;
};