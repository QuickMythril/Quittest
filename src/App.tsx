import { useGlobal } from 'qapp-core';
import { SocialApp } from './components/SocialApp';

function App() {
  const { auth } = useGlobal();

  return (
    <SocialApp
      userName={auth?.name || 'User'}
      userAvatar={auth?.avatarUrl || undefined}
    />
  );
}

export default App;
