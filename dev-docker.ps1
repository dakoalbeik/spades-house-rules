param(
    [int]$Port = 4000,
    [string]$AdminPassword = "admin"
)

$ImageName = "spades-multiplayer"
$ContainerName = "spades-multiplayer"

Write-Host "Building image '$ImageName'..." -ForegroundColor Cyan
docker build -t $ImageName .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}

# Stop and remove existing container if running
$existing = docker ps -aq --filter "name=$ContainerName"
if ($existing) {
    Write-Host "Stopping existing container..." -ForegroundColor Yellow
    docker stop $ContainerName | Out-Null
    docker rm $ContainerName | Out-Null
}

Write-Host "Starting container on port $Port..." -ForegroundColor Cyan
docker run -d `
    --name $ContainerName `
    -p "${Port}:8080" `
    -e ADMIN_PASSWORD=$AdminPassword `
    $ImageName

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start container." -ForegroundColor Red
    exit 1
}

Write-Host "Done. App running at http://localhost:$Port" -ForegroundColor Green
