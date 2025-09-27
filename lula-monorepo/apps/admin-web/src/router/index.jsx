import authRoutes from "./auth";
import { Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "../layout/Layout";
import dashboardRoutes from "./dashboard";
import AuthGaurd from "../components/shared/AuthGaurd";
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={"/login"} />} />
      {authRoutes.map(({ path, Element, index, key }) => (
        <Route
          path={path}
          element={
            <Suspense>
              <Element />
            </Suspense>
          }
          index={index}
          key={key}
        />
      ))}
      <Route path="/dashboard" element={
        <AuthGaurd>
          <Layout />
        </AuthGaurd>
      }>
        {dashboardRoutes.map(({ path, Element, index, key }) => (
          <Route path={path} element={<Element />} index={index} key={key} />
        ))}
      </Route>
    </Routes>
  );
};

export default AppRoutes;
