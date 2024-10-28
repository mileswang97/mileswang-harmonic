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

  const fetchCompanies = async () => {
    const newResponse = await getCollectionsById(props.selectedCollectionId, offset, pageSize);
    setResponse(newResponse.companies);
    setTotal(newResponse.total);
  };

  useEffect(() => {
    fetchCompanies();
  }, [props.selectedCollectionId, offset, pageSize]);

  useEffect(() => {
    setOffset(0);
  }, [props.selectedCollectionId]);

  // Function to add selected companies to "Liked Companies List"
  const handleAddToLikedCompanies = async () => {
    if (selectedRows.length > 0) {
      const batchSize = 100;  // Define batch size
      const numBatches = Math.ceil(selectedRows.length / batchSize);
  
      if (selectedRows.length > batchSize) {
        setShowProgressBar(true);  // Show progress bar
        setProgress(0);  // Reset progress to 0
      }
  
      let ws: WebSocket;
  
      try {
        // Establish WebSocket connection
        ws = new WebSocket("ws://localhost:8000/ws/progress");
  
        ws.onopen = async () => {
          try {
            for (let i = 0; i < numBatches; i++) {
              const companyBatch = selectedRows.slice(i * batchSize, (i + 1) * batchSize);
  
              // Add companies and handle errors for each company
              await Promise.all(
                companyBatch.map(async (companyId) => {
                  try {
                    await addCompanyToList(companyId, "Liked Companies List");  // Actual API call
                  } catch (error: any) {
                    console.error(`Error adding company ${companyId}:`, error);  // Log the error for each company
                    // Handle 400 errors specifically (e.g., company already in collection)
                    if (error.response && error.response.status === 400) {
                      console.log(`Company ${companyId} already in collection.`);
                    }
                  }
                })
              );
  
              // After the API call completes, send the progress update to WebSocket
              const progressPercentage = ((i + 1) / numBatches) * 100;
              ws.send(JSON.stringify({ progress_percentage: progressPercentage }));  // Send progress
            }
  
            ws.send(JSON.stringify({ message: "Task completed" }));
  
          } catch (error) {
            console.error("Error during batch processing:", error);
          }
        };
  
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
  
          if (data.progress_percentage) {
            setProgress(data.progress_percentage);  // Update progress bar
          }
  
          if (data.message === "Task completed") {
            setShowProgressBar(false);  // Hide progress bar when done
            setSelectedRows([]);  // Clear selected rows
            fetchCompanies();

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
        setShowProgressBar(false);  // Ensure the progress bar hides on error
      }
    }
  };

  const handleAddToMyList = async () => {
    if (selectedRows.length > 0) {
      const batchSize = 100;  // Define batch size
      const numBatches = Math.ceil(selectedRows.length / batchSize);
  
      if (selectedRows.length > batchSize) {
        setShowProgressBar(true);  // Show progress bar
        setProgress(0);  // Reset progress to 0
      }
  
      let ws: WebSocket;
  
      try {
        // Establish WebSocket connection
        ws = new WebSocket("ws://localhost:8000/ws/progress");
  
        ws.onopen = async () => {
          try {
            for (let i = 0; i < numBatches; i++) {
              const companyBatch = selectedRows.slice(i * batchSize, (i + 1) * batchSize);
  
              // Add companies to "My List" and handle errors for each company
              await Promise.all(
                companyBatch.map(async (companyId) => {
                  try {
                    await addCompanyToList(companyId, "My List");  // Actual API call to add to "My List"
                  } catch (error: any) {
                    console.error(`Error adding company ${companyId}:`, error);  // Log the error for each company
                    // Handle 400 errors specifically (e.g., company already in collection)
                    if (error.response && error.response.status === 400) {
                      console.log(`Company ${companyId} already in My List.`);
                    }
                  }
                })
              );
  
              // After the API call completes, send the progress update to WebSocket
              const progressPercentage = ((i + 1) / numBatches) * 100;
              ws.send(JSON.stringify({ progress_percentage: progressPercentage }));  // Send progress
            }
  
            ws.send(JSON.stringify({ message: "Task completed" }));
  
          } catch (error) {
            console.error("Error during batch processing:", error);
          }
        };
  
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
  
          if (data.progress_percentage) {
            setProgress(data.progress_percentage);  // Update progress bar
          }
  
          if (data.message === "Task completed") {
            setShowProgressBar(false);  // Hide progress bar when done
            setSelectedRows([]);  // Clear selected rows
            fetchCompanies();  // Refetch companies to update the UI
  
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
        setShowProgressBar(false);  // Ensure the progress bar hides on error
      }
    }
  };
  

  const handleRemoveFromCurrentList = async () => {
    if (selectedRows.length > 0) {
      const batchSize = 100;  // Define batch size
      const numBatches = Math.ceil(selectedRows.length / batchSize);
  
      if (selectedRows.length > batchSize) {
        setShowProgressBar(true);  // Show progress bar
        setProgress(0);  // Reset progress to 0
      }
  
      let ws: WebSocket;
  
      try {
        // Establish WebSocket connection
        ws = new WebSocket("ws://localhost:8000/ws/progress");
  
        ws.onopen = async () => {
          try {
            for (let i = 0; i < numBatches; i++) {
              const companyBatch = selectedRows.slice(i * batchSize, (i + 1) * batchSize);
  
              // Remove companies and handle errors for each company
              await Promise.all(
                companyBatch.map(async (companyId) => {
                  try {
                    await removeCompanyFromList(companyId, props.selectedCollectionId);  // Actual API call
                  } catch (error: any) {
                    console.error(`Error removing company ${companyId}:`, error);  // Log the error for each company
                    // Handle 400 errors specifically
                    if (error.response && error.response.status === 400) {
                      console.log(`Company ${companyId} could not be removed.`);
                    }
                  }
                })
              );
  
              // After the API call completes, send the progress update to WebSocket
              const progressPercentage = ((i + 1) / numBatches) * 100;
              ws.send(JSON.stringify({ progress_percentage: progressPercentage }));  // Send progress
            }
  
            ws.send(JSON.stringify({ message: "Task completed" }));
  
          } catch (error) {
            console.error("Error during batch processing:", error);
          }
        };
  
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
  
          if (data.progress_percentage) {
            setProgress(data.progress_percentage);  // Update progress bar
          }
  
          if (data.message === "Task completed") {
            setShowProgressBar(false);  // Hide progress bar when done
            setSelectedRows([]);  // Clear selected rows
            fetchCompanies();  // Refetch companies to update the UI
  
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
        setShowProgressBar(false);  // Ensure the progress bar hides on error
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
        onClick={handleAddToMyList}
        disabled={selectedRows.length === 0}  // Disable if no companies are selected
        style={{ marginBottom: 10 }}
      >
        Add to My List
      </Button>

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
