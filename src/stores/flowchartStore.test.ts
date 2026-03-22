/**
 * Unit Tests — flowchartStore (Undo/Redo History)
 *
 * ทดสอบ undo/redo history ที่เพิ่งแก้ bug (v0.24.0)
 * รัน: npm test
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useFlowchartStore } from './flowchartStore';
import type { FlowNode, FlowEdge } from '../types/game.types';

// ───── Helpers ─────────────────────────────────────────────────────────────

function makeNode(id: string, type = 'action'): FlowNode {
  return { id, type: type as any, position: { x: 0, y: 0 }, data: { label: id, actionType: 'attack' } };
}

function makeEdge(id: string, source: string, target: string): FlowEdge {
  return { id, source, target } as FlowEdge;
}

/** รีเซ็ต store ก่อนทุก test */
beforeEach(() => {
  useFlowchartStore.setState({
    nodes: [],
    edges: [],
    _past: [],
    _future: [],
  });
});

// ───── _pushHistory ─────────────────────────────────────────────────────────

describe('_pushHistory', () => {
  it('push snapshot ของ nodes+edges เข้า _past', () => {
    useFlowchartStore.setState({ nodes: [makeNode('a')], edges: [] });
    useFlowchartStore.getState()._pushHistory();
    const { _past } = useFlowchartStore.getState();
    expect(_past).toHaveLength(1);
    expect(_past[0].nodes[0].id).toBe('a');
  });

  it('ล้าง _future เมื่อ push history ใหม่', () => {
    useFlowchartStore.setState({ _future: [{ nodes: [makeNode('z')], edges: [] }] });
    useFlowchartStore.getState()._pushHistory();
    expect(useFlowchartStore.getState()._future).toHaveLength(0);
  });

  it('ไม่เกิน MAX_HISTORY (50) entries', () => {
    for (let i = 0; i < 55; i++) {
      useFlowchartStore.getState()._pushHistory();
    }
    expect(useFlowchartStore.getState()._past.length).toBeLessThanOrEqual(50);
  });
});

// ───── setNodes recordHistory ────────────────────────────────────────────────

describe('setNodes', () => {
  it('setNodes(nodes, false) ไม่ push history', () => {
    useFlowchartStore.getState().setNodes([makeNode('x')], false);
    expect(useFlowchartStore.getState()._past).toHaveLength(0);
  });

  it('setNodes(nodes, true) push history ก่อน set', () => {
    useFlowchartStore.setState({ nodes: [makeNode('before')] });
    useFlowchartStore.getState().setNodes([makeNode('after')], true);
    const { _past, nodes } = useFlowchartStore.getState();
    expect(_past).toHaveLength(1);
    expect(_past[0].nodes[0].id).toBe('before'); // snapshot ก่อน change
    expect(nodes[0].id).toBe('after');           // state ปัจจุบัน
  });
});

// ───── setEdges recordHistory ────────────────────────────────────────────────

describe('setEdges', () => {
  it('setEdges(edges, false) ไม่ push history', () => {
    useFlowchartStore.getState().setEdges([makeEdge('e1', 'a', 'b')], false);
    expect(useFlowchartStore.getState()._past).toHaveLength(0);
  });

  it('setEdges(edges, true) push history ก่อน set', () => {
    useFlowchartStore.setState({ edges: [makeEdge('old', 'a', 'b')] });
    useFlowchartStore.getState().setEdges([makeEdge('new', 'c', 'd')], true);
    const { _past, edges } = useFlowchartStore.getState();
    expect(_past[0].edges[0].id).toBe('old');
    expect(edges[0].id).toBe('new');
  });
});

// ───── addNode / removeNode ──────────────────────────────────────────────────

describe('addNode', () => {
  it('เพิ่ม node เข้า store', () => {
    useFlowchartStore.getState().addNode(makeNode('n1'));
    expect(useFlowchartStore.getState().nodes).toHaveLength(1);
    expect(useFlowchartStore.getState().nodes[0].id).toBe('n1');
  });

  it('push history เมื่อ addNode', () => {
    useFlowchartStore.getState().addNode(makeNode('n1'));
    expect(useFlowchartStore.getState()._past).toHaveLength(1);
  });
});

describe('removeNode', () => {
  it('ลบ node ออกจาก store', () => {
    useFlowchartStore.setState({ nodes: [makeNode('n1'), makeNode('n2')] });
    useFlowchartStore.getState().removeNode('n1');
    expect(useFlowchartStore.getState().nodes.map((n) => n.id)).toEqual(['n2']);
  });

  it('ลบ edges ที่เชื่อมกับ node ออกด้วย', () => {
    useFlowchartStore.setState({
      nodes: [makeNode('a'), makeNode('b')],
      edges: [makeEdge('e1', 'a', 'b'), makeEdge('e2', 'b', 'a')],
    });
    useFlowchartStore.getState().removeNode('a');
    expect(useFlowchartStore.getState().edges).toHaveLength(0);
  });

  it('push history เมื่อ removeNode', () => {
    useFlowchartStore.setState({ nodes: [makeNode('n1')] });
    useFlowchartStore.getState().removeNode('n1');
    expect(useFlowchartStore.getState()._past).toHaveLength(1);
  });
});

// ───── addEdge / removeEdge ──────────────────────────────────────────────────

describe('addEdge', () => {
  it('เพิ่ม edge เข้า store', () => {
    useFlowchartStore.getState().addEdge(makeEdge('e1', 'a', 'b'));
    expect(useFlowchartStore.getState().edges).toHaveLength(1);
  });

  it('push history เมื่อ addEdge', () => {
    useFlowchartStore.getState().addEdge(makeEdge('e1', 'a', 'b'));
    expect(useFlowchartStore.getState()._past).toHaveLength(1);
  });
});

describe('removeEdge', () => {
  it('ลบ edge ออกจาก store', () => {
    useFlowchartStore.setState({ edges: [makeEdge('e1', 'a', 'b'), makeEdge('e2', 'c', 'd')] });
    useFlowchartStore.getState().removeEdge('e1');
    expect(useFlowchartStore.getState().edges.map((e) => e.id)).toEqual(['e2']);
  });

  it('push history เมื่อ removeEdge', () => {
    useFlowchartStore.setState({ edges: [makeEdge('e1', 'a', 'b')] });
    useFlowchartStore.getState().removeEdge('e1');
    expect(useFlowchartStore.getState()._past).toHaveLength(1);
  });
});

// ───── undo ─────────────────────────────────────────────────────────────────

describe('undo', () => {
  it('คืนค่า nodes/edges จาก _past', () => {
    useFlowchartStore.setState({ nodes: [makeNode('before')], edges: [] });
    useFlowchartStore.getState()._pushHistory();           // snapshot "before"
    useFlowchartStore.getState().setNodes([makeNode('after')]);

    useFlowchartStore.getState().undo();

    const { nodes } = useFlowchartStore.getState();
    expect(nodes[0].id).toBe('before');
  });

  it('ย้าย current state ไปยัง _future หลัง undo', () => {
    useFlowchartStore.setState({ nodes: [makeNode('before')], edges: [] });
    useFlowchartStore.getState()._pushHistory();
    useFlowchartStore.getState().setNodes([makeNode('after')]);

    useFlowchartStore.getState().undo();

    const { _future } = useFlowchartStore.getState();
    expect(_future).toHaveLength(1);
    expect(_future[0].nodes[0].id).toBe('after');
  });

  it('undo เมื่อ _past ว่าง → ไม่เปลี่ยนแปลง', () => {
    useFlowchartStore.setState({ nodes: [makeNode('x')], _past: [] });
    useFlowchartStore.getState().undo();
    expect(useFlowchartStore.getState().nodes[0].id).toBe('x');
  });

  it('undo หลาย steps ต่อเนื่องได้', () => {
    // step 1
    useFlowchartStore.setState({ nodes: [makeNode('step1')], edges: [] });
    useFlowchartStore.getState()._pushHistory();
    // step 2
    useFlowchartStore.getState().setNodes([makeNode('step2')]);
    useFlowchartStore.getState()._pushHistory();
    // step 3
    useFlowchartStore.getState().setNodes([makeNode('step3')]);

    useFlowchartStore.getState().undo(); // ← step2
    expect(useFlowchartStore.getState().nodes[0].id).toBe('step2');

    useFlowchartStore.getState().undo(); // ← step1
    expect(useFlowchartStore.getState().nodes[0].id).toBe('step1');
  });
});

// ───── redo ─────────────────────────────────────────────────────────────────

describe('redo', () => {
  it('คืนค่า nodes/edges จาก _future', () => {
    useFlowchartStore.setState({ nodes: [makeNode('before')], edges: [] });
    useFlowchartStore.getState()._pushHistory();
    useFlowchartStore.getState().setNodes([makeNode('after')]);
    useFlowchartStore.getState().undo();

    useFlowchartStore.getState().redo();

    expect(useFlowchartStore.getState().nodes[0].id).toBe('after');
  });

  it('ย้าย current state ไปยัง _past หลัง redo', () => {
    useFlowchartStore.setState({ nodes: [makeNode('before')], edges: [] });
    useFlowchartStore.getState()._pushHistory();
    useFlowchartStore.getState().setNodes([makeNode('after')]);
    useFlowchartStore.getState().undo();
    useFlowchartStore.getState().redo();

    expect(useFlowchartStore.getState()._past).toHaveLength(1);
  });

  it('redo เมื่อ _future ว่าง → ไม่เปลี่ยนแปลง', () => {
    useFlowchartStore.setState({ nodes: [makeNode('x')], _future: [] });
    useFlowchartStore.getState().redo();
    expect(useFlowchartStore.getState().nodes[0].id).toBe('x');
  });

  it('undo แล้ว redo กลับมาที่ state เดิม', () => {
    useFlowchartStore.setState({ nodes: [makeNode('A')], edges: [] });
    useFlowchartStore.getState()._pushHistory();
    useFlowchartStore.getState().setNodes([makeNode('B')]);
    useFlowchartStore.getState().undo();
    useFlowchartStore.getState().redo();
    expect(useFlowchartStore.getState().nodes[0].id).toBe('B');
  });

  it('push history ใหม่หลัง undo จะล้าง _future (no branch redo)', () => {
    useFlowchartStore.setState({ nodes: [makeNode('A')], edges: [] });
    useFlowchartStore.getState()._pushHistory();
    useFlowchartStore.getState().setNodes([makeNode('B')]);
    useFlowchartStore.getState().undo();

    // แก้อะไรใหม่ → ไม่สามารถ redo ไป B ได้อีก
    useFlowchartStore.getState()._pushHistory();
    useFlowchartStore.getState().setNodes([makeNode('C')]);

    expect(useFlowchartStore.getState()._future).toHaveLength(0);
    useFlowchartStore.getState().redo(); // redo ไม่ทำอะไร
    expect(useFlowchartStore.getState().nodes[0].id).toBe('C');
  });
});

// ───── undo + redo (edges) ──────────────────────────────────────────────────

describe('undo/redo กับ edges', () => {
  it('undo คืน edges ก่อนเพิ่ม', () => {
    useFlowchartStore.setState({ nodes: [], edges: [] });
    useFlowchartStore.getState()._pushHistory(); // snapshot: no edges
    useFlowchartStore.getState().setEdges([makeEdge('e1', 'a', 'b')]);

    useFlowchartStore.getState().undo();
    expect(useFlowchartStore.getState().edges).toHaveLength(0);
  });

  it('redo คืน edges หลังเพิ่ม', () => {
    useFlowchartStore.setState({ nodes: [], edges: [] });
    useFlowchartStore.getState()._pushHistory();
    useFlowchartStore.getState().setEdges([makeEdge('e1', 'a', 'b')]);
    useFlowchartStore.getState().undo();
    useFlowchartStore.getState().redo();
    expect(useFlowchartStore.getState().edges[0].id).toBe('e1');
  });
});
