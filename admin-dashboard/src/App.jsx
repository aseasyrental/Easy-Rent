import { BrowserRouter } from 'react-router-dom';
import Shell from './components/Shell';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

export default App;
