import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';
const PageTwo = React.lazy(() => import('../../pages/PageTwo'));

function App(props: AppRootProps) {
  return (
    <Routes>
      <Route path={ROUTES.Two} element={<PageTwo />} />

    </Routes>
  );
}

export default App;
