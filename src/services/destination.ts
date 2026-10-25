import api from './api';

export interface Destination {
    id: number;
    name: string;
    country: string;
    imageUrl: string;
    description: string;
    tag: string;
    tagColor: string;
    /** 修复 O24：数据来源标注（llm = AI 生成，仅供参考） */
    dataSource?: string;
}

export interface DestinationDetail {
    id: number;
    name: string;
    country: string;
    location: string;
    imageUrl: string;
    description: string;
    rating: number;
    reviewCount: number;
    duration: string;
    groupSize: string;
    difficulty: string;
    price: number;
    tags: string[];
    highlights: {
        icon: string;
        title: string;
        description: string;
    }[];
    /** 修复 O24：数据来源标注（llm = AI 生成，价格/评分为估算值） */
    dataSource?: string;
    /** 当前登录用户视角的用户评分均值（可 null，无评价时为空） */
    userAvgRating?: number | null;
    /** 用户评价条数 */
    userReviewCount?: number;
}

// 目的地评价
export interface DestinationReview {
    id: number;
    destinationId: number;
    userId: number;
    username: string;
    avatar?: string;
    rating: number;
    content: string;
    createTime: string;
    /** 是否当前登录用户自己的评价 */
    mine: boolean;
}

export interface ReviewListResponse {
    list: DestinationReview[];
    total: number;
    page: number;
    size: number;
}

export interface SaveReviewRequest {
    destinationId: number;
    rating: number;
    content: string;
}

// 获取评价列表（分页）
export const getDestinationReviews = (
    destinationId: number,
    page: number = 1,
    size: number = 10
): Promise<ReviewListResponse> => {
    return api.get('/destination/review/list', { params: { destinationId, page, size } });
};

// 发表评价（rating 1-5）
export const addDestinationReview = (data: SaveReviewRequest): Promise<DestinationReview> => {
    return api.post('/destination/review', data);
};

// 修改自己的评价
export const updateDestinationReview = (id: number, data: SaveReviewRequest): Promise<DestinationReview> => {
    return api.put(`/destination/review/${id}`, data);
};

// 删除自己的评价
export const deleteDestinationReview = (id: number): Promise<boolean> => {
    return api.delete(`/destination/review/${id}`);
};

// 获取精选目的地列表
export const getFeaturedDestinations = (limit?: number): Promise<Destination[]> => {
    return api.get('/destination/featured', { params: { limit } });
};

// 获取目的地详情
export const getDestinationDetail = (id: number): Promise<DestinationDetail> => {
    return api.get(`/destination/${id}`);
};
