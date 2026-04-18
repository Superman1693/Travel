import api from './api';

export interface SearchResult {
    id: number;
    type: 'destination' | 'recommendation';
    name: string;
    description: string;
    imageUrl: string;
    price?: number;
}

export interface SearchResponse {
    list: SearchResult[];
    total: number;
}

// 综合搜索
export const search = (
    keyword: string,
    type: 'destination' | 'recommendation' | 'all' = 'all',
    page: number = 1,
    size: number = 10
): Promise<SearchResponse> => {
    return api.get('/search', { params: { keyword, type, page, size } });
};
