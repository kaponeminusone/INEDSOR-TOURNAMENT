import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Link } from 'wouter';
import { ArrowLeft, Compass } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { DataProvider } from '@/lib/data';

import Home from '@/pages/home';
import Categories from '@/pages/categories';
import CategoryDetail from '@/pages/category-detail';
import Ranking from '@/pages/ranking';
import Bracket from '@/pages/bracket';
import Gallery from '@/pages/gallery';
import ControlDashboard from '@/pages/control/dashboard';
import ControlAttendance from '@/pages/control/attendance';
import ControlCompetencia from '@/pages/control/competencia';
import ControlImportar from '@/pages/control/import';
import ControlParticipantes from '@/pages/control/participants';
import ControlInstituciones from '@/pages/control/institutions';

function NotFound() {
  return (
    <div className="page-shell min-h-[70dvh] flex items-center justify-center">
      <div className="surface-panel max-w-[530px] w-full p-8 sm:p-12">
        <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary grid place-items-center mb-7"><Compass size={22} /></div>
        <span className="eyebrow">ERROR 404 · RUTA NO DISPONIBLE</span>
        <h1 className="text-[28px] font-bold mt-2 mb-3">Esta página no está en el mapa.</h1>
        <p className="text-muted-foreground text-[13px] leading-relaxed mb-7">El enlace puede haber cambiado o la dirección no existe. Vuelve al inicio para continuar explorando el torneo.</p>
        <Link href="/" className="soft-button primary"><ArrowLeft size={15} /> Volver al inicio</Link>
      </div>
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
        <Route path="/galeria" component={Gallery} />
        
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
