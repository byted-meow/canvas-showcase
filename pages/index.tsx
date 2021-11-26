import './index.css';
import { Canvas } from './canvas';
import { CanvasProvider } from './canvas/context';

const Index: React.FC = () => (
  <CanvasProvider>
    <div className="container">
      <Canvas
        canvasId="main-1"
        containerProps={{ style: { width: '100vw', height: '100vh' } }}
      />
    </div>
  </CanvasProvider>
);

export default Index;
