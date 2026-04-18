import api from './api';

export interface Destination {
    id: number;
    name: string;
    country: string;
    imageUrl: string;
    description: string;
    tag: string;
    tagColor: string;
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
}

// 获取精选目的地列表
export const getFeaturedDestinations = (limit?: number): Promise<Destination[]> => {
    return api.get('/destination/featured', { params: { limit } });
};

// 获取目的地详情
export const getDestinationDetail = (id: number): Promise<DestinationDetail> => {
    return api.get(`/destination/${id}`);
};
