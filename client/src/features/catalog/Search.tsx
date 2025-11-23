import { debounce, TextField } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import { setSearchTerm } from "./catalogSlice";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

export default function Search() {
    const {searchTerm} = useAppSelector(state => state.catalog);
    const dispatch = useAppDispatch();
    const [term, setTerm] = useState(searchTerm);

    useEffect(() => {
        setTerm(searchTerm)
    }, [searchTerm]);

    const navigate = useNavigate();

    const debouncedSearch = debounce(event => {
        const value = event.target.value;
        dispatch(setSearchTerm(value))
        // navigate to catalog so results are visible when user searches from elsewhere
        navigate('/catalog');
    }, 500)

    return (
        <TextField
            label='Search products'
            variant="outlined"
            fullWidth
            type="search"
            value={term}
            onChange={e => {
                setTerm(e.target.value);
                debouncedSearch(e);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    dispatch(setSearchTerm((e.target as HTMLInputElement).value));
                    navigate('/catalog');
                }
            }}
        />
    )
}