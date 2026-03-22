/**
 * Sandbox Flowchart Engine
 * Executes a flowchart as a real program — like Flowgorithm.
 * Pure function, no React dependency.
 */

export type Value = number | string | boolean;
export type Variables = Record<string, Value>;

// ── Tokenizer ──────────────────────────────────────────────────────────────

function tokenize(src: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < src.length) {
    if (/\s/.test(src[i])) { i++; continue; }
    // Two-char operators
    if (i + 1 < src.length) {
      const two = src.slice(i, i + 2);
      if (['==', '!=', '<=', '>=', '&&', '||'].includes(two)) {
        tokens.push(two); i += 2; continue;
      }
    }
    // One-char operators / parens
    if ('+-*/%<>()!'.includes(src[i])) { tokens.push(src[i]); i++; continue; }
    // Number
    if (/[0-9]/.test(src[i])) {
      let num = '';
      while (i < src.length && /[0-9.]/.test(src[i])) num += src[i++];
      tokens.push(num); continue;
    }
    // String literal
    if (src[i] === '"') {
      let str = '"'; i++;
      while (i < src.length && src[i] !== '"') str += src[i++];
      str += '"'; i++;
      tokens.push(str); continue;
    }
    // Identifier / keyword
    if (/[a-zA-Z_]/.test(src[i])) {
      let id = '';
      while (i < src.length && /[a-zA-Z0-9_]/.test(src[i])) id += src[i++];
      tokens.push(id); continue;
    }
    throw new Error(`ไม่รู้จักอักขระ: '${src[i]}'`);
  }
  return tokens;
}

// ── Recursive Descent Parser ───────────────────────────────────────────────

class ExprParser {
  private pos = 0;
  private tokens: string[];
  private vars: Variables;
  constructor(tokens: string[], vars: Variables) {
    this.tokens = tokens;
    this.vars = vars;
  }

  peek(): string | undefined { return this.tokens[this.pos]; }
  consume(): string { return this.tokens[this.pos++]; }
  hasMore(): boolean { return this.pos < this.tokens.length; }

  parseExpr(): Value { return this.parseOr(); }

  parseOr(): Value {
    let left = this.parseAnd();
    while (this.peek() === '||') {
      this.consume();
      const right = this.parseAnd();
      left = Boolean(left) || Boolean(right);
    }
    return left;
  }

  parseAnd(): Value {
    let left = this.parseCompare();
    while (this.peek() === '&&') {
      this.consume();
      const right = this.parseCompare();
      left = Boolean(left) && Boolean(right);
    }
    return left;
  }

  parseCompare(): Value {
    let left = this.parseAdd();
    const op = this.peek();
    if (op && ['<', '>', '==', '!=', '<=', '>='].includes(op)) {
      this.consume();
      const right = this.parseAdd();
      // eslint-disable-next-line eqeqeq
      if (op === '<')  return (left as number) < (right as number);
      if (op === '>')  return (left as number) > (right as number);
      if (op === '==') return left == right;  // intentional loose equal for "5" == 5
      if (op === '!=') return left != right;
      if (op === '<=') return (left as number) <= (right as number);
      if (op === '>=') return (left as number) >= (right as number);
    }
    return left;
  }

  parseAdd(): Value {
    let left = this.parseMul();
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.consume();
      const right = this.parseMul();
      if (op === '+') {
        left = (typeof left === 'string' || typeof right === 'string')
          ? String(left) + String(right)
          : (left as number) + (right as number);
      } else {
        left = (left as number) - (right as number);
      }
    }
    return left;
  }

  parseMul(): Value {
    let left = this.parseUnary();
    while (['*', '/', '%'].includes(this.peek() ?? '')) {
      const op = this.consume();
      const right = this.parseUnary();
      if (op === '*') left = (left as number) * (right as number);
      else if (op === '/') {
        if (right === 0) throw new Error('หารด้วยศูนย์ไม่ได้');
        left = (left as number) / (right as number);
      } else {
        left = (left as number) % (right as number);
      }
    }
    return left;
  }

  parseUnary(): Value {
    if (this.peek() === '-') { this.consume(); return -(this.parseFactor() as number); }
    if (this.peek() === '!') { this.consume(); return !Boolean(this.parseFactor()); }
    return this.parseFactor();
  }

  parseFactor(): Value {
    const tok = this.peek();
    if (tok === undefined) throw new Error('สิ้นสุด expression ก่อนกำหนด');
    if (tok === '(') {
      this.consume();
      const val = this.parseExpr();
      if (this.consume() !== ')') throw new Error("ไม่มี ')'");
      return val;
    }
    if (tok.startsWith('"')) { this.consume(); return tok.slice(1, -1); }
    if (tok === 'true')  { this.consume(); return true; }
    if (tok === 'false') { this.consume(); return false; }
    if (/^[0-9]/.test(tok)) { this.consume(); return parseFloat(tok); }
    if (/^[a-zA-Z_]/.test(tok)) {
      this.consume();
      if (!(tok in this.vars)) throw new Error(`ตัวแปร '${tok}' ยังไม่ได้กำหนดค่า`);
      return this.vars[tok];
    }
    throw new Error(`ไม่รู้จัก token: '${tok}'`);
  }
}

export function evalExpr(expr: string, vars: Variables): Value {
  const tokens = tokenize(expr.trim());
  if (!tokens.length) throw new Error('expression ว่าง');
  const parser = new ExprParser(tokens, vars);
  const result = parser.parseExpr();
  if (parser.hasMore()) throw new Error(`token เกิน: '${parser.peek()}'`);
  return result;
}

// ── Process Assignment ─────────────────────────────────────────────────────

function executeProcess(expression: string, vars: Variables): Variables {
  // Format: varName = expr  (e.g.  x = x + 1)
  const eqIdx = expression.indexOf('=');
  if (eqIdx === -1) throw new Error(`ต้องมี '=' ใน "${expression}"`);
  const varName = expression.slice(0, eqIdx).trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName))
    throw new Error(`ชื่อตัวแปรไม่ถูกต้อง: "${varName}"`);
  const value = evalExpr(expression.slice(eqIdx + 1), vars);
  return { ...vars, [varName]: value };
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface SbExecResult {
  output: string[];
  variables: Variables;
  visitedNodeIds: string[];
  error?: string;
}

/** One step yielded by the generator — node just executed */
export interface SbStep {
  nodeId: string;           // node that just ran
  visitedSoFar: string[];   // all nodes executed so far (including nodeId)
  vars: Variables;
  output: string[];
  done: boolean;
  error?: string;
}

interface SbNodeLike {
  id: string;
  type?: string;
  data: { expression?: string; varName?: string };
}

interface SbEdgeLike {
  source: string;
  target: string;
  sourceHandle?: string | null;
}

// ── Shared setup helper ────────────────────────────────────────────────────

function buildNextMap(edges: SbEdgeLike[]) {
  const m = new Map<string, { default?: string; yes?: string; no?: string }>();
  for (const edge of edges) {
    if (!m.has(edge.source)) m.set(edge.source, {});
    const e = m.get(edge.source)!;
    if (edge.sourceHandle === 'yes')     e.yes     = edge.target;
    else if (edge.sourceHandle === 'no') e.no      = edge.target;
    else                                 e.default  = edge.target;
  }
  return m;
}

// ── Generator — step-by-step execution ────────────────────────────────────

export function* sandboxStepper(
  nodes: SbNodeLike[],
  edges: SbEdgeLike[],
  inputs?: Record<string, Value>,
): Generator<SbStep, void, void> {
  const output: string[] = [];
  const visitedSoFar: string[] = [];
  let vars: Variables = {};
  const MAX_STEPS = 500;

  const nextMap = buildNextMap(edges);
  const startNode = nodes.find(n => n.type === 'sb_start');
  if (!startNode) {
    yield { nodeId: '', visitedSoFar: [], vars, output: ['ไม่มี Start node'], done: true, error: 'ไม่มี Start node' };
    return;
  }

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  let currentId: string | undefined = startNode.id;
  let steps = 0;

  while (currentId && steps < MAX_STEPS) {
    steps++;
    const node = nodeMap.get(currentId);
    if (!node) break;
    const next = nextMap.get(currentId);

    try {
      let nextId: string | undefined;

      switch (node.type) {
        case 'sb_start':
          nextId = next?.default;
          break;

        case 'sb_end':
          output.push('--- โปรแกรมสิ้นสุด ---');
          visitedSoFar.push(currentId);
          yield { nodeId: currentId, visitedSoFar: [...visitedSoFar], vars, output: [...output], done: true };
          return;

        case 'sb_process': {
          const expr = node.data.expression?.trim() ?? '';
          if (expr) vars = executeProcess(expr, vars);
          nextId = next?.default;
          break;
        }

        case 'sb_decision': {
          const expr = node.data.expression?.trim() ?? 'false';
          nextId = Boolean(evalExpr(expr, vars)) ? next?.yes : next?.no;
          break;
        }

        case 'sb_output': {
          const expr = node.data.expression?.trim() ?? '';
          output.push(String(expr ? evalExpr(expr, vars) : ''));
          nextId = next?.default;
          break;
        }

        case 'sb_input': {
          const varName = node.data.varName?.trim() ?? '';
          if (varName) {
            const provided = inputs?.[varName];
            vars[varName] = provided !== undefined ? provided : 0;
          }
          nextId = next?.default;
          break;
        }

        default:
          nextId = next?.default;
      }

      visitedSoFar.push(currentId);
      yield { nodeId: currentId, visitedSoFar: [...visitedSoFar], vars, output: [...output], done: false };
      currentId = nextId;

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const errNodeId = currentId ?? '';
      visitedSoFar.push(errNodeId);
      yield { nodeId: errNodeId, visitedSoFar: [...visitedSoFar], vars, output: [...output], done: true, error: msg };
      return;
    }
  }

  if (steps >= MAX_STEPS) {
    yield { nodeId: currentId ?? '', visitedSoFar: [...visitedSoFar], vars, output: [...output], done: true, error: 'เกิน 500 steps — อาจมี loop ไม่สิ้นสุด' };
    return;
  }

  output.push('--- สิ้นสุด (ไม่มี End node) ---');
  yield { nodeId: '', visitedSoFar: [...visitedSoFar], vars, output: [...output], done: true };
}

// ── Instant execute (runs generator to completion) ─────────────────────────

export function executeSandbox(
  nodes: SbNodeLike[],
  edges: SbEdgeLike[],
  inputs?: Record<string, Value>,
): SbExecResult {
  let last: SbStep | undefined;
  for (const step of sandboxStepper(nodes, edges, inputs)) {
    last = step;
    if (step.done) break;
  }
  if (!last) return { output: [], variables: {}, visitedNodeIds: [] };
  return { output: last.output, variables: last.vars, visitedNodeIds: last.visitedSoFar, error: last.error };
}
