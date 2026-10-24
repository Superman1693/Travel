import api from './api';

export interface User {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
    role: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    email?: string;
    phone?: string;
}

export interface UpdateUserRequest {
    email?: string;
    oldPassword?: string;
    newPassword?: string;
}

// 修复：重置密码必须携带验证码，用户名/邮箱为必填
export interface ResetPasswordRequest {
    username: string;
    email: string;
    code: string;
    newPassword: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

// 用户注册
export const register = (data: RegisterRequest): Promise<number> => {
    return api.post('/user/register', data);
};

// 用户登录
export const login = (data: LoginRequest): Promise<LoginResponse> => {
    return api.post('/user/login', data);
};

// 获取当前用户信息
export const getCurrentUser = (): Promise<User> => {
    return api.get('/user/me');
};

// 修改用户信息
export const updateUser = (data: UpdateUserRequest): Promise<User> => {
    return api.put('/user/update', data);
};

// 发送重置密码邮箱验证码
export const sendResetCode = (data: { username: string; email: string }): Promise<unknown> => {
    return api.post('/user/send-code', data);
};

export const resetPassword = (data: ResetPasswordRequest): Promise<User> => {
    return api.post('/user/reset-password', data);
};

// 上传头像
export const uploadAvatar = (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
