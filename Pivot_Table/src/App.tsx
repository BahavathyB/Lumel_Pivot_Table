import PivotTable from "./components/PivotTable";
import UploadFile from "./components/UploadFile";

function App() {
  return (
    <div>
      <div id="upload-file" style={{ marginTop: "20px", marginBottom: "20px", display: "flex", justifyContent: "center"}}>
        <UploadFile/>
      </div>
      <PivotTable />
    </div>
  );
}

export default App;
