import api from './api';

export interface Recommendation {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    price: number;
    rating: number;
    reviewCount: number;
    tags: string[];
}

export interface RecommendationListResponse {
    list: Recommendation[];
    total: number;
    page: number;
    size: number;
}

// 获取热门推荐列表
export const getHotRecommendations = (
    page: number = 1,
    size: number = 10
): Promise<RecommendationListResponse> => {
    return api.get('/recommendation/hot', { params: { page, size } });
};
