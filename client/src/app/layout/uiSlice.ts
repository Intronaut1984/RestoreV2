import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Palette = { primary: string; secondary: string };
type ColorsState = { light: Palette; dark: Palette };

interface UIState {
    isLoading: boolean;
    darkMode: boolean;
    colors: ColorsState;
}

const getInitialDarkMode = () => {
    const storedDarkMode = localStorage.getItem('darkMode');
    return storedDarkMode ? JSON.parse(storedDarkMode) : true;
};

const getInitialColors = (): ColorsState => {
    const stored = localStorage.getItem('themeColors');
    if (stored) return JSON.parse(stored) as ColorsState;
    return {
        light: { primary: '#ffffffff', secondary: '#fafafaff' },
        dark: { primary: '#90caf9', secondary: '#ffcc80' }
    };
};

const initialState: UIState = {
    isLoading: false,
    darkMode: getInitialDarkMode(),
    colors: getInitialColors()
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        startLoading: (state) => { state.isLoading = true; },
        stopLoading: (state) => { state.isLoading = false; },
        setDarkMode: (state) => {
            localStorage.setItem('darkMode', JSON.stringify(!state.darkMode));
            state.darkMode = !state.darkMode;
        },
        setPaletteColor: (state, action: PayloadAction<{ mode: 'light'|'dark'; key: 'primary'|'secondary'; color: string }>) => {
            const { mode, key, color } = action.payload;
            state.colors[mode][key] = color;
            localStorage.setItem('themeColors', JSON.stringify(state.colors));
        }
    }
});

export const { startLoading, stopLoading, setDarkMode, setPaletteColor } = uiSlice.actions;
export default uiSlice.reducer;