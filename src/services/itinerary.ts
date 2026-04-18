import api from './api';

export interface ItineraryPlace {
    id: number;
    time: string;
    name: string;
    type: 'attraction' | 'restaurant' | 'hotel';
    imageUrl?: string;
    distance?: string;
    duration?: string;
    tags?: string[];
}

export interface ItineraryDay {
    dayNumber: number;
    date: string;
    places: ItineraryPlace[];
}

export interface Itinerary {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    travelers: number;
    destination: string;
    coverImage?: string;
    status?: string;
    createTime?: string;
}

export interface ItineraryDetail extends Itinerary {
    days: ItineraryDay[];
}

export interface CreateItineraryRequest {
    title: string;
    startDate: string;
    endDate: string;
    travelers: number;
    destination: string;
}

export interface AddPlaceRequest {
    dayNumber: number;
    time: string;
    name: string;
    type: 'attraction' | 'restaurant' | 'hotel';
    imageUrl?: string;
    distance?: string;
    duration?: string;
    tags?: string[];
}

// 创建行程
export const createItinerary = (data: CreateItineraryRequest): Promise<Itinerary> => {
    return api.post('/itinerary/create', data);
};

// 获取行程列表
export const getItineraryList = (status?: string): Promise<Itinerary[]> => {
    return api.get('/itinerary/list', { params: { status } });
};

// 获取行程详情
export const getItineraryDetail = (id: number): Promise<ItineraryDetail> => {
    return api.get(`/itinerary/${id}`);
};

// 添加行程地点
export const addPlace = (itineraryId: number, data: AddPlaceRequest): Promise<ItineraryPlace> => {
    return api.post(`/itinerary/${itineraryId}/place`, data);
};

// 删除行程地点
export const deletePlace = (placeId: number): Promise<boolean> => {
    return api.delete(`/itinerary/place/${placeId}`);
};
