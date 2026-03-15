import { useInfinityDevStore } from '../../stores/infinityDevStore';
import PathCardSelect from './PathCardSelect';
import InfinityDevBattle from './InfinityDevBattle';

export default function InfinityDevScreen() {
  const { phase } = useInfinityDevStore();

  if (phase === 'idle' || phase === 'path_select') {
    return <PathCardSelect />;
  }
  return <InfinityDevBattle />;
}
