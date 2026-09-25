import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Link } from 'wouter';
import { ArrowLeft, Compass } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { DataProvider } from '@/lib/data';
import { Toaster } from 'sonner';

import Home from '@/pages/home';
import Categories from '@/pages/categories';
import CategoryDetail from '@/pages/category-detail';
import Ranking from '@/pages/ranking';
import Bracket from '@/pages/bracket';
import Gallery from '@/pages/gallery';
import Regulations from '@/pages/regulations';
import Live from '@/pages/live';
import ControlDashboard from '@/pages/control/dashboard';
import ControlAttendance from '@/pages/control/attendance';
import ControlCompetencia from '@/pages/control/competencia';
import ControlImportar from '@/pages/control/import';
import ControlParticipantes from '@/pages/control/participants';
import ControlInstituciones from '@/pages/control/institutions';
import ControlStreaming from '@/pages/control/streaming';

function NotFound() {
  return (
    <div className="container-apple flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center">
      <Compass size={44} strokeWidth={1.4} className="text-muted-foreground" />
      <span className="eyebrow mt-6">Error 404</span>
      <h1 className="headline-lg mt-2">Esta página no está en el mapa.</h1>
      <p className="lead mt-4 max-w-md">El enlace puede haber cambiado o la dirección no existe.</p>
      <Link href="/" className="btn-pill btn-primary mt-8"><ArrowLeft size={16} /> Volver al inicio</Link>
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
        <Route path="/reglamento" component={Regulations} />
        <Route path="/envivo" component={Live} />

        {/* Control Routes */}
        <Route path="/control" component={ControlDashboard} />
        <Route path="/control/instituciones" component={ControlInstituciones} />
        <Route path="/control/asistencia" component={ControlAttendance} />
        <Route path="/control/participantes" component={ControlParticipantes} />
        <Route path="/control/competencia" component={ControlCompetencia} />
        <Route path="/control/streaming" component={ControlStreaming} />
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
      <Toaster position="bottom-center" toastOptions={{ className: "!rounded-2xl !font-sans" }} />
    </DataProvider>
  );
}

export default App;
