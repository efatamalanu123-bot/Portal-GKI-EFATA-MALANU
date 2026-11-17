import React from 'react';
import { LayoutShell } from './components/LayoutShell';
import { AdminDashboardPage } from './components/pages/AdminDashboardPage';
import { AlkitabPage } from './components/pages/AlkitabPage';
import { HomePage } from './components/pages/HomePage';
import { JadwalPage } from './components/pages/JadwalPage';
import { KeuanganPage } from './components/pages/KeuanganPage';
import { LayananPage } from './components/pages/LayananPage';
import { LoginPage } from './components/pages/LoginPage';
import { NyanyianPage } from './components/pages/NyanyianPage';
import { PastoralPage } from './components/pages/PastoralPage';
import { ProfilPage } from './components/pages/ProfilPage';
import { StatistikPage } from './components/pages/StatistikPage';
import { TataIbadahPage } from './components/pages/TataIbadahPage';
import { WartaPage } from './components/pages/WartaPage';
import { ChurchProvider, useChurch } from './context/ChurchContext';

const ActiveRouteView: React.FC = () => {
  const { currentPage } = useChurch();

  switch (currentPage) {
    case 'beranda':
      return <HomePage />;
    case 'tata-ibadah':
      return <TataIbadahPage />;
    case 'jadwal':
      return <JadwalPage />;
    case 'warta':
      return <WartaPage />;
    case 'nyanyian':
      return <NyanyianPage />;
    case 'alkitab':
      return <AlkitabPage />;
    case 'layanan':
      return <LayananPage />;
    case 'pastoral':
      return <PastoralPage />;
    case 'keuangan':
      return <KeuanganPage />;
    case 'statistik':
      return <StatistikPage />;
    case 'profil':
      return <ProfilPage />;
    case 'login':
      return <LoginPage />;
    case 'admin':
      return <AdminDashboardPage />;
    default:
      return <HomePage />;
  }
};

export default function App() {
  return (
    <ChurchProvider>
      <LayoutShell>
        <ActiveRouteView />
      </LayoutShell>
    </ChurchProvider>
  );
}
