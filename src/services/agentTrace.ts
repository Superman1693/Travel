import api from './api';

/** 修复 O23：Agent 过程回溯条目 */
export interface AgentTraceItem {
    id: number;
    runId: string;
    step: number;
    eventType: string;
    content: string;
    createTime: string;
}

// 修复 O23：查询某次 Agent 任务的完整过程（需后端开启 app.trace.persist-enabled）
export const getAgentTrace = (runId: string): Promise<AgentTraceItem[]> => {
    return api.get('/ai/trace', { params: { runId } });
};
