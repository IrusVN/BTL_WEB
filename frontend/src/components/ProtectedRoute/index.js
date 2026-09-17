import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { showToast } from '../Toast/index.js';

/**
 * ProtectedRoute - Bộ điều phối phân quyền đa tầng (RBAC)
 *
 * @param {ReactNode} children - Component con được bảo vệ
 * @param {string} access - 'admin' | 'storefront' | 'guest-only'
 * @param {boolean} authRequired - Bắt buộc đăng nhập với các trang storefront cá nhân (cart, profile...)
 * @param {boolean} adminOnly - Tương thích ngược với các phiên bản cũ
 */
const ProtectedRoute = ({
    children,
    access = 'storefront',
    authRequired = false,
    adminOnly = false
}) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const effectiveAccess = adminOnly ? 'admin' : access;

    // Xác định điều kiện redirect và thông báo tương ứng
    let redirectDecision = null;

    if (!loading) {
        if (effectiveAccess === 'admin') {
            if (!user) {
                redirectDecision = {
                    target: '/login',
                    state: { from: location }
                };
            } else if (user.role !== 'admin') {
                redirectDecision = {
                    target: '/',
                    toast: {
                        title: 'Không có quyền truy cập',
                        message: 'Bạn không có quyền truy cập trang quản trị!',
                        type: 'error',
                        duration: 3500
                    }
                };
            }
        } else if (effectiveAccess === 'guest-only') {
            if (user) {
                redirectDecision = {
                    target: user.role === 'admin' ? '/admin' : '/'
                };
            }
        } else if (effectiveAccess === 'storefront') {
            if (user && user.role === 'admin') {
                redirectDecision = {
                    target: '/admin',
                    toast: {
                        title: 'Khu vực khách hàng',
                        message: 'Tài khoản Quản trị viên chỉ có quyền thao tác trong trang Quản trị!',
                        type: 'warning',
                        duration: 3500
                    }
                };
            } else if (authRequired && !user) {
                redirectDecision = {
                    target: '/login',
                    state: { from: location },
                    toast: {
                        title: 'Yêu cầu đăng nhập',
                        message: 'Vui lòng đăng nhập tài khoản để tiếp tục',
                        type: 'info',
                        duration: 3000
                    }
                };
            }
        }
    }

    const lastRedirectRef = useRef(null);

    useEffect(() => {
        if (redirectDecision) {
            const redirectKey = `${location.pathname}_to_${redirectDecision.target}`;
            if (lastRedirectRef.current !== redirectKey) {
                lastRedirectRef.current = redirectKey;
                if (redirectDecision.toast) {
                    showToast(redirectDecision.toast);
                }
                navigate(redirectDecision.target, {
                    replace: true,
                    state: redirectDecision.state
                });
            }
        }
    }, [redirectDecision, location.pathname, navigate]);

    // Trạng thái đang tải session/token ban đầu hoặc đang xử lý chuyển hướng
    if (loading || redirectDecision) {
        return (
            <div style={{
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                color: 'var(--color-text-secondary, #A1A1A6)'
            }}>
                <style>{`
                    @keyframes protectedRouteSpin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
                <div style={{
                    width: '38px',
                    height: '38px',
                    border: '3px solid rgba(212, 175, 55, 0.2)',
                    borderTopColor: 'var(--color-gold, #D4AF37)',
                    borderRadius: '50%',
                    animation: 'protectedRouteSpin 0.8s linear infinite'
                }} />
                <span style={{ fontSize: '1.4rem', fontWeight: 500 }}>
                    {loading ? 'Đang xác thực quyền truy cập...' : 'Đang chuyển hướng...'}
                </span>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
