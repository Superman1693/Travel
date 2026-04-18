import api from './api';

export interface Notification {
    id: number;
    title: string;
    content: string;
    type: 'system' | 'promotion' | 'reminder';
    isRead: boolean;
    createTime: string;
}

export interface NotificationListResponse {
    list: Notification[];
    unreadCount: number;
    total: number;
}

// 获取通知列表
export const getNotificationList = (
    unreadOnly: boolean = false,
    page: number = 1,
    size: number = 20
): Promise<NotificationListResponse> => {
    return api.get('/notification/list', { params: { unreadOnly, page, size } });
};

// 标记通知已读
export const markNotificationRead = (notificationIds?: number[]): Promise<boolean> => {
    return api.post('/notification/read', { notificationIds });
};
