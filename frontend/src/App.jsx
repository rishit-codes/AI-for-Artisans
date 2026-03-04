import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

import Landing from "./pages/Landing";
import Home from "./pages/Home";
import AddProduct from "./pages/AddProduct";
import Constraints from "./pages/Constraints";
import MyCrafts from "./pages/MyCrafts";
import ProductionAdvisor from "./pages/ProductionAdvisor";
import Trends from "./pages/Trends";

import DashboardLayout from "./components/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          
          <Route path="home" element={<Home />} />
          <Route path="add-product" element={<AddProduct />} />
          <Route path="constraints" element={<Constraints />} />
          <Route path="my-crafts" element={<MyCrafts />} />
          <Route path="production-advisor" element={<ProductionAdvisor />} />
          <Route path="trends" element={<Trends />} />

          {/* Fallback route */}
          <Route path="*" element={<div style={{ textAlign: "center", padding: "2rem" }}>Page not found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
