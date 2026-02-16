import { BrowserRouter, Routes, Route } from "react-router-dom";
import Controller from "./Controller";
import SpeakerA from "./SpeakerA";
import SpeakerB from "./SpeakerB";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Controller />} />
        <Route path="/speaker-a" element={<SpeakerA />} />
        <Route path="/speaker-b" element={<SpeakerB />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
