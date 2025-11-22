import { UploadFile } from "@mui/icons-material";
import { FormControl, FormHelperText, Typography } from "@mui/material";
import { useCallback } from "react";
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

    const { getRootProps, getInputProps, isDragActive } = useDropzone({onDrop});

    const baseSx = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'dashed 2px',
        borderColor: '#767676',
        borderRadius: 1,
        pt: 3,
        px: 2,
        height: { xs: 140, sm: 180, md: 200 },
        width: '100%',
        maxWidth: 500,
        boxSizing: 'border-box',
        textAlign: 'center'
    } as const;

    const activeSx = {
        borderColor: 'green'
    } as const;

    return (
       <div {...getRootProps()}>
        <FormControl 
            sx={isDragActive ? {...baseSx, ...activeSx} : baseSx}
            error={!!fieldState.error}
        >
            <input {...getInputProps()} />
            <UploadFile sx={{fontSize: { xs: 48, sm: 80, md: 100 }, color: 'action.active'}} />
            <Typography variant="h6" sx={{mt: 1}}>Drop image here</Typography>
            <FormHelperText>{fieldState.error?.message}</FormHelperText>
        </FormControl>
       </div>
    )
}