import api from './api';

export interface Order {
    orderId: number;
    orderNo: string;
    productName: string;
    productImage: string;
    totalAmount: number;
    status: 'pending_payment' | 'pending_travel' | 'completed' | 'refund';
    createTime: string;
}

export interface OrderDetail extends Order {
    travelers: number;
    startDate: string;
    contactName: string;
    contactPhone: string;
}

export interface OrderListResponse {
    list: Order[];
    total: number;
}

export interface CreateOrderRequest {
    productId: number;
    productType: 'destination' | 'package';
    travelers: number;
    startDate: string;
    contactName: string;
    contactPhone: string;
}

export interface CreateOrderResponse {
    orderId: number;
    orderNo: string;
    totalAmount: number;
    status: string;
    createTime: string;
}

// 创建订单
export const createOrder = (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    return api.post('/order/create', data);
};

// 获取订单列表
export const getOrderList = (
    status?: string,
    page: number = 1,
    size: number = 10
): Promise<OrderListResponse> => {
    return api.get('/order/list', { params: { status, page, size } });
};

// 获取订单详情
export const getOrderDetail = (orderId: number): Promise<OrderDetail> => {
    return api.get(`/order/${orderId}`);
};

// 取消订单
export const cancelOrder = (orderId: number, reason?: string): Promise<boolean> => {
    return api.post(`/order/${orderId}/cancel`, { reason });
};
