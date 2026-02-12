import { BaseQueryApi, FetchArgs, fetchBaseQuery } from "@reduxjs/toolkit/query";
import { startLoading, stopLoading } from "../layout/uiSlice";
import { toast } from "react-toastify";
import { router } from "../routes/Routes";

const ensureTrailingSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`);

const apiBaseUrl = ensureTrailingSlash(
    (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/'
);

const customBaseQuery = fetchBaseQuery({
    baseUrl: apiBaseUrl,
    credentials: 'include'
});

type ValidationErrors = Record<string, string[]>;
type ErrorResponse = string | { title?: string; errors?: ValidationErrors };

const sleep = () => new Promise(resolve => setTimeout(resolve, 1000));

export const baseQueryWithErrorHandling = async (args: string | FetchArgs, api: BaseQueryApi,
    extraOptions: Record<string, unknown>) => {
    const requestUrl = typeof args === 'string' ? args : (args.url ?? '');
    const suppressGlobalLoading = requestUrl.startsWith('notifications');

    if (!suppressGlobalLoading) {
        api.dispatch(startLoading());
    }
    if (import.meta.env.DEV) await sleep();
    const result = await customBaseQuery(args, api, extraOptions);
    if (!suppressGlobalLoading) {
        api.dispatch(stopLoading());
    }
    if (result.error) {
        console.log(result.error);

        const originalStatus = result.error.status === 'PARSING_ERROR' && result.error.originalStatus
            ? result.error.originalStatus
            : result.error.status

        const responseData = result.error.data as ErrorResponse | null | undefined;

        switch (originalStatus) {
            case 400:
                if (typeof responseData === 'string') {
                    toast.error(responseData);
                } else if (responseData && typeof responseData === 'object' && responseData.errors) {
                    throw Object.values(responseData.errors).flat().join(', ');
                } else if (responseData && typeof responseData === 'object' && responseData.title) {
                    toast.error(responseData.title);
                } else {
                    toast.error('Bad Request');
                }
                break;
            case 401:
                if (responseData && typeof responseData === 'object' && responseData.title) {
                    toast.error(responseData.title);
                } else {
                    toast.error('Unauthorized. Please sign in.');
                }
                break;
            case 403:
                if (responseData && typeof responseData === 'object')
                    toast.error('403 Forbidden');
                else
                    toast.error('Forbidden');
                break;
            case 404:
                if (responseData && typeof responseData === 'object' && 'title' in responseData)
                    router.navigate('/not-found')
                else
                    router.navigate('/not-found')
                break;
            case 500:
                if (responseData && typeof responseData === 'object')
                    router.navigate('/server-error', { state: { error: responseData } })
                else
                    router.navigate('/server-error')
                break;
            default:
                break;
        }
    }

    return result;
}