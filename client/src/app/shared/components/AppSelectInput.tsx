import { FormControl, FormHelperText, TextField } from "@mui/material";
import Autocomplete from '@mui/material/Autocomplete';
import { AutocompleteProps } from '@mui/material/Autocomplete';
import { FieldValues, useController, UseControllerProps } from "react-hook-form"

type Props<T extends FieldValues> = {
    label: string
    name: keyof T
    items: string[]
    // whether the select should be searchable
    searchable?: boolean
} & UseControllerProps<T> & Partial<AutocompleteProps<string, false, false, false>>

export default function AppSelectInput<T extends FieldValues>(props: Props<T>) {
    const { name, control, rules } = props as UseControllerProps<T>;
    const { fieldState, field } = useController({ name, control, rules } as UseControllerProps<T>);

    return (
        <FormControl fullWidth error={!!fieldState.error}>
            <Autocomplete
                options={props.items}
                value={(field.value ?? undefined) as string | undefined}
                onChange={(_, value) => field.onChange(value as unknown as string | undefined)}
                freeSolo={false}
                renderInput={(params) => (
                    <TextField {...params} label={props.label} error={!!fieldState.error} helperText={fieldState.error?.message} />
                )}
                disableClearable
                {...(props.searchable ? { filterSelectedOptions: false } : {})}
            />
            <FormHelperText>{fieldState.error?.message}</FormHelperText>
        </FormControl>
    )
}