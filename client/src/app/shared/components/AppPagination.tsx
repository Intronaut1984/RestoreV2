import { Box, Pagination, Typography, useTheme, useMediaQuery } from "@mui/material";
import { Pagination as PaginationType } from "../../models/pagination";

type Props = {
    metadata: PaginationType
    onPageChange: (page: number) => void
}

export default function AppPagination({ metadata, onPageChange }: Props) {
    const {currentPage, totalPages, pageSize, totalCount} = metadata;

    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount)

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 3,
                gap: 2
            }}
        >
            <Typography>
                {isSmall ? `Mostrar ${startItem}-${endItem} de ${totalCount}` : `Mostrar ${startItem}-${endItem} de ${totalCount} produtos`}
            </Typography>
            <Pagination
                color="secondary"
                size={isSmall ? "small" : "medium"}
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => onPageChange(page)}
                sx={theme.palette.mode === 'light' ? {
                    '& .MuiPaginationItem-root': {
                        color: 'warning.dark',
                        borderColor: 'rgba(0,0,0,0.12)'
                    },
                    '& .MuiPaginationItem-root.Mui-selected': {
                        bgcolor: 'warning.main',
                        color: 'common.black',
                        '&:hover': { bgcolor: 'warning.dark' }
                    }
                } : undefined}
            />
        </Box>
    )
}