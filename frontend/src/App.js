import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from "react-router-dom";
import { Box, Typography, Button, Stack, Container, Paper } from "@mui/material";
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import DepartureBoardIcon from '@mui/icons-material/DepartureBoard';
import DealershipAnalysisPage from "./pages/DealershipAnalysisPage";

// Import your actual pages
import DealershipsPage from "./pages/DealershipsPage";
import CustomersPage from "./pages/CustomersPage";
import VisitsPage from "./pages/VisitsPage";
import VisitAnalysisPage from "./pages/VisitAnalysisPage";
import CustomerAnalysisPage from "./pages/CustomerAnalysisPage";

// Home page component
function Home() {
  return (
    <Box
      minHeight="100vh"
      sx={{
        background:
          "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
        display: "flex",
        alignItems: "center"
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={5}
          sx={{
            borderRadius: 4,
            p: { xs: 3, md: 8 },
            textAlign: "center",
            backgroundColor: "rgba(255,255,255,0.97)"
          }}
        >
          <Typography variant="h2" color="primary" fontWeight={800} gutterBottom>
            🚗 Customer Risk Score Dashboard
          </Typography>
          <Typography variant="h6" fontWeight={400} color="text.secondary" mb={5}>
            Manage your dealerships, customers, and visits—all in one smart place.  
            Seamlessly collect data and analyze dealership risk and customer experience.
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }}
            justifyContent="center"
            alignItems="center"
            spacing={3}
            mt={3}
          >
            <Button
              component={Link}
              to="/dealerships"
              size="large"
              variant="contained"
              color="primary"
              startIcon={<StorefrontRoundedIcon />}
              sx={{ px: 4, py: 2, fontWeight: 600, fontSize: "1.2rem", borderRadius: 3 }}
            >
              Dealerships
            </Button>
            <Button
              component={Link}
              to="/customers"
              size="large"
              variant="contained"
              color="secondary"
              startIcon={<PeopleAltRoundedIcon />}
              sx={{ px: 4, py: 2, fontWeight: 600, fontSize: "1.2rem", borderRadius: 3 }}
            >
              Customers
            </Button>
            <Button
              component={Link}
              to="/visits"
              size="large"
              variant="contained"
              style={{ backgroundColor: "#00bfae" }}
              startIcon={<DepartureBoardIcon />}
              sx={{ px: 4, py: 2, fontWeight: 600, fontSize: "1.2rem", borderRadius: 3, color: "white" }}
            >
              Visits
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

// App component with routing
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dealerships" element={<DealershipsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/visits" element={<VisitsPage />} />
        <Route path="/visits/:id/analysis" element={<VisitAnalysisPage />} />
        <Route path="/dealerships/:id/analysis" element={<DealershipAnalysisPage />} />
        <Route path="/customers/:id/analysis" element={<CustomerAnalysisPage />} />
      </Routes>
    </Router>
  );
}