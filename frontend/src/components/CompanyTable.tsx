import { Button } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { getCollectionsById, ICompany , addCompanyToList, removeCompanyFromList} from "../utils/jam-api";

const CompanyTable = (props: { selectedCollectionId: string }) => {
  const [response, setResponse] = useState<ICompany[]>([]);
  const [total, setTotal] = useState<number>();
  const [offset, setOffset] = useState<number>(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  useEffect(() => {
    getCollectionsById(props.selectedCollectionId, offset, pageSize).then(
      (newResponse) => {
        setResponse(newResponse.companies);
        setTotal(newResponse.total);
      }
    );
  }, [props.selectedCollectionId, offset, pageSize]);

  useEffect(() => {
    setOffset(0);
  }, [props.selectedCollectionId]);

  const handleAddToLikedCompanies = async () => {
    if (selectedRows.length > 0) {
      try {
        await Promise.all(
          selectedRows.map(companyId =>
            addCompanyToList(companyId, "Liked Companies List")  // Add each selected company to "Liked Companies List"
          )
        );
        alert("Companies added to 'Liked Companies List'");
      } catch (error) {
        console.error("Error adding companies:", error);
      }
    }
  };

  const handleRemoveFromCurrentList = async () => {
    if (selectedRows.length > 0) {
      try {
        await Promise.all(
          selectedRows.map(companyId =>
            removeCompanyFromList(companyId, props.selectedCollectionId)
          )
        );
        alert("Companies removed from the current list");
      } catch (error) {
        console.error("Error removing companies:", error);
      }
    }
  };

  return (
    <div style={{ height: 600, width: "100%" }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleAddToLikedCompanies}
        disabled={selectedRows.length === 0}  // Disable if no company is selected
        style={{ marginBottom: 10 }}
      >
        Add to Liked Companies
      </Button>

      {/* Remove from Current List Button */}
      <Button
        variant="contained"
        color="secondary"
        onClick={handleRemoveFromCurrentList}
        disabled={selectedRows.length === 0}  // Disable if no company is selected
        style={{ marginBottom: 10 }}
      >
        Remove from Current List
      </Button>

      <DataGrid
        rows={response}
        rowHeight={30}
        columns={[
          { field: "liked", headerName: "Liked", width: 90 },
          { field: "id", headerName: "ID", width: 90 },
          { field: "company_name", headerName: "Company Name", width: 200 },
        ]}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 },
          },
        }}
        rowCount={total}
        pagination
        checkboxSelection
        paginationMode="server"
        onPaginationModelChange={(newMeta) => {
          setPageSize(newMeta.pageSize);
          setOffset(newMeta.page * newMeta.pageSize);
        }}
        onRowSelectionModelChange={(newSelection) => {
          setSelectedRows(newSelection as number[]);  // Update selected rows
        }}
      />
    </div>
  );
};

export default CompanyTable;