import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../layout/App";
import HomePage from "../../features/home/HomePage";
import Catalog from "../../features/catalog/Catalog";
import ProductDetails from "../../features/catalog/ProductDetails";
import AboutPage from "../../features/about/AboutPage";
import ContactPage from "../../features/contact/ContactPage";
import ServerError from "../errors/ServerError";
import NotFound from "../errors/NotFound";
import PrivacyPolicy from "../errors/PrivacyPolicy";
import Terms from "../errors/Terms";
import ReturnPolicy from "../errors/ReturnPolicy";
import BasketPage from "../../features/basket/BasketPage";
import CheckoutPage from "../../features/checkout/CheckoutPage";
import LoginForm from "../../features/account/LoginForm";
import RegisterForm from "../../features/account/RegisterForm";
import RequireAuth from "./RequireAuth";
import CheckoutSuccess from "../../features/checkout/CheckoutSuccess";
import OrdersPage from "../../features/orders/OrdersPage";
import OrderDetailedPage from "../../features/orders/OrderDetailedPage";
import InventoryPage from "../../features/admin/InventoryPage";
import AdminPanel from "../../features/admin/AdminPanel";
import AdminPromo from "../../features/admin/AdminPromo";
import AdminLogo from "../../features/admin/AdminLogo";
import AdminContact from "../../features/admin/AdminContact";
import HeroBlocksAdmin from "../../features/admin/HeroBlocksAdmin";
import ProfilePage from "../../features/account/ProfilePage";
import ForgotPassword from "../../features/account/ForgotPassword";
import ResetPassword from "../../features/account/ResetPassword";

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            {element: <RequireAuth />, children: [
                {path: 'checkout', element: <CheckoutPage />},
                {path: 'checkout/success', element: <CheckoutSuccess />},
                {path: 'profile', element: <ProfilePage />},
                {path: 'orders', element: <OrdersPage />},
                {path: 'orders/:id', element: <OrderDetailedPage />},
                {path: 'inventory', element: <InventoryPage />},
                {path: 'admin/users', element: <AdminPanel />},
                {path: 'admin/heroblocks', element: <HeroBlocksAdmin />},
                {path: 'admin/promo', element: <AdminPromo />},
                {path: 'admin/logo', element: <AdminLogo />},
                {path: 'admin/contact', element: <AdminContact />},
            ]},
            {path: '', element: <HomePage />},
            {path: 'catalog', element: <Catalog />},
            {path: 'catalog/:id', element: <ProductDetails />},
            {path: 'about', element: <AboutPage />},
            {path: 'contact', element: <ContactPage />},
            {path: 'privacy-policy', element: <PrivacyPolicy />},
            {path: 'terms', element: <Terms />},
            {path: 'return-policy', element: <ReturnPolicy />},
            {path: 'basket', element: <BasketPage />},
            {path: 'server-error', element: <ServerError />},
            {path: 'login', element: <LoginForm />},
            {path: 'forgot-password', element: <ForgotPassword />},
            {path: 'register', element: <RegisterForm />},
            {path: 'reset-password', element: <ResetPassword />},
            {path: 'not-found', element: <NotFound />},
            {path: '*', element: <Navigate replace to='/not-found' />}
        ]
    }
], {
    future: {
        v7_relativeSplatPath: true,
        v7_fetcherPersist: true,
        v7_normalizeFormMethod: true,
        v7_partialHydration: true,
        v7_skipActionErrorRevalidation: true
    }
})