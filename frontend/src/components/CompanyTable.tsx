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
    setShowProgressBar(false); 
    setProgress(0);  
    setSelectedRows([]);
  }, [props.selectedCollectionId]);


  const handleAddToLikedCompanies = async () => {
    if (selectedRows.length > 0) {
      const batchSize = 100; 
      const numBatches = Math.ceil(selectedRows.length / batchSize);
  
      if (selectedRows.length > batchSize) {
        setShowProgressBar(true); 
        setProgress(0);  
      }
  
      let ws: WebSocket;
  
      try {
        ws = new WebSocket("ws://localhost:8000/ws/progress");
  
        ws.onopen = async () => {
          try {
            for (let i = 0; i < numBatches; i++) {
              const companyBatch = selectedRows.slice(i * batchSize, (i + 1) * batchSize);
  
              await Promise.all(
                companyBatch.map(async (companyId) => {
                  try {
                    await addCompanyToList(companyId, "Liked Companies List");
                  } catch (error: any) {
                    console.error(`Error adding company ${companyId}:`, error);
                    if (error.response && error.response.status === 400) {
                      console.log(`Company ${companyId} already in collection.`);
                    }
                  }
                })
              );
  
              const progressPercentage = ((i + 1) / numBatches) * 100;
              ws.send(JSON.stringify({ progress_percentage: progressPercentage }));
            }
  
            ws.send(JSON.stringify({ message: "Task completed" }));
  
          } catch (error) {
            console.error("Error during batch processing:", error);
          }
        };
  
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
        
          if (data.progress_percentage) {
            setProgress(data.progress_percentage);
          }
        
          if (data.message === "Task completed") {
            setProgress(100);
            setSelectedRows([]);
        
            fetchCompanies();
        
            if (ws.readyState !== WebSocket.CLOSED) {
              ws.close();
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
        setShowProgressBar(false);
      }
    }
  };

  const handleAddToMyList = async () => {
    if (selectedRows.length > 0) {
      const batchSize = 100; 
      const numBatches = Math.ceil(selectedRows.length / batchSize);
  
      if (selectedRows.length > batchSize) {
        setShowProgressBar(true); 
        setProgress(0); 
      }
  
      let ws: WebSocket;
  
      try {
        ws = new WebSocket("ws://localhost:8000/ws/progress");
  
        ws.onopen = async () => {
          try {
            for (let i = 0; i < numBatches; i++) {
              const companyBatch = selectedRows.slice(i * batchSize, (i + 1) * batchSize);
  
              await Promise.all(
                companyBatch.map(async (companyId) => {
                  try {
                    await addCompanyToList(companyId, "My List");
                  } catch (error: any) {
                    console.error(`Error adding company ${companyId}:`, error); 
                    if (error.response && error.response.status === 400) {
                      console.log(`Company ${companyId} already in My List.`);
                    }
                  }
                })
              );
  
              const progressPercentage = ((i + 1) / numBatches) * 100;
              ws.send(JSON.stringify({ progress_percentage: progressPercentage }));
            }
  
            ws.send(JSON.stringify({ message: "Task completed" }));
  
          } catch (error) {
            console.error("Error during batch processing:", error);
          }
        };
  
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
        
          if (data.progress_percentage) {
            setProgress(data.progress_percentage); 
          }
        
          if (data.message === "Task completed") {
            setProgress(100);
            setSelectedRows([]);
        
            fetchCompanies();
        
            if (ws.readyState !== WebSocket.CLOSED) {
              ws.close();
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
        setShowProgressBar(false); 
      }
    }
  };
  

  const handleRemoveFromCurrentList = async () => {
    if (selectedRows.length > 0) {
      const batchSize = 100;
      const numBatches = Math.ceil(selectedRows.length / batchSize);
  
      if (selectedRows.length > batchSize) {
        setShowProgressBar(true);
        setProgress(0); 
      }
  
      let ws: WebSocket;
  
      try {
        ws = new WebSocket("ws://localhost:8000/ws/progress");
  
        ws.onopen = async () => {
          try {
            for (let i = 0; i < numBatches; i++) {
              const companyBatch = selectedRows.slice(i * batchSize, (i + 1) * batchSize);
  
              await Promise.all(
                companyBatch.map(async (companyId) => {
                  try {
                    await removeCompanyFromList(companyId, props.selectedCollectionId); 
                  } catch (error: any) {
                    console.error(`Error removing company ${companyId}:`, error);
                    if (error.response && error.response.status === 400) {
                      console.log(`Company ${companyId} could not be removed.`);
                    }
                  }
                })
              );
  
              const progressPercentage = ((i + 1) / numBatches) * 100;
              ws.send(JSON.stringify({ progress_percentage: progressPercentage }));
            }
  
            ws.send(JSON.stringify({ message: "Task completed" }));
  
          } catch (error) {
            console.error("Error during batch processing:", error);
          }
        };
  
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
        
          if (data.progress_percentage) {
            setProgress(data.progress_percentage); 
          }
        
          if (data.message === "Task completed") {
            setProgress(100); 
            setSelectedRows([]); 
            fetchCompanies();
        
            if (ws.readyState !== WebSocket.CLOSED) {
              ws.close();
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
        setShowProgressBar(false);
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
        disabled={selectedRows.length === 0} 
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
