import type { FlowNode, FlowEdge } from '../types/game.types';

export type CodeLang = 'pseudo' | 'python';

// ── Label maps ────────────────────────────────────────────────────────────────

const ACTION_PSEUDO: Record<string, string> = {
  attack:        'โจมตีศัตรู',
  heal:          'รักษา HP',
  dodge:         'หลบหลีก',
  cast_spell:    'ใช้เวทมนตร์',
  use_item:      'ใช้ไอเทม',
  power_strike:  'โจมตีหนัก (Power Strike)',
  berserk:       'เข้าสู่ Berserk',
  shield:        'ยกโล่ป้องกัน',
  counter:       'ตั้งท่าโต้กลับ',
  war_cry:       'ตะโกนรบ',
  fireball:      'ยิงลูกไฟ',
  frost_nova:    'ระเบิดน้ำแข็ง',
  arcane_surge:  'ปล่อยพลังเวทย์',
  backstab:      'โจมตีจากหลัง',
  poison_strike: 'โจมตีด้วยพิษ',
  shadow_step:   'หายตัวโจมตี',
  whirlwind:     'หมุนโจมตีรอบด้าน',
  bloodthirst:   'ดูดเลือดศัตรู',
  battle_cry:    'ตะโกนรบ (Barbarian)',
  use_antidote:  'ใช้ยาแก้พิษ',
  use_potion:    'ดื่มยาบำรุง HP',
  debug_block:   'หยุดการทำงาน (Debug)',
  buy_potion:    'ซื้อยาบำรุง',
  buy_antidote:  'ซื้อยาแก้พิษ',
  buy_scroll:    'ซื้อ Scroll',
  save_gold:     'เก็บ Gold',
};

const COND_PSEUDO: Record<string, (th: number) => string> = {
  hp_greater:    (th) => `HP > ${th}%`,
  hp_less:       (th) => `HP < ${th}%`,
  enemy_alive:   ()   => 'ศัตรูยังมีชีวิต',
  enemy_close:   ()   => 'ศัตรูอยู่ใกล้',
  hero_burning:  ()   => 'ฉัน Burning',
  hero_poisoned: ()   => 'ฉัน Poisoned',
  hero_frozen:   ()   => 'ฉัน Frozen',
  enemy_stunned: ()   => 'ศัตรู Stunned',
  enemy_burning: ()   => 'ศัตรู Burning',
  enemy_frozen:  ()   => 'ศัตรู Frozen',
  enemy_poisoned:()   => 'ศัตรู Poisoned',
  gold_greater:  (th) => `Gold > ${th}`,
  gold_less:     (th) => `Gold < ${th}`,
  turn_gte:      (th) => `รอบที่ ≥ ${th}`,
  is_corrupted:  ()   => 'มีไวรัส',
};

const COND_PYTHON: Record<string, (th: number) => string> = {
  hp_greater:    (th) => `hero_hp > max_hp * ${th} // 100`,
  hp_less:       (th) => `hero_hp < max_hp * ${th} // 100`,
  enemy_alive:   ()   => 'enemy.is_alive()',
  enemy_close:   ()   => 'enemy.is_close()',
  hero_burning:  ()   => 'hero.has_burn()',
  hero_poisoned: ()   => 'hero.has_poison()',
  hero_frozen:   ()   => 'hero.has_freeze()',
  enemy_stunned: ()   => 'enemy.is_stunned()',
  enemy_burning: ()   => 'enemy.has_burn()',
  enemy_frozen:  ()   => 'enemy.has_freeze()',
  enemy_poisoned:()   => 'enemy.has_poison()',
  gold_greater:  (th) => `gold > ${th}`,
  gold_less:     (th) => `gold < ${th}`,
  turn_gte:      (th) => `turn >= ${th}`,
  is_corrupted:  ()   => 'virus.is_present()',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function ind(n: number): string {
  return '  '.repeat(n);
}

function getOut(nodeId: string, outMap: Map<string, FlowEdge[]>, handle?: string): string | null {
  const outs = outMap.get(nodeId) ?? [];
  if (!handle) return outs[0]?.target ?? null;
  const e = outs.find(
    (x) => x.sourceHandle === handle || x.label?.toString().toLowerCase() === handle,
  );
  return e?.target ?? null;
}

function actionLine(node: FlowNode, lang: CodeLang): string {
  const at = node.data.actionType ?? '';
  if (lang === 'pseudo') return ACTION_PSEUDO[at] ?? node.data.label ?? at;
  return `${at}()`;
}

function condStr(node: FlowNode, lang: CodeLang): string {
  const ct = node.data.conditionType ?? '';
  const th = node.data.threshold ?? 50;
  const map = lang === 'pseudo' ? COND_PSEUDO : COND_PYTHON;
  return (map[ct]?.(th)) ?? ct;
}

function loopHeader(node: FlowNode, lang: CodeLang): string {
  const lt = node.data.loopType ?? 'repeat';
  const cnt = node.data.loopCount ?? 3;
  const th = node.data.threshold ?? 50;
  if (lang === 'pseudo') {
    if (lt === 'repeat') return `ทำซ้ำ ${cnt} รอบ:`;
    if (lt === 'while_alive') return 'ขณะที่ศัตรูยังมีชีวิต:';
    return `ขณะที่ HP > ${th}%:`;
  }
  if (lt === 'repeat') return `for _ in range(${cnt}):`;
  if (lt === 'while_alive') return 'while enemy.is_alive():';
  return `while hero_hp > max_hp * ${th} // 100:`;
}

// ── Join-node finder (immediate post-dominator approximation) ─────────────────
// Returns the first node reachable from both aId and bId (BFS order from b).

function findJoin(
  aId: string | null,
  bId: string | null,
  outMap: Map<string, FlowEdge[]>,
  blocked: Set<string>,
): string | null {
  if (!aId || !bId) return null;

  // BFS from a → collect reachable set
  const aReach = new Set<string>();
  const qa = [aId];
  const va = new Set(blocked);
  while (qa.length) {
    const id = qa.shift()!;
    if (va.has(id)) continue;
    va.add(id);
    aReach.add(id);
    for (const e of (outMap.get(id) ?? [])) qa.push(e.target);
  }

  // BFS from b → first node in aReach
  const qb = [bId];
  const vb = new Set(blocked);
  while (qb.length) {
    const id = qb.shift()!;
    if (vb.has(id)) continue;
    vb.add(id);
    if (aReach.has(id)) return id;
    for (const e of (outMap.get(id) ?? [])) qb.push(e.target);
  }

  return null;
}

// ── Recursive traversal ───────────────────────────────────────────────────────

function gen(
  nodeId: string | null,
  nodeMap: Map<string, FlowNode>,
  outMap: Map<string, FlowEdge[]>,
  indent: number,
  ancestors: Set<string>,   // DFS path — cycle detection
  processed: Set<string>,   // globally emitted — prevents duplication
  stopAt: Set<string>,      // halt before these nodes (join points)
  lines: string[],
  lang: CodeLang,
): void {
  if (!nodeId) return;
  if (ancestors.has(nodeId)) return;   // back-edge / cycle
  if (processed.has(nodeId)) return;   // already emitted
  if (stopAt.has(nodeId)) return;      // join-point boundary

  const node = nodeMap.get(nodeId);
  if (!node) return;

  processed.add(nodeId);
  const anc2 = new Set([...ancestors, nodeId]);

  // ── start ──────────────────────────────────────────────────────────────────
  if (node.type === 'start') {
    gen(getOut(nodeId, outMap), nodeMap, outMap, indent, anc2, processed, stopAt, lines, lang);
    return;
  }

  // ── end ────────────────────────────────────────────────────────────────────
  if (node.type === 'end') return;

  // ── action ─────────────────────────────────────────────────────────────────
  if (node.type === 'action') {
    lines.push(`${ind(indent)}${actionLine(node, lang)}`);
    gen(getOut(nodeId, outMap), nodeMap, outMap, indent, anc2, processed, stopAt, lines, lang);
    return;
  }

  // ── condition ──────────────────────────────────────────────────────────────
  if (node.type === 'condition') {
    const yesId = getOut(nodeId, outMap, 'yes');
    const noId  = getOut(nodeId, outMap, 'no');

    const joinId = findJoin(yesId, noId, outMap, anc2);
    const branchStop = new Set([...stopAt, ...(joinId ? [joinId] : [])]);

    if (lang === 'pseudo') {
      lines.push(`${ind(indent)}ถ้า ${condStr(node, lang)}:`);
    } else {
      lines.push(`${ind(indent)}if ${condStr(node, lang)}:`);
    }

    const beforeYes = lines.length;
    gen(yesId, nodeMap, outMap, indent + 1, anc2, processed, branchStop, lines, lang);
    if (lines.length === beforeYes) {
      lines.push(`${ind(indent + 1)}${lang === 'python' ? 'pass' : '(ไม่มีคำสั่ง)'}`);
    }

    if (lang === 'pseudo') {
      lines.push(`${ind(indent)}มิฉะนั้น:`);
    } else {
      lines.push(`${ind(indent)}else:`);
    }

    const beforeNo = lines.length;
    gen(noId, nodeMap, outMap, indent + 1, anc2, processed, branchStop, lines, lang);
    if (lines.length === beforeNo) {
      lines.push(`${ind(indent + 1)}${lang === 'python' ? 'pass' : '(ไม่มีคำสั่ง)'}`);
    }

    // continue from join point
    if (joinId) {
      processed.delete(joinId); // may have been touched by branch BFS — ensure it gets emitted
      gen(joinId, nodeMap, outMap, indent, anc2, processed, stopAt, lines, lang);
    }
    return;
  }

  // ── loop ───────────────────────────────────────────────────────────────────
  if (node.type === 'loop') {
    const loopBodyId = getOut(nodeId, outMap, 'loop');
    const nextId     = getOut(nodeId, outMap, 'next');

    lines.push(`${ind(indent)}${loopHeader(node, lang)}`);

    const bodyBefore = lines.length;
    gen(loopBodyId, nodeMap, outMap, indent + 1, anc2, processed, stopAt, lines, lang);
    if (lines.length === bodyBefore) {
      lines.push(`${ind(indent + 1)}${lang === 'python' ? 'pass' : '(ไม่มีคำสั่ง)'}`);
    }

    gen(nextId, nodeMap, outMap, indent, anc2, processed, stopAt, lines, lang);
    return;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function flowchartToCode(nodes: FlowNode[], edges: FlowEdge[], lang: CodeLang): string {
  if (nodes.length === 0) {
    return lang === 'pseudo'
      ? '(ยังไม่มี Block ในผังงาน)'
      : '# ยังไม่มี Block ในผังงาน';
  }

  const nodeMap = new Map<string, FlowNode>(nodes.map((n) => [n.id, n]));

  // Build outgoing-edge map
  const outMap = new Map<string, FlowEdge[]>();
  for (const e of edges) {
    if (!outMap.has(e.source)) outMap.set(e.source, []);
    outMap.get(e.source)!.push(e);
  }

  const startNode = nodes.find((n) => n.type === 'start');
  if (!startNode) {
    return lang === 'pseudo'
      ? '(ต้องมี Start block)'
      : '# ต้องมี Start block';
  }

  const lines: string[] = [];
  if (lang === 'python') {
    lines.push('def execute():');
  } else {
    lines.push('เริ่มต้น');
  }

  gen(startNode.id, nodeMap, outMap, 1, new Set(), new Set(), new Set(), lines, lang);

  if (lang === 'python') {
    if (lines.length === 1) lines.push('  pass');
  } else {
    lines.push('จบการทำงาน');
  }

  return lines.join('\n');
}
