export const SAMPLE_YAML = `app:
  name: config-converter
  port: 8080
  debug: true
database:
  host: localhost
  port: 5432
  credentials:
    user: admin
    password: s3cr3t
  pool:
    min: 2
    max: 10
redis:
  url: redis://localhost:6379
features:
  - auth
  - billing
  - analytics
cors:
  origins:
    - https://example.com
    - https://app.example.com
logging:
  level: info
  json: false
`;

export const SAMPLE_CONFIGMAP = `NODE_ENV: "production"
APP_NAME: "config-converter"
APP_PORT: "8080"
APP_DEBUG: "false"
SERVER_HOST: "0.0.0.0"
SERVER_PORT: "3001"
SERVER_IDLE_TIMEOUT_SECONDS: "120"
DATABASE_HOST: "localhost"
DATABASE_PORT: "5432"
FEATURES: "auth,billing,analytics"
CORS_ORIGINS: "https://example.com,https://app.example.com"
`;

export const SAMPLE_ENV = `APP_NAME=config-converter
APP_PORT=8080
APP_DEBUG=true
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_CREDENTIALS_USER=admin
DATABASE_CREDENTIALS_PASSWORD=s3cr3t
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
REDIS_URL=redis://localhost:6379
FEATURES=auth,billing,analytics
CORS_ORIGINS=https://example.com,https://app.example.com
LOGGING_LEVEL=info
LOGGING_JSON=false
`;
