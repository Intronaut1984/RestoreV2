import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserInfoQuery } from "../../features/account/accountApi"

export default function RequireAuth() {
    const {data: user, isLoading} = useUserInfoQuery();
    const location = useLocation();

    if (isLoading) return <div>Loading...</div>

    if (!user) {
        return <Navigate to='/login' state={{from: location}} />
    }

    const adminRoutePrefixes = [
        '/inventory',
        '/admin-dashboard',
        '/admin/users',
        '/admin/promo',
        '/admin/logo',
        '/admin/heroblocks',
        '/admin/analytics',
        '/admin/newsletters'
    ]

    if (adminRoutePrefixes.some(p => location.pathname.startsWith(p)) && !user.roles.includes('Admin')) {
        return <Navigate to='/' replace />
    }

    return (
        <Outlet />
    )
}