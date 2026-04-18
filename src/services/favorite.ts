import api from './api';

export interface Favorite {
    id: number;
    targetId: number;
    targetType: 'destination' | 'recommendation';
    targetName: string;
    targetImage: string;
    createTime: string;
}

export interface FavoriteListResponse {
    list: Favorite[];
    total: number;
}

// 添加收藏
export const addFavorite = (
    targetId: number,
    targetType: 'destination' | 'recommendation'
): Promise<Favorite> => {
    return api.post('/favorite/add', { targetId, targetType });
};

// 取消收藏
export const removeFavorite = (
    targetId: number,
    targetType: 'destination' | 'recommendation'
): Promise<boolean> => {
    return api.delete('/favorite/remove', { params: { targetId, targetType } });
};

// 获取收藏列表
export const getFavoriteList = (
    targetType?: string,
    page: number = 1,
    size: number = 20
): Promise<FavoriteListResponse> => {
    return api.get('/favorite/list', { params: { targetType, page, size } });
};
