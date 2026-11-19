# AWS deployment guide

Date: 2026-11-19 (Asia/Calcutta). This is a manual runbook for the initial release: private S3/CloudFront frontend, a single EC2 Node.js/Express API behind Nginx HTTPS, the existing MongoDB Atlas cluster and the existing private S3 media bucket. No AWS/Atlas resource changes or deployment were executed in this task. All angle-bracket values must be replaced with verified values. Commands below run on the deployment operator's machine or Ubuntu instance as indicated.

## 1. Account, region and billing

Use an AWS account with MFA on root and administrator identities. Use IAM Identity Center or a short-lived deployment role. Keep billing access separate from application permissions. Select `<AWS_REGION>` near the existing Atlas cluster/users and existing media bucket; avoid moving existing resources solely for this deployment. Review service availability and data-residency requirements. Set monthly AWS Budgets alerts at chosen warning/exceeded amounts and enable Cost Anomaly Detection. Review EC2/EBS/public IPv4, S3 requests/storage, CloudFront egress, Secrets Manager and CloudWatch ingestion/retention costs. Do not assume the release is free-tier eligible.

## 2. EC2, networking and OS

Use a supported Ubuntu 24.04 LTS AMI with encrypted gp3 EBS and IMDSv2 required. Node 24 LTS is the tested runtime family. A 2-vCPU/2-GB instance can run the API with AI disabled; 4 GB provides build/headroom. Choose x86_64 or ARM64 consistently with native bcrypt dependencies; build/install dependencies on the target architecture. No GPU is needed. Use an Elastic IP if Atlas connectivity/DNS needs a stable public IPv4 address. Monitor burstable-instance CPU credits.

Security group inbound: TCP 443 from intended public clients; TCP 80 for HTTPS redirect/ACME; TCP 22 only from `<ADMIN_CIDR>` if SSH is required. Prefer Systems Manager Session Manager with its narrowly scoped managed instance permissions. Never expose ports 5000, 27017 or 11434. Outbound must reach Atlas cluster nodes (normally TCP 27017), HTTPS for S3/package repositories/management services, DNS and time services. Verify Atlas connection-string topology and region rather than guessing addresses. A private subnet needs a documented NAT or endpoint path; it is optional for this initial single instance.

For SSH, use a dedicated key/user, prohibit password and root login, restrict source IP, install security updates and configure unattended updates. Keep time synchronized. Do not disable the host firewall. Configure it consistently with the security group; verify management access before changing it.

```sh
ssh -i <SSH_KEY_PATH> ubuntu@<EC2_PUBLIC_IP>
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install -y nginx git ca-certificates curl gnupg unzip certbot
sudo adduser --system --group --home /opt/societal societal
sudo install -d -o societal -g societal -m 0750 /opt/societal/releases
sudo install -d -o root -g root -m 0700 /etc/societal
```

## 3. Node and a reviewable release checkout

Install supported Node 24 LTS using an approved signed package source. One Ubuntu option is the NodeSource apt repository; review the vendor instructions and signing key before use:

```sh
sudo install -d -m 0755 /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
printf 'deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main\n' | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt-get update
sudo apt-get install -y nodejs
node --version
npm --version
command -v node
```

The service template expects `/usr/bin/node`; update that path if using a different approved installation. Never run production as root. Prepare a new release directory from the **reviewed release commit**. This repository currently has significant existing uncommitted/untracked work: an operator must include all intended fixes in a reviewed release snapshot before cloning. Do not deploy an old HEAD that omits them. This task did not commit or push.

```sh
sudo -u societal git clone <REPOSITORY_URL> /opt/societal/releases/<RELEASE_ID>
sudo -u societal git -C /opt/societal/releases/<RELEASE_ID> checkout --detach <RELEASE_COMMIT>
cd /opt/societal/releases/<RELEASE_ID>/server
sudo -u societal npm ci
sudo -u societal npm run build
sudo -u societal npm prune --omit=dev
```

Run the full tests/security audit in CI or a clean build workspace before pruning. `npm ci --omit=dev` alone cannot compile TypeScript; alternatively install production-only dependencies in a separate release directory and copy the already verified `dist` from the same commit/architecture. Start from a fresh directory so historical emitted test files cannot linger in `dist`. No seeding is part of deployment. Runtime requires `dist`, package manifests and production `node_modules`; do not serve repository files over HTTP.

## 4. Atlas network access and database permissions

Keep MongoDB Atlas; do not substitute DocumentDB. In the Atlas console, verify the existing cluster and database, enable TLS, and allow only the EC2 outbound Elastic IP `/32` or an approved private networking path. Do not use `0.0.0.0/0`. Create/use a dedicated database user limited to the application database, with permissions required by existing operations and transactions. Confirm replica-set/transaction support for team creation/invitation workflows. Confirm all intended unique indexes already exist, including unique user email and membership/invitation indexes. Production disables automatic index creation; missing indexes require a separately reviewed database operation. No destructive seed/migration command is recommended.

Place the exact Atlas URI in the protected environment file. URI-encode credential characters and verify the intended database. The API's database connection deadline is 10 seconds. Review Atlas backup/PITR settings and retention. An operator must verify backup recovery and transaction behavior in an explicitly disposable staging environment.

## 5. Media S3 and IAM

Use the **existing private media bucket**, distinct from the static frontend bucket. Keep Block Public Access enabled, bucket ownership enforced, TLS required and encryption enabled. Attach the reviewed instance profile to EC2; the SDK now uses the default AWS credential chain when static keys are omitted. Require IMDSv2. Never ship AWS credentials to React.

`deploy/aws/media-iam-policy.json` is a minimum identity-policy template: `s3:PutObject` and `s3:GetObject` only on `problems/*` and `solutions/*` in the specific bucket. `HeadObject` uses GetObject permission. No ListBucket, ACL, wildcard bucket access or DeleteObject is needed by the current media API. Missing object HEAD without ListBucket may return 403 and be treated as unavailable instead of missing; grant no extra permissions solely to distinguish that response. SSE-KMS buckets additionally require reviewed `kms:GenerateDataKey`/`kms:Decrypt` on the exact key with appropriate service conditions. SSE-S3 needs no KMS application permissions.

The previous integration identity lacked DeleteObject. Do not add it or attempt cleanup with that identity. Unattached uploads may remain; choose any lifecycle/cleanup policy in a separately authorized storage review after identifying retained evidence. Presigned PUT/GET last five minutes (or less if source credentials expire). PUT signs size and content type; attachment verifies stored size/type and an image signature. Supported files are JPEG/PNG/WebP up to 10 MiB. URLs remain bearer capabilities until expiry; do not log/share them.

Review `deploy/aws/media-cors.json`, substitute the frontend's exact HTTPS origin, and merge with verified existing bucket CORS instead of blindly replacing it. The JSON uses AWS CLI `CORSRules` format; the S3 console editor expects the inner rule array. Example operator command, **only after separate authorization for the bucket update**:

```sh
aws s3api put-bucket-cors --region <AWS_REGION> --bucket <PRIVATE_MEDIA_BUCKET> --cors-configuration file://<REVIEWED_MEDIA_CORS_FILE>
```

Before release, test real signed PUT/GET, headers and denied cross-account access using approved disposable resources. No such transfers were executed here.

## 6. Environment and Secrets Manager

Fill `server/.env.example` using verified production values and install it as `/etc/societal/api.env`, owned by root with mode 0600. Systemd reads the file before dropping privileges; source code need not read it. Keep `NODE_ENV=production`, `PORT=5000`, `HOST=127.0.0.1`, `TRUST_PROXY=loopback`, exact HTTPS `CORS_ORIGIN`, strong existing/generated JWT secret, stable issuer/audience, the Atlas URI and the verified media region/bucket. Static AWS keys should be absent when using an instance role. Temporary local credentials may include `AWS_SESSION_TOKEN`. See `JWT_SECURITY_AUDIT.md` for secret generation and re-login behavior. Never copy a development `.env` into a frontend build folder.

Optional Secrets Manager integration uses an operator/boot-time fetch, without another application SDK dependency. Store the complete **dotenv-formatted file as plaintext SecretString**, preserving newlines; this example is not for a JSON object of separate secrets. Permit only `secretsmanager:GetSecretValue` on `<SECRET_ARN>` to the bootstrap identity and `kms:Decrypt` on the exact CMK if one is used. Do not log output, enable shell tracing or put secret values on command lines. Use approved AWS CLI credentials or the instance role:

```sh
sudo sh -c 'umask 077; aws secretsmanager get-secret-value --region "<AWS_REGION>" --secret-id "<SECRET_ARN>" --query SecretString --output text > /etc/societal/api.env.next'
sudo node --env-file=/etc/societal/api.env.next -e "require('/opt/societal/current/server/dist/config/env'); console.log('Configuration valid')"
sudo install -o root -g root -m 0600 /etc/societal/api.env.next /etc/societal/api.env
```

Validate against the new release path if `current` is not installed yet. Review dotenv quoting/systemd EnvironmentFile compatibility; avoid comments attached to unquoted values. Fetch on controlled startup/deployment, not every request. Keep a protected prior configuration for rollback; an approved secret-version change requires fetching/restarting the service. This task did not provision a secret, rotate it or grant permissions.

## 7. Process management, startup and shutdown

Use the supplied hardened systemd unit. The API binds locally, serves liveness `/api/health` and database readiness `/api/ready`, and closes HTTP/MongoDB on SIGTERM/SIGINT. Shutdown has a 15-second deadline; systemd allows 20 seconds. Request/header/keepalive timeouts are bounded. Uncaught failures exit and systemd restarts with rate protection. File protections assume the application writes no local files; runtime logs use journald. Verify any future filesystem requirement before weakening the service.

```sh
sudo ln -s /opt/societal/releases/<RELEASE_ID> /opt/societal/current
sudo install -m 0644 /opt/societal/current/deploy/aws/societal-api.service /etc/systemd/system/societal-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now societal-api
sudo systemctl status societal-api --no-pager
curl --fail http://127.0.0.1:5000/api/health
curl --fail http://127.0.0.1:5000/api/ready
sudo journalctl -u societal-api -n 100 --no-pager
```

For later releases use the atomic symlink procedure in rollback below. Do not run PM2 cluster mode with this process-local limiter. No Docker, Kubernetes, ECS, Lambda or Terraform is required.

## 8. Nginx and HTTPS

Create an API DNS A record for `<API_DOMAIN>` pointing at `<EC2_PUBLIC_IP>`. Obtain a public certificate before enabling the TLS server template. Bootstrap a temporary port-80 site serving `/.well-known/acme-challenge/` from `/var/www/letsencrypt`, with the exact API server name. Then:

Use this temporary site in `/etc/nginx/sites-available/societal-api-bootstrap`, render its placeholder, and symlink it into sites-enabled before the certificate request:

```nginx
server {
    listen 80;
    server_name <API_DOMAIN>;
    location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location / { return 404; }
}
```

```sh
sudo install -d -m 0755 /var/www/letsencrypt
sudo nginx -t
sudo systemctl reload nginx
sudo certbot certonly --webroot -w /var/www/letsencrypt -d <API_DOMAIN> --email <OPERATOR_EMAIL> --agree-tos
sudo install -m 0644 <RENDERED_NGINX_CONFIG> /etc/nginx/sites-available/societal-api
sudo mv /etc/nginx/sites-enabled/societal-api-bootstrap /etc/societal/nginx-bootstrap.disabled
sudo ln -s /etc/nginx/sites-available/societal-api /etc/nginx/sites-enabled/societal-api
sudo nginx -t
sudo systemctl reload nginx
sudo certbot renew --dry-run
curl --fail https://<API_DOMAIN>/api/ready
```

Render `deploy/aws/nginx-api.conf` by replacing `<API_DOMAIN>` and `<FRONTEND_DOMAIN>` and verify certificate paths. Zones/log formats/origin map belong in `http {}`; Ubuntu includes sites there. Review conflicts with any existing default server. Add a Certbot deploy hook to reload Nginx after renewal, test it and monitor renewal failures. The API port remains unreachable publicly. Nginx forwards paths unchanged, overwrites proxy headers, limits request bodies and returns JSON for 429/413 with CORS for the exact configured frontend origin. If multiple frontend origins are needed, add their exact values to the reviewed map. Its auth quota is five requests/minute with burst five, supplementing application limits. Tune quotas only from measured legitimate traffic; preserve protection.

No domain means this exact public API TLS path is a prerequisite still unresolved; do not enable public HTTP bearer authentication. CloudFront's provided HTTPS hostname can serve the frontend without a custom domain, but the API still needs a trusted HTTPS endpoint. Route 53 is optional if an existing DNS provider is used.

## 9. React build and static S3 delivery

On a trusted build machine in a clean reviewed checkout, install frontend dependencies and set **only public** settings. `VITE_API_URL` is required for production, must use HTTPS and end in `/api`; it is compiled into the bundle. Changing it requires rebuilding. AI defaults off in production; keep `VITE_AI_ENABLED=false` paired with backend `AI_ENABLED=false` for the initial release.

```sh
cd <RELEASE_CHECKOUT>/web
npm ci
VITE_API_URL=https://<API_DOMAIN>/api VITE_AI_ENABLED=false npm run build
```

Normal output is `web/dist`. If the local historical Windows cleanup permission issue returns, use `npm run build -- --outDir <FRESH_OUTPUT_DIRECTORY>` with the same environment values. Use the verified output path in subsequent commands; do not bypass a TypeScript failure. Keep source and credentials outside the uploaded directory.

Create a separate `<FRONTEND_BUCKET>` with Block Public Access and encryption enabled. Use a private S3 **REST origin**, not the public website endpoint. Enable versioning if desired for release recovery. Give the frontend deployment role only the object write/list permissions required on this bucket; it must not be the media runtime identity. Archive each build in an approved release-artifact location.

Upload hashed assets first and HTML last. Avoid deleting old assets so cached HTML and rollback continue working:

```sh
aws s3 sync <FRONTEND_OUTPUT_DIRECTORY>/assets/ s3://<FRONTEND_BUCKET>/assets/ --region <AWS_REGION> --cache-control 'public,max-age=31536000,immutable'
aws s3 cp <FRONTEND_OUTPUT_DIRECTORY>/ s3://<FRONTEND_BUCKET>/ --recursive --exclude 'assets/*' --exclude 'index.html' --region <AWS_REGION> --cache-control 'public,max-age=300'
aws s3 cp <FRONTEND_OUTPUT_DIRECTORY>/index.html s3://<FRONTEND_BUCKET>/index.html --region <AWS_REGION> --content-type 'text/html' --cache-control 'no-cache,no-store,must-revalidate'
```

## 10. CloudFront, SPA routing and frontend headers

Create a CloudFront distribution with the private S3 REST origin and Origin Access Control (always sign origin requests). Review `deploy/aws/frontend-bucket-policy.json` and restrict GetObject to the exact distribution ARN. Default root object: `index.html`; viewer protocol: redirect HTTP to HTTPS; allowed methods: GET/HEAD (OPTIONS only if actually required); enable compression. Set index/default behavior minimum/default cache TTL to 0 so HTML's no-store is honored. Add `/assets/*` behavior for long-lived hashed assets. Do not cache the API through this frontend distribution.

Create/publish the CloudFront Function from `deploy/aws/spa-rewrite.js` (runtime JavaScript 2.0) and associate it with **viewer-request on the default frontend behavior**. It rewrites extensionless GET/HEAD routes such as `/problems`, `/teams/<ID>` and `/solutions/<ID>` to `/index.html`; assets keep their object paths and missing asset errors remain errors. This provides SPA fallback without turning all S3 403/404s into HTML. Test direct navigation and reloads. If using custom-error fallback instead, configure 403/404 to index/200 with error TTL 0 and understand the missing-asset HTML limitation; the Function is preferred.

Attach a custom response headers policy to both default/assets behaviors: HSTS (one year after HTTPS is verified), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, and an appropriate Permissions-Policy (allow geolocation for self because the location picker needs it; disable camera/microphone unless required). CSP template, after substituting only verified hosts:

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://<PRIVATE_MEDIA_BUCKET>.s3.<AWS_REGION>.amazonaws.com https://*.tile.openstreetmap.org; connect-src 'self' https://<API_DOMAIN> https://<PRIVATE_MEDIA_BUCKET>.s3.<AWS_REGION>.amazonaws.com; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests
```

Verify the actual signed URL hostname and any legitimate map hosts; allow exact additional S3 endpoint forms only if observed. Inline styling is required by the existing design, but inline scripts are not. Test map/media uploads under this policy before public release. Set CloudFront response-header override where needed. For a custom frontend domain, request ACM in **us-east-1** (CloudFront requirement), validate domain ownership and attach the certificate/alternate domain. Use Route 53 A/AAAA alias records to the distribution, or equivalent existing-DNS records. API certificates stay with Nginx/Certbot; Route 53 does not itself terminate TLS.

```sh
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths '/index.html' '/'
```

Wait for distribution/function/header changes and invalidation to finish before checking. All AWS commands here are manual actions requiring operator authorization; none were run in this task.

## 11. CORS, monitoring and release acceptance

Backend `CORS_ORIGIN` is a comma-separated list of exact HTTPS origins, with no wildcard, path or credentials. Use the CloudFront custom domain or verified distribution hostname actually visited. CORS does not replace authentication. Browser requests use Authorization headers; no cookie credentials/CSRF migration was introduced. Ensure bucket CORS separately permits the same frontend origin for signed uploads.

Send journald/application and Nginx logs to CloudWatch using a reviewed agent configuration or existing log pipeline. Use a narrowly scoped logging role, explicit log groups and retention (for example 14–30 days according to policy). Set alarms on instance status, sustained CPU/memory/disk use, process restarts, readiness failure, API 5xx/storage 503 and auth 429 trends. Nginx access logs omit query strings/Authorization; restrict raw error-log access, since upstream errors may include request context. Do not enable debug logs, body logging or secret-valued environment dumps. Monitor Atlas connection capacity/backups and S3 access errors. Health endpoints expose no configuration/secrets; `/ready` fails when MongoDB is disconnected, while optional AI unavailability does not fail the API.

Release gates in a confirmed disposable staging environment:

1. Verify `/health` and `/ready`, trusted HTTPS, certificate renewal, no public backend/Ollama ports and production startup validation.
2. Run production dependency advisory checks: `npm audit --omit=dev` in server/web, review findings rather than blindly applying forced upgrades.
3. Verify registration/login/logout/reload/expiry; USER/STUDENT ADMIN denials; persisted role demotion and disabled/deleted user denial.
4. Verify categories, problem reporting/map/upload/partial-upload retry, admin evidence requests/responses and verification.
5. Verify challenge creation/visibility, applications, teams, invitations, solution submission/review, milestones/implementation/impact and real Atlas transactions.
6. Verify S3 signed size/type enforcement, bucket CORS, authorized downloads and private evidence isolation. Do not use existing production records as test fixtures.
7. Verify direct SPA route reloads, CSP/map/media behavior, mobile layouts and helpful offline errors. With AI disabled, the AI action must be absent; with local AI enabled privately, failed inference must preserve drafts.
8. Exercise SIGTERM/restart, Atlas unavailable readiness, monitoring, retained release rollback and a database backup restore procedure in staging.

## 12. Safe release switching and rollback

Keep the previous reviewed release directory, frontend build, secret version/configuration and Nginx config. No schema/data migration is included in this change. Use a same-filesystem symlink switch; do not copy new output over a running release:

```sh
sudo ln -s /opt/societal/releases/<NEW_RELEASE_ID> /opt/societal/current.next
sudo mv -Tf /opt/societal/current.next /opt/societal/current
sudo systemctl restart societal-api
curl --fail http://127.0.0.1:5000/api/ready
```

On failed acceptance, switch the symlink to `<PREVIOUS_RELEASE_ID>` with the same procedure and restart. Restore only the matching protected environment/Nginx configuration when necessary; validate `nginx -t` before reload. Restore the prior frontend assets/HTML from the retained build (assets first, HTML last), then invalidate index/root. Keep new/old hashed assets; do not use `s3 sync --delete`. Avoid credential rotation during rollback. JWT scope/lifetime changes can require re-login; rolling back to older weaker auth should be an explicit temporary decision, and must never reactivate disabled accounts by accident. Prefer restoring the last security-compatible release. Check health/readiness and multi-role flows after rollback. Never drop collections, run destructive seeds or delete media as rollback.

## 13. Optional private Ollama later

Initial production defaults are `AI_ENABLED=false` and `VITE_AI_ENABLED=false`; no model is downloaded. Local development retains `http://127.0.0.1:11434` and `llama3.1:8b`. Future Ollama may run on a separately approved GPU EC2 instance in private networking. Restrict TCP 11434 to the backend's security group, require an approved protected transport between hosts, deny public ingress, set a private `OLLAMA_BASE_URL`, explicitly manage model installation/storage/cost and test bounded 60-second requests. Then enable both flags and rebuild React. GPU sizing, model download and deployment are not implemented here; manual problem reporting remains independent of AI.
