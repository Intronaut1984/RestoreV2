import { BaseQueryApi, FetchArgs, fetchBaseQuery } from "@reduxjs/toolkit/query";
import { startLoading, stopLoading } from "../layout/uiSlice";
import { toast } from "react-toastify";
import { router } from "../routes/Routes";

const customBaseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: 'include'
});

type ErrorResponse = | string | { title: string } | { errors: string[] };

const sleep = () => new Promise(resolve => setTimeout(resolve, 1000));

export const baseQueryWithErrorHandling = async (args: string | FetchArgs, api: BaseQueryApi,
    extraOptions: object) => {
    api.dispatch(startLoading());
    if (import.meta.env.DEV) await sleep();
    const result = await customBaseQuery(args, api, extraOptions);
    api.dispatch(stopLoading());
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
                } else if (responseData && typeof responseData === 'object' && 'errors' in responseData) {
                    throw Object.values((responseData as any).errors).flat().join(', ')
                } else if (responseData && typeof responseData === 'object' && 'title' in responseData) {
                    toast.error((responseData as any).title);
                } else {
                    toast.error('Bad Request');
                }
                break;
            case 401:
                if (responseData && typeof responseData === 'object' && 'title' in responseData) {
                    toast.error((responseData as any).title);
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