import { type ReactNode } from 'react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { AppLayout } from '@/components/layout/app-layout';
import { DataProvider } from '@/lib/data';

import Home from '@/pages/home';
import Categories from '@/pages/categories';
import CategoryDetail from '@/pages/category-detail';
import Ranking from '@/pages/ranking';
import Bracket from '@/pages/bracket';
import ControlDashboard from '@/pages/control/dashboard';
import ControlAttendance from '@/pages/control/attendance';
import ControlCompetencia from '@/pages/control/competencia';
import ControlImportar from '@/pages/control/import';
import ControlParticipantes from '@/pages/control/participants';
import ControlInstituciones from '@/pages/control/institutions';

function NotFound() {
  return (
    <div className="py-20 text-center flex flex-col items-center">
      <h1 className="text-6xl font-serif uppercase font-bold mb-4">404</h1>
      <p className="font-mono text-xl mb-8">Página no encontrada.</p>
      <a href="/" className="px-6 py-3 border-2 border-foreground bg-foreground text-background font-bold uppercase font-mono hover:bg-transparent hover:text-foreground transition-colors">
        Volver al Inicio
      </a>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/categorias" component={Categories} />
        <Route path="/categorias/:slug" component={CategoryDetail} />
        <Route path="/ranking" component={Ranking} />
        <Route path="/bracket" component={Bracket} />
        
        {/* Control Routes */}
        <Route path="/control" component={ControlDashboard} />
        <Route path="/control/instituciones" component={ControlInstituciones} />
        <Route path="/control/asistencia" component={ControlAttendance} />
        <Route path="/control/participantes" component={ControlParticipantes} />
        <Route path="/control/competencia" component={ControlCompetencia} />
        <Route path="/control/importar" component={ControlImportar} />
        
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <DataProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
    </DataProvider>
  );
}

export default App;
