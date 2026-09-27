import { TooltipProvider } from '@radix-ui/react-tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import Layout from './components/layout';
import SwapPage from './pages/swap';
import PoolsPage from './pages/pools';
import PortfolioPage from './pages/portfolio';

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <div className="dark">
          <Layout>
            <Switch>
              <Route path="/" component={SwapPage} />
              <Route path="/pools" component={PoolsPage} />
              <Route path="/portfolio" component={PortfolioPage} />
              <Route>
                <div className="flex h-[50vh] items-center justify-center text-muted-foreground font-mono">
                  404 | NOT FOUND
                </div>
              </Route>
            </Switch>
          </Layout>
          <Toaster />
        </div>
      </WouterRouter>
    </TooltipProvider>
  );
}

export default App;
