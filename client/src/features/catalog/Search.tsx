import { debounce, InputAdornment, TextField } from "@mui/material";
import type { SxProps, Theme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import { setSearchTerm } from "./catalogSlice";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

type Props = {
    sx?: SxProps<Theme>;
    navigateTo?: string | false;
    placeholder?: string;
};

export default function Search({ sx, navigateTo = '/catalog', placeholder = 'Pesquisar produtos' }: Props) {
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
        if (navigateTo) navigate(navigateTo);
    }, 500)

    return (
        <TextField
            placeholder={placeholder}
            variant="outlined"
            size="small"
            fullWidth
            type="search"
            value={term}
            sx={sx}
            inputProps={{ 'aria-label': 'Pesquisar produtos' }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                    </InputAdornment>
                ),
            }}
            onChange={e => {
                setTerm(e.target.value);
                debouncedSearch(e);
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    dispatch(setSearchTerm((e.target as HTMLInputElement).value));
                    if (navigateTo) navigate(navigateTo);
                }
            }}
        />
    )
}