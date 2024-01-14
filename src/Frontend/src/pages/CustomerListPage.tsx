/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ButtonProps,
  MenuItem,
  TableCell,
  styled,
  tableCellClasses,
} from "@mui/material";

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, GridApi, GridColDef, GridCsvExportOptions, GridExportMenuItemProps, GridFilterModel, GridToolbarContainer, GridToolbarExport, GridToolbarExportContainer, getGridStringOperators, gridFilteredSortedRowIdsSelector, gridVisibleColumnFieldsSelector, useGridApiContext } from '@mui/x-data-grid';
import { useEffect, useState, useCallback, useMemo } from "react";


//https://mui.com/x/react-data-grid/filtering/customization/
interface CustomerListQuery {
  id: number;
  name: string;
  address: string;
  email: string;
  phone: string;
  iban: string;
  code: string;
  description: string;
}

export default function SupplierListPage() {

  const useDebouncedValue = (inputValue: any, delay: any) => {
    const [debouncedValue, setDebouncedValue] = useState(inputValue);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(inputValue);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [inputValue, delay]);

    return debouncedValue;
  };

  function CustomToolbar() {
    return (
      <GridToolbarContainer>
        <CustomExportButton />
      </GridToolbarContainer>
    );
  }


  const [list, setList] = useState<CustomerListQuery[]>([]);

  const [queryOptions, setQueryOptions] = useState({} as any);

  const [filterItem, setFilterItem] = useState({} as any);

  const [allFilters, setAllFilters] = useState([] as any[]);

  const [isLoading, setIsLoading] = useState(false);

  const [resetFilter, setResetFilter] = useState(false);


  const [removedFilter, setRemovedFilter] = useState({} as any);

  const debouncedSearchTerm = useDebouncedValue(filterItem, 500);

  const onFilterChange = useCallback((filterModel: GridFilterModel) => {
    if (!filterModel.items) {
      console.log('cleaer all filters');
      setResetFilter(true);
      return;
    }
    const removed = filterModel.items.filter((f: any) => !f.value && f.fromInput);
    if (removed && removed.length > 0) {
      console.log('removed filter', removed);
      setRemovedFilter(removed[0]);
      return;
    }
    setQueryOptions({ filterModel: { ...filterModel } });
  }, []);

  useEffect(() => {
    if (resetFilter === true) {
      setResetFilter(false);
    }
  }, [resetFilter]);

  useEffect(() => {
    if (removedFilter) {
      console.log("removed filter", removedFilter, allFilters);
      const filtered = allFilters.filter((f: any) => f.field === removedFilter.field);
      if (filtered && filtered.length > 0) {
        console.log("removed filter", filtered);
        const fromUnchanged = allFilters.filter((f: any) => f.field !== removedFilter.field);
        setAllFilters([...fromUnchanged]);
      }

    }
  }, [removedFilter]);

  useEffect(() => {
    if (!queryOptions) {
      return;
    }
    if (queryOptions.filterModel) {
      const filterItem = queryOptions.filterModel.items.map((i: any) => {
        return {
          field: i.field,
          value: i.value
        }
      }).filter((i: any) => i && i.value && i.value.length > 0);
      setFilterItem(filterItem);
    }
  }, [queryOptions]);

  useEffect(() => {
    const filter = debouncedSearchTerm[0];
    if (!filter) {
      return;
    }
    let found = allFilters.find((f: any) => f.field === filter.field);
    if (found) {
      found = filter;
      const fromUnchanged = allFilters.filter((f: any) => f.field !== filter.field);
      fromUnchanged.push(found);
      setAllFilters([...fromUnchanged]);
    }
    else {
      allFilters.push(filter);
      setAllFilters([...allFilters]);

    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const query = allFilters.map((f: any) => {
      return `${f.field}=${f.value}`;
    }).join('&');
    const resource = encodeURI(`/api/customers/list?${query}`);
    setIsLoading(true);
    fetch(resource)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setList(data as CustomerListQuery[]);
        setIsLoading(false);
      });

  }, [allFilters]);

  useEffect(() => {
    let ignore = false;
    if (list.length > 0 || allFilters.length > 0) {
      return;
    }
    fetch("/api/customers/list")
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (!ignore) setList(data as CustomerListQuery[]);
      });
    return () => { ignore = true }
  }, [list]);

  const dataColumns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 0.2, filterable: true, sortable: false, hideable: false },
    { field: 'email', headerName: 'Email', flex: 0.20, filterable: true, sortable: false, hideable: false },
    { field: 'address', headerName: 'Address', flex: 0.2, filterable: false, disableColumnMenu: true },
    { field: 'phone', headerName: 'Phone', filterable: false, disableColumnMenu: true },
    { field: 'iban', headerName: 'Iban', filterable: false, disableColumnMenu: true },
    { field: 'code', headerName: 'CatCode', filterable: false, disableColumnMenu: true },
    { field: 'description', headerName: 'CatDescription', filterable: false, disableColumnMenu: true },
  ];

  const columns = useMemo(
    () =>
      dataColumns.map((col) => {

        return {
          ...col,
          filterOperators: getGridStringOperators().filter(
            (operator) => {
              return operator.value === 'contains'
            }
          ),
        };
      }),
    [dataColumns],
  );

  const getJson = (apiRef: React.MutableRefObject<GridApi>) => {
    // Select rows and columns
    const filteredSortedRowIds = gridFilteredSortedRowIdsSelector(apiRef);
    const visibleColumnsField = gridVisibleColumnFieldsSelector(apiRef);

    // Format the data. Here we only keep the value
    const data = filteredSortedRowIds.map((id) => {
      const row: Record<string, any> = {};
      visibleColumnsField.forEach((field) => {
        row[field] = apiRef.current.getCellParams(id, field).value;
      });
      return row;
    });

    // Stringify with some indentation
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#parameters
    return JSON.stringify(data, null, 2);
  };

  const exportBlob = (blob: Blob, filename: string) => {
    // Save the blob in a json file
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    });
  };

  function JsonExportMenuItem(props: GridExportMenuItemProps<{}>) {
    const apiRef = useGridApiContext();

    const { hideMenu } = props;

    return (
      <MenuItem
        onClick={() => {
          const jsonString = getJson(apiRef);
          const blob = new Blob([jsonString], {
            type: 'text/json',
          });
          exportBlob(blob, 'DataGrid_demo.json');

          // Hide the export menu after the export
          hideMenu?.();
        }}
      >
        Export as XML
      </MenuItem>
    );
  }

  const csvOptions: GridCsvExportOptions = { delimiter: ';' };

  function CustomExportButton(props: ButtonProps) {
    return (
      <GridToolbarExportContainer {...props}>
        <JsonExportMenuItem />
      </GridToolbarExportContainer>
    );
  }

  return (
    <>
      <Typography variant="h4" sx={{ textAlign: "center", mt: 4, mb: 4 }}>
        Customers
      </Typography>

      <List>
        {allFilters.length > 0 ? <h4>Applied filters</h4> : <></>}
        {allFilters.map((f: any) =>
          <ListItem
            key={f.field}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={()=>setRemovedFilter(f)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemAvatar>
              <Avatar>
                <FolderIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={f.field}
              secondary={f.value}
            />
          </ListItem>,
        )}
      </List>

      <div style={{ height: 800, width: '100%' }}>
        <DataGrid
          rows={list} columns={columns}
          filterMode="server"
          loading={isLoading}
          slots={{ toolbar: CustomToolbar }}
          initialState={{
            filter: {
              filterModel: {
                items: [
                  { id: 'name', field: 'name', operator: 'contains', value: "" },
                ]
              },
            },
          }}
          onFilterModelChange={onFilterChange}
        />
      </div>

    </>
  );
}
