import { GamePage } from './pages/GamePage';
import { ThemeProvider } from './theme/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <GamePage />
    </ThemeProvider>
  )
}

export default App;
