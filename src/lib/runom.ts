// Klient RUNOM (system agentowy zarządzania zadaniami/zatwierdzeniami) —
// ten sam wzorzec co paymentGateway.ts: fetch z jawnym timeoutem, walidacja
// konfiguracji przed próbą wywołania, brak cichej degradacji dla operacji
// dotykających pieniędzy.
//
// Zakres (docs/adr/0003-runom-refund-approval.md): decyzja "czy anulowanie
// OPŁACONEJ rezerwacji może zostać zrefundowane automatycznie, czy wymaga
// przeglądu administratora" jest delegowana do RUNOM (Task Orchestrator +
// Approval Engine, projekt RUNOM, ADR-0029 po tamtej stronie). RASPON nigdy
// nie przekazuje do RUNOM danych płatniczych/KYC — wyłącznie identyfikator
// rezerwacji i kwotę.

const REQUEST_TIMEOUT_MS = 10_000;

export class RunomNotConfiguredError extends Error {
  constructor() {
    super("RUNOM integration is not configured (RUNOM_API_URL/RUNOM_AGENT_ID/RUNOM_AGENT_TOKEN/RUNOM_OWNER_USER_ID)");
    this.name = "RunomNotConfiguredError";
  }
}

export class RunomRequestError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = "RunomRequestError";
  }
}

interface RunomConfig {
  apiUrl: string;
  agentId: string;
  agentToken: string;
  ownerUserId: string;
}

export function getRunomConfig(env: Record<string, string | undefined> = process.env): RunomConfig | null {
  const apiUrl = env.RUNOM_API_URL;
  const agentId = env.RUNOM_AGENT_ID;
  const agentToken = env.RUNOM_AGENT_TOKEN;
  const ownerUserId = env.RUNOM_OWNER_USER_ID;
  if (!apiUrl || !agentId || !agentToken || !ownerUserId) return null;
  return { apiUrl: apiUrl.replace(/\/+$/, ""), agentId, agentToken, ownerUserId };
}

/**
 * Próg kwotowy (EUR) — poniżej połowy tej wartości ryzyko jest niskie
 * (RUNOM auto-akceptuje), od połowy wzwyż rośnie liniowo do 1.0 przy pełnej
 * wartości progu i powyżej. Przy domyślnym APPROVAL_RISK_THRESHOLD=0.5 po
 * stronie RUNOM oznacza to: kwota poniżej progu → auto-akceptacja, kwota
 * równa lub większa od progu → wymaga zatwierdzenia administratora.
 */
export function computeRefundRiskScore(amountEur: number, autoApproveMaxEur: number): number {
  if (!Number.isFinite(amountEur) || amountEur < 0) throw new RangeError("amountEur must be a non-negative finite number");
  if (!Number.isFinite(autoApproveMaxEur) || autoApproveMaxEur <= 0) throw new RangeError("autoApproveMaxEur must be a positive finite number");
  const riskScore = amountEur / (autoApproveMaxEur * 2);
  return Math.min(1, Math.max(0, riskScore));
}

interface RunomTask {
  id: string;
  status: "created" | "in_progress" | "awaiting_approval" | "completed" | "failed";
  [key: string]: unknown;
}

async function runomFetch(config: RunomConfig, path: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-agent-id": config.agentId,
        "x-agent-token": config.agentToken,
        ...init.headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new RunomRequestError(`RUNOM request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body && typeof body === "object" && "error" in body) ? String((body as { error: unknown }).error) : `HTTP ${response.status}`;
    throw new RunomRequestError(message, response.status);
  }
  return body;
}

/**
 * Tworzy zadanie RUNOM reprezentujące sprawę anulowania/refundu opłaconej
 * rezerwacji, od razu przechodzi created -> in_progress (przejście zawsze
 * legalne z E10, ADR-0026), po czym zgłasza je do oceny ryzyka. Zwraca
 * finalny stan zadania (in_progress = auto-akceptacja, awaiting_approval =
 * czeka na administratora RASPON zalogowanego jako użytkownik RUNOM).
 */
export async function requestRefundApproval(config: RunomConfig, {
  bookingId,
  bookingCode,
  amountEur,
  currency,
  riskScore,
  reason,
}: {
  bookingId: string;
  bookingCode: string;
  amountEur: number;
  currency: string;
  riskScore: number;
  reason: string | null;
}): Promise<RunomTask> {
  const createBody = await runomFetch(config, "/internal/tasks", {
    method: "POST",
    body: JSON.stringify({
      ownerUserId: config.ownerUserId,
      title: `Refund review — booking ${bookingCode}`,
      goal: `Ocena ryzyka pełnej refundy dla rezerwacji ${bookingCode} (${bookingId}), kwota ${amountEur} ${currency}.`,
      projectId: undefined,
    }),
  }) as { task: RunomTask };
  const taskId = createBody.task.id;

  await runomFetch(config, `/internal/tasks/${taskId}/transition`, {
    method: "POST",
    body: JSON.stringify({ toStatus: "in_progress" }),
  });

  const approvalBody = await runomFetch(config, `/internal/tasks/${taskId}/request-approval`, {
    method: "POST",
    body: JSON.stringify({
      riskScore,
      reason: reason ?? `Automated cancellation request for booking ${bookingCode}`,
    }),
  }) as { task: RunomTask; autoApproved: boolean };

  return approvalBody.task;
}

export async function getRunomTask(config: RunomConfig, taskId: string): Promise<RunomTask> {
  const body = await runomFetch(config, `/internal/tasks/${taskId}`, { method: "GET" }) as { task: RunomTask };
  return body.task;
}
