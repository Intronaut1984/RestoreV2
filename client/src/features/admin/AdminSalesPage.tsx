import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Skeleton,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import { emailToUsername, formatOrderAmount } from "../../lib/util";
import { useFetchAllSalesQuery } from "../orders/orderApi";
import AppPagination from "../../app/shared/components/AppPagination";
import { useState } from "react";
import { adminOrderStatusOptions, getOrderStatusLabel, getOrderStatusSx } from "../../lib/orderStatus";
import { useGetCategoriesQuery } from "./adminApi";

export default function AdminSalesPage() {
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;

  const [buyerEmail, setBuyerEmail] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [preset, setPreset] = useState<"7d" | "30d" | "90d" | "">("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const { data: categories = [] } = useGetCategoriesQuery();

  const { data, isLoading } = useFetchAllSalesQuery({
    pageNumber,
    pageSize,
    buyerEmail: buyerEmail.trim() ? buyerEmail.trim() : undefined,
    status: status || undefined,
    categoryId: typeof categoryId === "number" ? categoryId : undefined,
    from: from || undefined,
    to: to || undefined,
  });
  const navigate = useNavigate();

  const applyPreset = (p: "7d" | "30d" | "90d") => {
    const end = new Date();
    const start = subDays(end, p === "7d" ? 7 : p === "30d" ? 30 : 90);
    setPreset(p);
    setFrom(format(start, "yyyy-MM-dd"));
    setTo(format(end, "yyyy-MM-dd"));
    setPageNumber(1);
  };

  const clearFilters = () => {
    setBuyerEmail("");
    setStatus("");
    setCategoryId("");
    setPreset("");
    setFrom("");
    setTo("");
    setPageNumber(1);
  };

  if (isLoading)
    return (
      <Container maxWidth="md">
        <Box sx={{ width: "100%", py: { xs: 6, md: 8 } }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <CircularProgress size={48} />
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Encomenda</TableCell>
                <TableCell>Produto</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Desconto</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell align="center">
                    <Skeleton variant="rectangular" width={64} height={32} />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="70%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="80%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="60%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="40%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="40%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton width="40%" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Container>
    );

  if (!data) return <Typography variant="h5">Sem vendas</Typography>;

  const orders = data.items;

  return (
    <Container maxWidth="md">
      <Typography variant="h6" align="center" gutterBottom sx={{ mb: 1 }}>
        Todas as Vendas
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button
            size="small"
            variant={preset === "7d" ? "contained" : "outlined"}
            onClick={() => applyPreset("7d")}
          >
            7d
          </Button>
          <Button
            size="small"
            variant={preset === "30d" ? "contained" : "outlined"}
            onClick={() => applyPreset("30d")}
          >
            30d
          </Button>
          <Button
            size="small"
            variant={preset === "90d" ? "contained" : "outlined"}
            onClick={() => applyPreset("90d")}
          >
            90d
          </Button>

          <Button size="small" variant="text" onClick={clearFilters}>
            Limpar
          </Button>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <TextField
            size="small"
            label="Cliente (email)"
            value={buyerEmail}
            onChange={(e) => {
              setBuyerEmail(e.target.value);
              setPageNumber(1);
            }}
            sx={{ minWidth: 220 }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={status}
              onChange={(e) => {
                setStatus(String(e.target.value));
                setPageNumber(1);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {adminOrderStatusOptions.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Categoria</InputLabel>
            <Select
              label="Categoria"
              value={categoryId}
              onChange={(e) => {
                const raw = e.target.value;
                setCategoryId(raw === "" ? "" : Number(raw));
                setPageNumber(1);
              }}
            >
              <MenuItem value="">Todas</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="De"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPreset("");
              setPageNumber(1);
            }}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            size="small"
            label="Até"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPreset("");
              setPageNumber(1);
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Box>

      <Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Encomenda</TableCell>
              <TableCell>Produto</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Desconto</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                hover
                onClick={() => navigate(`/admin/sales/${order.id}`)}
                style={{ cursor: "pointer" }}
              >
                <TableCell align="center">
                  <Box
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1,
                      display: "inline-block",
                    }}
                  >
                    # {order.id}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1, display: 'inline-block', minWidth: 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {order.orderItems?.[0]?.pictureUrl && (
                        <img
                          src={order.orderItems[0].pictureUrl}
                          alt={order.orderItems[0].name}
                          style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
                        />
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap>
                          {order.orderItems?.[0]?.name ?? '-'}
                        </Typography>
                        {order.orderItems && order.orderItems.length > 1 && (
                          <Typography variant="caption" color="text.secondary">
                            +{order.orderItems.length - 1} artigo(s)
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1,
                      display: "inline-block",
                    }}
                  >
                    {emailToUsername(order.buyerEmail)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1,
                      display: "inline-block",
                    }}
                  >
                    {format(order.orderDate, "dd MMM yyyy")}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1,
                      display: "inline-block",
                      color:
                        order.productDiscount + order.discount > 0
                          ? "green"
                          : "inherit",
                    }}
                  >
                    {order.productDiscount + order.discount > 0
                      ? formatOrderAmount(order.productDiscount + order.discount)
                      : "-"}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 2,
                      p: 1,
                      display: "inline-block",
                    }}
                  >
                    {formatOrderAmount(order.total)}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box
                    sx={{
                      border: 1,
                      borderRadius: 2,
                      p: 1,
                      display: "inline-block",
                      ...getOrderStatusSx(order.orderStatus),
                    }}
                  >
                    {getOrderStatusLabel(order.orderStatus)}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {data.pagination && orders.length > 0 && (
          <Box sx={{ p: 3 }}>
            <AppPagination
              metadata={data.pagination}
              onPageChange={(page: number) => setPageNumber(page)}
            />
          </Box>
        )}
      </Box>
    </Container>
  );
}
