/**
 * Optional helper: create realm `german` and client `german-backend` on an
 * already running Keycloak. This never starts Keycloak.
 * Skips unless KEYCLOAK_BOOTSTRAP=true.
 */
const KC_UA = "GermanGotEasyBackend/1.0";
const POLL_MS = 3_000;
const MAX_WAIT_MS = 180_000;

const SERVICE_ACCOUNT_ROLES = ["manage-users", "view-users", "query-users"] as const;

type KeycloakClient = {
  id?: string;
  clientId?: string;
  secret?: string;
  [key: string]: unknown;
};

type KeycloakRole = {
  id: string;
  name: string;
};

type KeycloakUser = {
  id: string;
};

const requiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required when KEYCLOAK_BOOTSTRAP=true`);
  }
  return value;
};

const trimSlash = (url: string) => url.replace(/\/$/, "");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formBody = (data: Record<string, string>) => new URLSearchParams(data).toString();

const readError = async (response: Response): Promise<string> => {
  const text = await response.text();
  return text || `${response.status} ${response.statusText}`;
};

const jsonFetch = async <T>(
  url: string,
  init: RequestInit,
): Promise<{ response: Response; data: T | null }> => {
  const response = await fetch(url, init);
  if (response.status === 204) {
    return { response, data: null };
  }
  const text = await response.text();
  if (!text) {
    return { response, data: null };
  }
  try {
    return { response, data: JSON.parse(text) as T };
  } catch {
    return { response, data: null };
  }
};

const waitForKeycloak = async (baseUrl: string): Promise<void> => {
  const started = Date.now();
  const probeUrl = `${baseUrl}/realms/master`;
  while (Date.now() - started < MAX_WAIT_MS) {
    try {
      const response = await fetch(probeUrl, { headers: { "User-Agent": KC_UA } });
      if (response.ok) {
        return;
      }
    } catch {
      // Keycloak is still starting.
    }
    await sleep(POLL_MS);
  }
  throw new Error(`Keycloak did not become ready at ${probeUrl}`);
};

const adminToken = async (
  baseUrl: string,
  username: string,
  password: string,
): Promise<string> => {
  const response = await fetch(`${baseUrl}/realms/master/protocol/openid-connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": KC_UA,
    },
    body: formBody({
      grant_type: "password",
      client_id: "admin-cli",
      username,
      password,
    }),
  });
  const data = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || typeof data.access_token !== "string") {
    throw new Error(
      `Keycloak admin login failed: ${data.error_description ?? `${response.status} ${response.statusText}`}`,
    );
  }
  return data.access_token;
};

const ensureRealm = async (
  baseUrl: string,
  token: string,
  realm: string,
): Promise<void> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": KC_UA,
  };
  const existing = await fetch(`${baseUrl}/admin/realms/${encodeURIComponent(realm)}`, {
    headers,
  });
  if (existing.ok) {
    return;
  }
  if (existing.status !== 404) {
    throw new Error(`Failed to read realm ${realm}: ${await readError(existing)}`);
  }

  const created = await fetch(`${baseUrl}/admin/realms`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      realm,
      enabled: true,
      registrationAllowed: false,
      loginWithEmailAllowed: true,
      duplicateEmailsAllowed: false,
      resetPasswordAllowed: true,
      editUsernameAllowed: false,
    }),
  });
  if (!created.ok && created.status !== 409) {
    throw new Error(`Failed to create realm ${realm}: ${await readError(created)}`);
  }
};

const getClientByClientId = async (
  baseUrl: string,
  token: string,
  realm: string,
  clientId: string,
): Promise<KeycloakClient | null> => {
  const { response, data } = await jsonFetch<KeycloakClient[]>(
    `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients?clientId=${encodeURIComponent(clientId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": KC_UA,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to list clients: ${await readError(response)}`);
  }
  return data?.[0] ?? null;
};

const ensureConfidentialClient = async (
  baseUrl: string,
  token: string,
  realm: string,
  clientId: string,
  clientSecret: string,
): Promise<string> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": KC_UA,
  };
  const existing = await getClientByClientId(baseUrl, token, realm, clientId);
  const clientBody = {
    clientId,
    name: "German Got Easy Backend",
    enabled: true,
    protocol: "openid-connect",
    publicClient: false,
    bearerOnly: false,
    secret: clientSecret,
    clientAuthenticatorType: "client-secret",
    standardFlowEnabled: false,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: true,
    serviceAccountsEnabled: true,
    authorizationServicesEnabled: false,
    fullScopeAllowed: true,
  };

  if (!existing?.id) {
    const created = await fetch(
      `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(clientBody),
      },
    );
    if (!created.ok && created.status !== 409) {
      throw new Error(`Failed to create client ${clientId}: ${await readError(created)}`);
    }
    const createdClient = await getClientByClientId(baseUrl, token, realm, clientId);
    if (!createdClient?.id) {
      throw new Error(`Client ${clientId} was created but could not be loaded`);
    }
    return createdClient.id;
  }

  const updated = await fetch(
    `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients/${existing.id}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({ ...existing, ...clientBody, id: existing.id }),
    },
  );
  if (!updated.ok) {
    throw new Error(`Failed to update client ${clientId}: ${await readError(updated)}`);
  }
  return existing.id;
};

const ensureServiceAccountRoles = async (
  baseUrl: string,
  token: string,
  realm: string,
  clientUuid: string,
): Promise<void> => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": KC_UA,
  };
  const { response: saResponse, data: saUser } = await jsonFetch<KeycloakUser>(
    `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients/${clientUuid}/service-account-user`,
    { headers },
  );
  if (!saResponse.ok || !saUser?.id) {
    throw new Error(`Failed to load service account user: ${await readError(saResponse)}`);
  }

  const realmMgmt = await getClientByClientId(baseUrl, token, realm, "realm-management");
  if (!realmMgmt?.id) {
    throw new Error("realm-management client not found");
  }

  const { response: rolesResponse, data: roles } = await jsonFetch<KeycloakRole[]>(
    `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/clients/${realmMgmt.id}/roles`,
    { headers },
  );
  if (!rolesResponse.ok || !roles) {
    throw new Error(`Failed to list realm-management roles: ${await readError(rolesResponse)}`);
  }

  const toAssign = SERVICE_ACCOUNT_ROLES.map((name) => {
    const role = roles.find((item) => item.name === name);
    if (!role) {
      throw new Error(`Missing realm-management role: ${name}`);
    }
    return { id: role.id, name: role.name };
  });

  const assigned = await fetch(
    `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/users/${saUser.id}/role-mappings/clients/${realmMgmt.id}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(toAssign),
    },
  );
  if (!assigned.ok && assigned.status !== 409) {
    throw new Error(`Failed to assign service account roles: ${await readError(assigned)}`);
  }
};

const run = async () => {
  if (process.env.KEYCLOAK_BOOTSTRAP !== "true") {
    return;
  }

  const publicUrl = requiredEnv("KEYCLOAK_URL");
  const baseUrl = trimSlash(process.env.KEYCLOAK_INTERNAL_URL || publicUrl);
  const realm = requiredEnv("KEYCLOAK_REALM");
  const clientId = requiredEnv("KEYCLOAK_BACKEND_CLIENT_ID");
  const clientSecret = requiredEnv("KEYCLOAK_BACKEND_CLIENT_SECRET");
  const adminUser = requiredEnv("KEYCLOAK_ADMIN_USERNAME");
  const adminPassword = requiredEnv("KEYCLOAK_ADMIN_PASSWORD");

  console.log(`[keycloak] waiting for ${baseUrl}`);
  await waitForKeycloak(baseUrl);

  const token = await adminToken(baseUrl, adminUser, adminPassword);
  await ensureRealm(baseUrl, token, realm);
  const clientUuid = await ensureConfidentialClient(
    baseUrl,
    token,
    realm,
    clientId,
    clientSecret,
  );
  await ensureServiceAccountRoles(baseUrl, token, realm, clientUuid);
  console.log(`[keycloak] realm ${realm} and client ${clientId} are ready`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
