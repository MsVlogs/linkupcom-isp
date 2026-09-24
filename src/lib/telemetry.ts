import https from 'node:https';

export type TelemetryFinding = {
  source: 'mikrotik' | 'olt' | 'onu';
  level: 'info' | 'warning' | 'critical';
  title: string;
  detail: string;
};

export type CustomerTelemetry = {
  checkedAt: string;
  live: boolean;
  findings: TelemetryFinding[];
  pppoe?: {
    username: string;
    active: boolean;
    address?: string;
    uptime?: string;
    callerId?: string;
  };
  olt?: {
    online: boolean;
    onuRegistered?: boolean;
    opticalRx?: string | number;
    opticalTx?: string | number;
    lastSeen?: string;
    detail?: string;
  };
  errors: string[];
};

function basicAuth(username: string, password: string) {
  return 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
}

async function routerOsGet(path: string) {
  const base = process.env.MIKROTIK_REST_URL?.replace(/\/$/, '');
  const username = process.env.MIKROTIK_REST_USERNAME;
  const password = process.env.MIKROTIK_REST_PASSWORD;
  if (!base || !username || !password) return null;

  const agent = base.startsWith('https://')
    ? new https.Agent({ rejectUnauthorized: process.env.MIKROTIK_TLS_VERIFY !== 'false' })
    : undefined;

  const response = await fetch(base + path, {
    method: 'GET',
    headers: { Authorization: basicAuth(username, password), Accept: 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
    // @ts-expect-error Node fetch supports the HTTPS agent at runtime.
    agent,
  });
  if (!response.ok) throw new Error(`MikroTik REST ${response.status}`);
  return response.json();
}

async function getMikrotik(username: string, result: CustomerTelemetry) {
  if (!process.env.MIKROTIK_REST_URL) return;
  try {
    const rows = await routerOsGet('/rest/ppp/active');
    const sessions = Array.isArray(rows) ? rows : [];
    const match = sessions.find((row: any) =>
      String(row.name ?? '').toLowerCase() === username.toLowerCase()
    );

    result.pppoe = {
      username,
      active: Boolean(match),
      address: match?.address,
      uptime: match?.uptime,
      callerId: match?.['caller-id'],
    };

    if (match) {
      result.findings.push({
        source: 'mikrotik',
        level: 'info',
        title: 'PPPoE session is active',
        detail: `Live MikroTik data shows an active PPPoE session for ${username}.`,
      });
    } else {
      result.findings.push({
        source: 'mikrotik',
        level: 'warning',
        title: 'No active PPPoE session',
        detail: `Live MikroTik data does not show an active PPPoE session for ${username}.`,
      });
    }
  } catch (error) {
    result.errors.push(`MikroTik telemetry: ${error instanceof Error ? error.message : 'request failed'}`);
  }
}

async function getOltOnu(result: CustomerTelemetry, customer: any) {
  const gateway = process.env.OLT_TELEMETRY_URL?.replace(/\/$/, '');
  if (!gateway) return;

  const token = process.env.OLT_TELEMETRY_TOKEN;
  const onuId = customer.onuId || customer.customerId;
  try {
    const response = await fetch(
      gateway + '/onu/status?onuId=' + encodeURIComponent(onuId),
      {
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!response.ok) throw new Error(`OLT gateway ${response.status}`);
    const data = await response.json();

    result.olt = {
      online: Boolean(data.online ?? data.reachable),
      onuRegistered: data.onuRegistered,
      opticalRx: data.opticalRx,
      opticalTx: data.opticalTx,
      lastSeen: data.lastSeen,
      detail: data.detail,
    };
    result.findings.push({
      source: 'onu',
      level: result.olt.online && result.olt.onuRegistered !== false ? 'info' : 'warning',
      title: result.olt.online ? 'ONU telemetry is online' : 'ONU telemetry reports offline',
      detail: data.detail || `Live OLT gateway status for ONU ${onuId}.`,
    });
  } catch (error) {
    result.errors.push(`OLT/ONU telemetry: ${error instanceof Error ? error.message : 'request failed'}`);
  }
}

export async function getCustomerTelemetry(customer: any): Promise<CustomerTelemetry> {
  const result: CustomerTelemetry = {
    checkedAt: new Date().toISOString(),
    live: false,
    findings: [],
    errors: [],
  };

  const username = customer.pppoeUsername;
  if (username && process.env.MIKROTIK_REST_URL) {
    await getMikrotik(username, result);
  }
  await getOltOnu(result, customer);

  result.live = result.findings.some((finding) =>
    finding.source === 'mikrotik' || finding.source === 'onu'
  );

  if (!result.live) {
    result.errors.push('No live telemetry provider is configured for this customer.');
  }

  return result;
}
