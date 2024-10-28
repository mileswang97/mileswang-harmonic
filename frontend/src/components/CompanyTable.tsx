import { Button, LinearProgress } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import { getCollectionsById, ICompany, addCompanyToList, removeCompanyFromList, getAllCompanies } from "../utils/jam-api";

const CompanyTable = (props: { selectedCollectionId: string }) => {
  const [response, setResponse] = useState<ICompany[]>([]);
  const [total, setTotal] = useState<number>();
  const [offset, setOffset] = useState<number>(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [showProgressBar, setShowProgressBar] = useState<boolean>(false); 

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

  // Function to add selected companies to "Liked Companies List"
  const handleAddToLikedCompanies = async () => {
    if (selectedRows.length > 0) {
      const batchSize = 100;  // Define batch size
      const numBatches = Math.ceil(selectedRows.length / batchSize);
  
      setShowProgressBar(true);  // Show progress bar
      setProgress(0);  // Reset progress to 0
  
      let ws: WebSocket;  // Declare WebSocket variable outside to avoid multiple closures
  
      try {
        // Establish WebSocket connection
        ws = new WebSocket("ws://localhost:8000/ws/progress");
  
        ws.onopen = async () => {
          try {
            for (let i = 0; i < numBatches; i++) {
              // Create a batch of company IDs
              const companyBatch = selectedRows.slice(i * batchSize, (i + 1) * batchSize);
  
              // Add the companies to the "Liked Companies List" via API
              await Promise.all(
                companyBatch.map(companyId =>
                  addCompanyToList(companyId, "Liked Companies List")  // Actual API call to add companies
                )
              );
  
              // After the API call completes, send the progress update to WebSocket
              const progressPercentage = ((i + 1) / numBatches) * 100;
              ws.send(JSON.stringify({ progress_percentage: progressPercentage }));  // Send progress
            }
  
            // Notify WebSocket that the task is completed
            ws.send(JSON.stringify({ message: "Task completed" }));
  
          } catch (error) {
            console.error("Error adding companies:", error);
            setShowProgressBar(false);  // Hide progress bar if there's an error
          }
        };
  
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
  
          // Update progress based on backend feedback
          if (data.progress_percentage) {
            setProgress(data.progress_percentage);  // Update progress bar
          }
  
          // Handle task completion
          if (data.message === "Task completed") {
            setShowProgressBar(false);  // Hide progress bar when done
            setSelectedRows([]);  // Clear selected rows
  
            if (ws.readyState !== WebSocket.CLOSED) {
              ws.close();  // Ensure WebSocket is closed only once
            }
          }
        };
  
        ws.onclose = () => {
          console.log("WebSocket closed");
        };
  
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
  
      } catch (error) {
        console.error("Error establishing WebSocket:", error);
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
        setResponse((prevCompanies) =>
          prevCompanies.filter((company) => !selectedRows.includes(company.id))
        );
        setSelectedRows([]);
      } catch (error) {
        console.error("Error removing companies:", error);
      }
    }
  };

  const handleSelectAll = async () => {
    try {
      const companyBatch = await getAllCompanies(props.selectedCollectionId);
      const allCompanyIds = companyBatch.companies.map((company) => company.id);
      setSelectedRows(allCompanyIds);
    } catch (error) {
      console.error("Error selecting all companies:", error);
    }
  };

  const handleDeselectAll = () => {
    setSelectedRows([]);
  };

  return (
    <div style={{ height: 600, width: "100%" }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleAddToLikedCompanies}
        disabled={selectedRows.length === 0}
        style={{ marginBottom: 10 }}
      >
        Add to Liked Companies
      </Button>

      <Button
        variant="contained"
        color="secondary"
        onClick={handleRemoveFromCurrentList}
        disabled={selectedRows.length === 0}
        style={{ marginBottom: 10 }}
      >
        Remove from Current List
      </Button>

      <Button
        variant="contained"
        color="success"
        onClick={handleSelectAll}
        style={{ marginBottom: 10 }}
      >
        Select All
      </Button>

      <Button
        variant="contained"
        color="primary"
        onClick={handleDeselectAll}
        style={{ marginBottom: 10 }}
      >
        Deselect All
      </Button>

      {/* Progress Bar */}
      {showProgressBar && (
        <div style={{ marginBottom: 10, width: "100%" }}>
          <LinearProgress variant="determinate" value={progress} />
          <p>{progress.toFixed(2)}% Complete</p>
        </div>
      )}

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
        rowSelectionModel={selectedRows}
        paginationMode="server"
        onPaginationModelChange={(newMeta) => {
          setPageSize(newMeta.pageSize);
          setOffset(newMeta.page * newMeta.pageSize);
        }}
        onRowSelectionModelChange={(newSelection) => {
          setSelectedRows(newSelection as number[]);
        }}
      />
    </div>
  );
};

export default CompanyTable;
