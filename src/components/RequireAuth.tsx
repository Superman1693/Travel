import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { buildLoginRedirectPath, hasValidToken } from '../utils/auth';

interface RequireAuthProps {
  // 修复 E3：React 19 已移除全局 JSX 命名空间，改用 ReactNode 类型
  children: ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const location = useLocation();

  if (!hasValidToken()) {
    const pathWithQuery = `${location.pathname}${location.search}`;
    return <Navigate to={buildLoginRedirectPath(pathWithQuery)} replace />;
  }

  return <>{children}</>;
}
