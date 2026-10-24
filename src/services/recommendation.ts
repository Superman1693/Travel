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
    /** 修复 O24：数据来源标注（llm = AI 生成，价格/评分为估算值） */
    dataSource?: string;
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

// 根据位置获取热门推荐（修复 E5/D3：后端已改为 POST 且需登录）
export const getHotRecommendationsByLocation = (
    location: string,
    page: number = 1,
    size: number = 10
): Promise<RecommendationListResponse> => {
    return api.post('/recommendation/hotdata', null, { params: { location, page, size } });
};
