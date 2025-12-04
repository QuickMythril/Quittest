import { useGlobal } from 'qapp-core';
import { SocialApp } from './components/SocialApp';

function App() {
  const { auth } = useGlobal();

  return <SocialApp userName={auth?.name || 'User'} />;
}

export default App;
