import { UploadFile } from "@mui/icons-material";
import { FormControl, FormHelperText, Typography } from "@mui/material";
import { useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { FieldValues, useController, UseControllerProps } from "react-hook-form"

type Props<T extends FieldValues> = {
    name: keyof T
} & UseControllerProps<T>

export default function AppDropzone<T extends FieldValues>(props: Props<T>) {
    const { fieldState, field } = useController({ ...props });

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const fileWithPreview = Object.assign(acceptedFiles[0], {
                preview: URL.createObjectURL(acceptedFiles[0])
            });

            field.onChange(fileWithPreview);
        }
    }, [field]);

    // Revoke previously created object URLs to avoid memory leaks
    useEffect(() => {
        const current = field.value as unknown as { preview?: string } | undefined;
        return () => {
            if (current?.preview) URL.revokeObjectURL(current.preview);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false,
        noKeyboard: true,
        // We'll open the picker ourselves on click.
        noClick: true,
    });

    const inputProps = getInputProps({
        // Some environments behave inconsistently with onDrop when selecting via file picker.
        // Hook into the input change so "select file" always sets the preview.
        onChange: (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                onDrop(Array.from(files));
            }
        },
        style: { display: 'none' }
    });

    const baseSx = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: 'dashed 2px',
        borderColor: '#767676',
        borderRadius: 1,
        pt: 3,
        px: 2,
        height: { xs: 140, sm: 180, md: 200 },
        width: '100%',
        maxWidth: 500,
        boxSizing: 'border-box',
        textAlign: 'center',
        '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.03)'
        }
    } as const;

    const activeSx = {
        borderColor: 'green'
    } as const;

    return (
        <FormControl
            {...getRootProps({
                onClick: open,
            })}
            sx={isDragActive ? { ...baseSx, ...activeSx } : baseSx}
            error={!!fieldState.error}
        >
            <input {...inputProps} />
            <UploadFile sx={{ fontSize: { xs: 48, sm: 80, md: 100 }, color: 'action.active' }} />
            <Typography variant="h6" sx={{ mt: 1 }}>Arrastar ou clicar para selecionar</Typography>
            <FormHelperText>{fieldState.error?.message}</FormHelperText>
        </FormControl>
    )
}