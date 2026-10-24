import api from './api';

/** 修复 O22：产物（行程单 PDF / 文本）元数据 */
export interface ArtifactItem {
    artifactId: string;
    name: string;
    size: number;
    createdAt: string;
    expiresAt: string;
    downloadUrl: string;
}

// 修复 O22：获取当前用户可下载的产物列表，用于「我的文件」回溯
export const getMyArtifacts = (): Promise<ArtifactItem[]> => {
    return api.get('/files/my-artifacts');
};
