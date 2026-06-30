# Deploying Inday on AWS (Docker + Kubernetes/EKS)

This app runs a **custom Node server** (`server.mjs`) that serves Next.js **and** a
WebSocket endpoint at `/api/ws` for live chat. The container starts with
`node server.mjs` — not `next start`.

## Architecture on AWS

| Concern        | Service                                             |
| -------------- | --------------------------------------------------- |
| Image registry | Amazon ECR                                          |
| Orchestration  | Amazon EKS (Kubernetes)                             |
| Database       | Amazon RDS for PostgreSQL                           |
| Ingress/TLS    | AWS Load Balancer Controller → ALB + ACM cert       |
| Image storage  | Cloudinary (external; needs `CLOUDINARY_*` secrets) |

---

## 1. Prerequisites

- `aws`, `kubectl`, `docker`, and `eksctl` (or Terraform) installed and configured.
- An EKS cluster with the **AWS Load Balancer Controller** installed:
  https://kubernetes-sigs.github.io/aws-load-balancer-controller/
- An RDS PostgreSQL instance reachable from the cluster's VPC/subnets.
- An ACM certificate for your domain (e.g. `inday.example.com`).

---

## 2. Build & push the image to ECR

```bash
export AWS_REGION=us-east-1
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
export IMAGE=$ECR/inday:$(git rev-parse --short HEAD)

# One-time: create the repo
aws ecr create-repository --repository-name inday --region $AWS_REGION || true

# Log in, build (for the cluster's arch — usually linux/amd64), push
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR

docker build --platform linux/amd64 -t $IMAGE .
docker push $IMAGE
```

> If you build on Apple Silicon, `--platform linux/amd64` matters — Prisma's
> engine and the runtime must match the node architecture.

---

## 3. Create namespace, config, and secrets

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml

# Create the secret (preferred over committing secret.yaml):
kubectl -n inday create secret generic inday-secrets \
  --from-literal=DATABASE_URL='postgresql://USER:PASS@RDS_HOST:5432/inday?schema=public&sslmode=require' \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=NEXTAUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=NEXTAUTH_URL='https://inday.example.com' \
  --from-literal=CLOUDINARY_CLOUD_NAME='...' \
  --from-literal=CLOUDINARY_API_KEY='...' \
  --from-literal=CLOUDINARY_API_SECRET='...'
```

See `k8s/secret.example.yaml` for the field reference. For production, prefer the
**External Secrets Operator** backed by AWS Secrets Manager instead of a raw Secret.

---

## 4. Run database migrations

Set the image in `k8s/migrate-job.yaml` (or patch it inline), then:

```bash
sed "s#REGISTRY/inday:TAG#$IMAGE#" k8s/migrate-job.yaml | kubectl apply -f -
kubectl -n inday wait --for=condition=complete job/inday-migrate --timeout=180s
kubectl -n inday logs job/inday-migrate
```

Re-running later: `kubectl -n inday delete job inday-migrate` first (job specs are immutable).

---

## 5. Deploy the app

```bash
sed "s#REGISTRY/inday:TAG#$IMAGE#" k8s/deployment.yaml | kubectl apply -f -
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml   # edit host + certificate-arn first

kubectl -n inday rollout status deploy/inday-web
kubectl -n inday get ingress inday   # grab the ALB DNS name for your Route 53 record
```

Point a Route 53 (or other DNS) **A/ALIAS** record for `inday.example.com` at the
ALB hostname shown in the Ingress.

---

## 6. Upgrades

```bash
export IMAGE=$ECR/inday:$(git rev-parse --short HEAD)
docker build --platform linux/amd64 -t $IMAGE . && docker push $IMAGE

# migrate first if the schema changed, then:
kubectl -n inday set image deploy/inday-web web=$IMAGE
kubectl -n inday rollout status deploy/inday-web
```

---

## Scaling the WebSocket layer (read before bumping `replicas`)

`server.mjs` keeps chat rooms in **in-process memory** (`const rooms = new Map()`).
With more than one pod, two users in the same conversation may connect to
different pods and won't receive each other's live messages (the persisted
message is still saved, so a refresh shows it).

To scale horizontally, add a shared fanout — typically **Redis pub/sub** (AWS
ElastiCache): publish each new message to a `conversation:<id>` channel and have
every pod subscribe and re-broadcast to its local sockets. Once that's in place,
raise `replicas` in `k8s/deployment.yaml` and optionally add an HPA. ALB sticky
sessions (already set on the Ingress) keep a given client pinned to one pod.

Until then, **keep `replicas: 1`.** Vertical scaling (bigger CPU/memory requests)
is the safe lever.

---

## Local sanity check (optional)

```bash
docker build -t inday:local .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL='postgresql://...' \
  -e AUTH_SECRET='dev-secret' -e NEXTAUTH_SECRET='dev-secret' \
  -e NEXTAUTH_URL='http://localhost:3000' \
  inday:local
# then: curl localhost:3000/api/health
```
