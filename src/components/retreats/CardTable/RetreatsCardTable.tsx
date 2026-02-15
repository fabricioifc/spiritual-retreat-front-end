"use client";
import { ReactNode, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Pagination,
  Stack,
  Popover,
  MenuList,
  MenuItem,
  ListItemText,
} from "@mui/material";
import Iconify from "../../Iconify";
import { RetreatSimple } from "../types";
import { useRetreatsTableContext } from "../context";

interface RetreatsCardTableProps {
  children?: (retreat: RetreatSimple) => ReactNode;
}

interface DefaultRetreatCardItemProps {
  retreat: RetreatSimple;
}

export function DefaultRetreatCardItem({ retreat }: DefaultRetreatCardItemProps) {
  const { onEdit, onView } = useRetreatsTableContext();

  return (
    <Box
      sx={{
        width: 263,
        borderRadius: "8px",
        borderColor: "divider",
        borderStyle: "solid",
        borderWidth: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          height: 304,
          position: "relative",
          borderColor: "divider",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          backgroundImage: `url(${retreat.image || "/public/images/retreats/retreat-1.jpg"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            borderRadius: "8px 8px 0 0",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.55) 5%, rgba(255, 255, 255, 0) 100%)",
            zIndex: 1,
          }}
        />
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            p: 2,
            color: "common.white",
          }}
        >
          <Typography variant="h6" component="div" gutterBottom>
            {retreat.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Iconify
              icon="solar:map-point-bold"
              sx={{ color: "common.white", mr: 0.5 }}
            />
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          p: 2,
          pb: 1,
          borderRadius: "0 0 8px 8px",
          backgroundColor: "background.paper",
          display: "flex",
          alignContent: "center",
          justifyContent: "space-between",
        }}
      >
        <Button
          size="medium"
          variant="outlined"
          sx={{
            width: 100,
            backgroundColor: "primary.main",
            color: "white",
            borderColor: "primary.main",
            "&:hover": {
              backgroundColor: "primary.dark",
              borderColor: "primary.dark",
            },
          }}
          onClick={() => onView(retreat.id)}
        >
          Visão Geral
        </Button>
        <Button
          sx={{ width: 100 }}
          size="medium"
          variant="outlined"
          onClick={() => onEdit(retreat.id)}
        >
          Ver Mais
        </Button>
      </Box>
    </Box>
  );
}

export default function RetreatsCardTable({ children }: RetreatsCardTableProps) {
  const { loading, data, total, filters, onFiltersChange } = useRetreatsTableContext();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handlePageLimitChange = (newPageLimit: number) => {
    onFiltersChange({ pageLimit: newPageLimit });
    handlePopoverClose();
  };

  const open = Boolean(anchorEl);

  const page = filters.page || 1; // 1-based externo
  const pageLimit = filters.pageLimit || 8;
  const totalItems = total ?? data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageLimit));
  const renderRetreat = children ?? ((retreat: RetreatSimple) => <DefaultRetreatCardItem retreat={retreat} />);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0, // importante para permitir o overflow interno
      }}
    >
      {/* Card grid */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0, // importante para permitir o overflow interno
          overflowY: "auto",
          pr: 0.5,
          pb: 2,
        }}
      >
        <Grid container spacing={3}>
          {loading ? (
            <Typography>Loading retreats...</Typography>
          ) : (
            data.map((retreat) => (
              <Grid
                key={retreat.id}
                size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
                display={"flex"}
                justifyContent={"center"}
              >
                {renderRetreat(retreat)}
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Pagination controls */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems="center"
        mt={4}
      >
        <Button
          variant="outlined"
          size="small"
          endIcon={<Iconify icon="solar:alt-arrow-down-linear" />}
          onClick={handlePopoverOpen}
          sx={{ minWidth: 120 }}
        >
          {filters.pageLimit || 8} por página
        </Button>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <MenuList>
            <MenuItem onClick={() => handlePageLimitChange(4)}>
              <ListItemText primary="4 por página" />
            </MenuItem>
            <MenuItem onClick={() => handlePageLimitChange(8)}>
              <ListItemText primary="8 por página" />
            </MenuItem>
            <MenuItem onClick={() => handlePageLimitChange(12)}>
              <ListItemText primary="12 por página" />
            </MenuItem>
            <MenuItem onClick={() => handlePageLimitChange(16)}>
              <ListItemText primary="16 por página" />
            </MenuItem>
          </MenuList>
        </Popover>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary" mr={2}>
            {page}-{Math.min(page * pageLimit, totalItems)} de {totalItems}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, nextPage) =>
              onFiltersChange({ ...filters, page: nextPage })
            }
            color="primary"
          />
        </Box>
      </Stack>
    </Box>
  );
}
