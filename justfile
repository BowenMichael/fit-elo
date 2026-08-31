# Central CLI task runner for fullstack local development

# List available recipes
default:
    @just --list

# Launch local development containers with live Docker Compose Watch
up:
    docker compose up --watch

# Launch local development containers in detached background mode
up-d:
    docker compose up -d

# Start only backend server and redis in background mode
server:
    docker compose up -d server

# Start only backend server with live logs attached
server-watch:
    docker compose up server

# Start backend server locally with node directly (without docker)
server-local:
    node server/index.js

# Stop containers and clean up local networks
down:
    docker compose down --remove-orphans

# Follow container logs for all services or a specific service (e.g. just logs server)
logs service="":
    docker compose logs -f {{service}}

# Open an interactive shell inside a container (defaults to 'web')
shell service="web":
    docker compose exec -it {{service}} sh

# Run the test suite inside the running web container
test:
    docker compose exec web npm test

# Display status of all running services
ps:
    docker compose ps

# Restart all containers or a specific service (e.g. just restart web)
restart service="":
    docker compose restart {{service}}

# Attach interactive terminal to Expo Metro packager to use keyboard controls (r, w, m)
expo-attach:
    docker attach app-web

# Launch Metro dev server for LAN Expo Go devices
expo-start:
    docker compose exec -it web npx expo start --host lan

# Launch Metro dev server specifically for Web browser targets
expo-web:
    docker compose exec -it web npx expo start --web

# Launch Metro dev server over tunnel for remote physical device testing
expo-tunnel:
    docker compose exec -it web npx expo start --tunnel

# Clear Expo and Metro bundler cache inside web container
expo-clear:
    docker compose exec -it web npx expo start --clear

# Reset local database / cache storage
db-reset:
    @echo "Resetting local redis cache..."
    docker compose exec redis redis-cli FLUSHALL

# ─── EAS Build & Submit ───────────────────────────────────────────────────────

# Build iOS production app via EAS (runs on EAS cloud)
# EAS_NO_VCS=1 bypasses git local clone errors on paths with special characters/spaces
eas-build-ios:
    export EAS_NO_VCS="1" && npx eas build --platform ios --profile production

# Build iOS development client via EAS
eas-build-ios-dev:
    export EAS_NO_VCS="1" && npx eas build --platform ios --profile development

# Submit latest iOS build to App Store Connect (TestFlight)
eas-submit-ios:
    export EAS_NO_VCS="1" && npx eas submit --platform ios --profile production --latest

# Build AND submit iOS production in one shot
eas-ship-ios:
    export EAS_NO_VCS="1" && npx eas build --platform ios --profile production --auto-submit
