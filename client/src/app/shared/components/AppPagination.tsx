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
                {isSmall ? `Mostrar ${startItem}-${endItem} de ${totalCount}` : `Displaying ${startItem}-${endItem} of ${totalCount} items`}
            </Typography>
            <Pagination
                color="secondary"
                size={isSmall ? "small" : "medium"}
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => onPageChange(page)}
            />
        </Box>
    )
}