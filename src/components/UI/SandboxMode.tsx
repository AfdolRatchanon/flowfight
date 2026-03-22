import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import SandboxEditor from '../Sandbox/SandboxEditor';

export default function SandboxMode() {
  const navigate = useNavigate();
  const { colors } = useTheme();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: colors.bgGrad }}>
      <SandboxEditor onBack={() => navigate('/')} />
    </div>
  );
}
