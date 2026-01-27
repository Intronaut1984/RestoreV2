import { debounce, InputAdornment, TextField } from "@mui/material";
import type { SxProps, Theme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { useAppDispatch, useAppSelector } from "../../app/store/store";
import { setSearchTerm } from "./catalogSlice";
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

type Props = {
    sx?: SxProps<Theme>;
};

export default function Search({ sx }: Props) {
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
            placeholder="Pesquisar produtos"
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
                    navigate('/catalog');
                }
            }}
        />
    )
}